from fastapi import APIRouter
from typing import List, Dict, Any
from app.engine.battery import load_attack_battery
from app.schemas.pydantic_schemas import AttackTestCaseSchema

router = APIRouter(prefix="/battery", tags=["Attack Battery"])

CATEGORY_METADATA = {
    "DIR_OVR": {
        "name": "Direct Instruction Override",
        "description": "Adversarial prompts designed to reset context and supersede core directives.",
        "owasp": "OWASP LLM01: Direct Prompt Injection",
        "severity": "HIGH"
    },
    "SYS_LEAK": {
        "name": "System Prompt Exfiltration",
        "description": "Probes aimed at tricking the model into disclosing its initial instructions or confidential canary tokens.",
        "owasp": "OWASP LLM06: Sensitive Information Disclosure",
        "severity": "CRITICAL"
    },
    "DELIM_ESC": {
        "name": "Delimiter & Syntax Manipulation",
        "description": "Exploiting markdown blocks, XML tags, or prompt delimiters to induce boundary confusion.",
        "owasp": "OWASP LLM01: Delimiter Hijacking",
        "severity": "MEDIUM"
    },
    "ROLE_HYP": {
        "name": "Role-Play & Cognitive Framing",
        "description": "Adversarial persona adoption (e.g. ChaosGPT, DAN) and fictional screenplay framing.",
        "owasp": "OWASP LLM01: Role-Play Jailbreaks",
        "severity": "HIGH"
    },
    "IND_INJ": {
        "name": "Indirect Data Injection Simulation",
        "description": "Adversarial instructions concealed inside third-party untrusted data (emails, JSON records).",
        "owasp": "OWASP LLM01: Indirect Prompt Injection",
        "severity": "CRITICAL"
    },
    "PAY_ENC": {
        "name": "Encoding & Obfuscation",
        "description": "Base64, Hex, or cipher obfuscated payloads designed to bypass raw keyword filters.",
        "owasp": "OWASP LLM01: Obfuscated Payloads",
        "severity": "MEDIUM"
    },
    "CTX_CONF": {
        "name": "Context Confusion & Distraction",
        "description": "Context padding and distractor tasks designed to displace system policies from immediate attention.",
        "owasp": "OWASP LLM01: Context Overflow",
        "severity": "MEDIUM"
    }
}

@router.get("", response_model=List[AttackTestCaseSchema])
async def get_attack_battery():
    """Returns the full battery of structured attack test cases."""
    return load_attack_battery()

@router.get("/categories", response_model=Dict[str, Any])
async def get_categories():
    """Returns metadata and OWASP mappings for all 7 attack categories."""
    return CATEGORY_METADATA
