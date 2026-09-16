import pytest
from app.core.security import validate_url_safety, mask_api_key

def test_api_key_masking():
    assert mask_api_key(None) == ""
    assert mask_api_key("short") == "********"
    assert mask_api_key("sk-proj-1234567890abcdef") == "sk-p...cdef"

def test_ssrf_blocking_private_ips():
    # Private 10.0.0.0/8
    safe, msg = validate_url_safety("http://10.0.0.1/api")
    assert not safe
    assert "SSRF Block" in msg

    # AWS metadata IP
    safe, msg = validate_url_safety("http://169.254.169.254/latest/meta-data/")
    assert not safe
    assert "SSRF Block" in msg

    # Loopback on non-whitelisted port
    safe, msg = validate_url_safety("http://127.0.0.1:8080/admin")
    assert not safe
    assert "SSRF Block" in msg

def test_ssrf_whitelisting_ollama():
    # Localhost on Ollama port 11434 is explicitly permitted
    safe, msg = validate_url_safety("http://localhost:11434/v1")
    assert safe
    assert "Ollama" in msg

    safe, msg = validate_url_safety("http://127.0.0.1:11434/v1")
    assert safe

def test_ssrf_public_urls():
    safe, msg = validate_url_safety("https://api.openai.com/v1")
    assert safe

    safe, msg = validate_url_safety("https://api.anthropic.com/v1")
    assert safe
