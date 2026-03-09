"""
Sol Agent — Configuration
"""

from pydantic_settings import BaseSettings


class AgentSettings(BaseSettings):
    """Agent configuration loaded from environment."""

    backend_url: str = "http://backend:8000"
    anthropic_api_key: str = ""
    model: str = "claude-sonnet-4-20250514"
    agent_name: str = "Sol"
    max_iterations: int = 10
    max_tokens: int = 4096

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = AgentSettings()
