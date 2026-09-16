import time
import json
import httpx
from typing import Tuple, Dict, Any, Optional
from app.core.config import settings
from app.core.security import validate_url_safety
from app.engine.sandbox import SandboxSimulator

class TargetAdapter:
    """Base interface for all target connectors."""
    async def send_prompt(self, prompt: str, attack_id: Optional[str] = None) -> Tuple[str, float]:
        raise NotImplementedError

class SandboxTargetAdapter(TargetAdapter):
    """Adapter for the Built-in Zero-Key Sandbox Simulator."""
    def __init__(self, mode: str = "MIXED", canary_secret: str = "SECRET_FLAG_PROMPT_SHIELD_99"):
        self.simulator = SandboxSimulator(mode=mode, canary_secret=canary_secret)

    async def send_prompt(self, prompt: str, attack_id: Optional[str] = None) -> Tuple[str, float]:
        return await self.simulator.execute_prompt(prompt, attack_id=attack_id)

class OpenAITargetAdapter(TargetAdapter):
    """Adapter for OpenAI-compatible chat completion APIs."""
    def __init__(
        self,
        base_url: str,
        api_key: Optional[str],
        model_name: Optional[str],
        system_prompt: Optional[str] = None,
        timeout: float = settings.PROBE_TIMEOUT_SECONDS
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key or ""
        self.model_name = model_name or "gpt-4o-mini"
        self.system_prompt = system_prompt or "You are a helpful AI assistant."
        self.timeout = timeout

        is_safe, reason = validate_url_safety(self.base_url)
        if not is_safe:
            raise ValueError(f"Target connection blocked by SSRF firewall: {reason}")

    async def send_prompt(self, prompt: str, attack_id: Optional[str] = None) -> Tuple[str, float]:
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}" if self.api_key else ""
        }
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": settings.MAX_TOKENS_DEFAULT,
            "temperature": 0.0  # Deterministic test responses
        }

        start_time = time.perf_counter()
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, headers=headers, json=payload)
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

            if resp.status_code != 200:
                raise RuntimeError(f"Target API returned HTTP {resp.status_code}: {resp.text[:200]}")

            data = resp.json()
            choices = data.get("choices", [])
            if not choices:
                return "", latency_ms
            reply = choices[0].get("message", {}).get("content", "")
            return reply[:settings.MAX_RESPONSE_BYTES], latency_ms

class WebhookTargetAdapter(TargetAdapter):
    """Adapter for Custom REST Webhook APIs."""
    def __init__(
        self,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        body_template: Optional[str] = None,
        response_jsonpath: Optional[str] = None,
        timeout: float = settings.PROBE_TIMEOUT_SECONDS
    ):
        self.url = url
        self.headers = headers or {"Content-Type": "application/json"}
        self.body_template = body_template or '{"prompt": "{{PROMPT}}"}'
        self.response_jsonpath = response_jsonpath or "response"
        self.timeout = timeout

        is_safe, reason = validate_url_safety(self.url)
        if not is_safe:
            raise ValueError(f"Target webhook blocked by SSRF firewall: {reason}")

    async def send_prompt(self, prompt: str, attack_id: Optional[str] = None) -> Tuple[str, float]:
        # Simple template substitution escaping quotes
        escaped_prompt = json.dumps(prompt)[1:-1]
        req_body_str = self.body_template.replace("{{PROMPT}}", escaped_prompt)
        
        try:
            req_json = json.loads(req_body_str)
        except Exception:
            req_json = {"prompt": prompt}

        start_time = time.perf_counter()
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(self.url, headers=self.headers, json=req_json)
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

            if resp.status_code != 200:
                raise RuntimeError(f"Target Webhook returned HTTP {resp.status_code}: {resp.text[:200]}")

            # Extract response field
            try:
                data = resp.json()
                if isinstance(data, dict):
                    # Simple key extraction
                    key = self.response_jsonpath.replace("$.", "").strip()
                    extracted = data.get(key, str(data))
                else:
                    extracted = str(data)
            except Exception:
                extracted = resp.text

            return str(extracted)[:settings.MAX_RESPONSE_BYTES], latency_ms

def create_target_adapter(target_config: Any) -> TargetAdapter:
    """Factory to instantiate the appropriate adapter for a target configuration."""
    ttype = getattr(target_config, "target_type", "").upper()
    if ttype == "SANDBOX":
        mode = getattr(target_config, "sandbox_mode", "MIXED") or "MIXED"
        canary = getattr(target_config, "canary_secret", "SECRET_FLAG_PROMPT_SHIELD_99")
        return SandboxTargetAdapter(mode=mode, canary_secret=canary)

    if ttype == "OPENAI":
        base_url = getattr(target_config, "base_url", None)
        if not base_url:
            raise ValueError("Base URL is required for OpenAI-compatible target.")
        return OpenAITargetAdapter(
            base_url=base_url,
            api_key=getattr(target_config, "api_key", None),
            model_name=getattr(target_config, "model_name", None),
            system_prompt=getattr(target_config, "system_prompt", None)
        )

    if ttype == "CUSTOM_WEBHOOK":
        url = getattr(target_config, "base_url", None)
        if not url:
            raise ValueError("Endpoint URL is required for Custom Webhook target.")
        return WebhookTargetAdapter(
            url=url,
            headers=getattr(target_config, "custom_headers", None),
            body_template=getattr(target_config, "custom_body_template", None),
            response_jsonpath=getattr(target_config, "response_jsonpath", None)
        )

    raise ValueError(f"Unknown target type: {ttype}")
