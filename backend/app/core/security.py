import ipaddress
import re
from urllib.parse import urlparse
from app.core.config import settings

# Private IP networks to block for SSRF prevention
BLOCKED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),       # Link-local / Cloud metadata (AWS, GCP, Azure)
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("224.0.0.0/4"),         # Multicast
    ipaddress.ip_network("240.0.0.0/4"),         # Reserved
    ipaddress.ip_network("::1/128"),             # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),            # IPv6 unique local
    ipaddress.ip_network("fe80::/10"),           # IPv6 link-local
]

def mask_api_key(key: str | None) -> str:
    """Masks an API key for safe storage display without revealing secrets."""
    if not key:
        return ""
    if len(key) <= 8:
        return "********"
    return f"{key[:4]}...{key[-4:]}"

def validate_url_safety(url_str: str) -> tuple[bool, str]:
    """
    Validates a URL against SSRF attacks (private subnet probing, cloud metadata).
    Safely whitelists local Ollama instances on port 11434 if enabled.
    """
    if not url_str or not isinstance(url_str, str):
        return False, "Target URL cannot be empty."

    try:
        parsed = urlparse(url_str.strip())
    except Exception as e:
        return False, f"Malformed URL format: {str(e)}"

    if parsed.scheme not in ["http", "https"]:
        return False, f"Unsupported URL scheme '{parsed.scheme}'. Only HTTP and HTTPS are permitted."

    hostname = parsed.hostname
    if not hostname:
        return False, "Target URL must contain a valid hostname."

    port = parsed.port or (443 if parsed.scheme == "https" else 80)

    # Check for local Ollama whitelist exception
    if settings.ALLOW_LOCALHOST_OLLAMA:
        if hostname.lower() in ["localhost", "127.0.0.1", "::1"] and port == settings.OLLAMA_PORT:
            return True, "Safe: Local Ollama instance authorized."

    # Reject cloud metadata domains explicitly
    if hostname.lower() in ["metadata.google.internal", "instance-data"]:
        return False, "SSRF Block: Access to cloud instance metadata service is forbidden."

    # Resolve IP address check
    try:
        ip = ipaddress.ip_address(hostname)
        for net in BLOCKED_NETWORKS:
            if ip in net:
                return False, f"SSRF Block: Access to private/internal network IP ({ip}) is prohibited."
    except ValueError:
        # Hostname is a domain name (not a raw IP).
        # Prohibit localhost/internal domains unless whitelisted above
        if hostname.lower() in ["localhost", "127.0.0.1"] and port != settings.OLLAMA_PORT:
            return False, f"SSRF Block: Access to local host on port {port} is prohibited."

    return True, "URL validated successfully."
