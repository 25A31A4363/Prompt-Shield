from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "PromptShield"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "sqlite+aiosqlite:///./promptshield.db"
    
    # Rate Limiting & Execution Safeguards
    DEFAULT_CONCURRENCY: int = 2
    PROBE_TIMEOUT_SECONDS: float = 15.0
    MAX_RESPONSE_BYTES: int = 32768  # 32KB max response size
    MAX_TOKENS_DEFAULT: int = 300
    
    # Security & SSRF Safeguards
    ALLOW_LOCALHOST_OLLAMA: bool = True
    OLLAMA_PORT: int = 11434
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
