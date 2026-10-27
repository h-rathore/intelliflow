"""
IntelliFlow Backend — Application Settings
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration loaded from environment variables / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ───────────────────────────────────────
    app_name: str = "IntelliFlow"
    app_env: str = "development"
    app_debug: bool = True
    app_version: str = "0.1.0"

    # ── Server ────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000

    # ── CORS ──────────────────────────────────────────────
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # ── Persistence ───────────────────────────────────────
    database_url: str = "sqlite+aiosqlite:///./intelliflow.db"

    # ── AI Model Provider & Orchestration ─────────────────
    llm_provider: str = "mock_fallback"
    gemini_api_key: str | None = None
    execution_timeout_seconds: int = 60


# Singleton instance — import this everywhere
settings = Settings()
