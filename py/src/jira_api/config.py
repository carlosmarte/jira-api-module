"""Configuration management for JIRA API client."""

import json
import os
from pathlib import Path
from typing import Optional

from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings


class JiraConfig(BaseModel):
    """JIRA configuration model."""

    base_url: str = Field(..., description="Base URL of the JIRA instance")
    email: str = Field(..., description="Email address for authentication")
    api_token: str = Field(..., description="API token for authentication")

    class Config:
        """Pydantic model configuration."""
        
        env_prefix = "JIRA_"


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # JIRA configuration
    jira_base_url: Optional[str] = Field(None, env="JIRA_BASE_URL")
    jira_email: Optional[str] = Field(None, env="JIRA_EMAIL")
    jira_api_token: Optional[str] = Field(None, env="JIRA_API_TOKEN")

    # Server configuration
    server_host: str = Field("0.0.0.0", env="SERVER_HOST")
    server_port: int = Field(8000, env="SERVER_PORT")
    server_reload: bool = Field(False, env="SERVER_RELOAD")
    
    # Optional API key for server authentication
    server_api_key: Optional[str] = Field(None, env="SERVER_API_KEY")

    class Config:
        """Pydantic settings configuration."""
        
        env_file = ".env"
        env_file_encoding = "utf-8"


def get_config_dir() -> Path:
    """Get the configuration directory path."""
    config_dir = Path.home() / ".jira-api"
    config_dir.mkdir(exist_ok=True)
    return config_dir


def get_config_file() -> Path:
    """Get the configuration file path."""
    return get_config_dir() / "config.json"


def save_config(config: JiraConfig) -> None:
    """Save configuration to file.

    Args:
        config: JIRA configuration to save
    """
    config_file = get_config_file()
    
    with open(config_file, "w") as f:
        json.dump(config.model_dump(), f, indent=2)
    
    # Set file permissions to be readable only by owner
    os.chmod(config_file, 0o600)


def load_config() -> Optional[JiraConfig]:
    """Load configuration from file.

    Returns:
        JiraConfig object if configuration exists, None otherwise
    """
    config_file = get_config_file()
    
    if not config_file.exists():
        return None
    
    try:
        with open(config_file, "r") as f:
            data = json.load(f)
        
        return JiraConfig(**data)
    except (json.JSONDecodeError, ValueError):
        return None


def get_config_from_env() -> Optional[JiraConfig]:
    """Get configuration from environment variables.

    Returns:
        JiraConfig object if all required env vars are present, None otherwise
    """
    settings = Settings()
    
    if settings.jira_base_url and settings.jira_email and settings.jira_api_token:
        return JiraConfig(
            base_url=settings.jira_base_url,
            email=settings.jira_email,
            api_token=settings.jira_api_token,
        )
    
    return None


def get_config() -> Optional[JiraConfig]:
    """Get configuration from environment variables or file.

    Environment variables take precedence over file configuration.

    Returns:
        JiraConfig object if configuration is available, None otherwise
    """
    # First try environment variables
    config = get_config_from_env()
    if config:
        return config
    
    # Fall back to file configuration
    return load_config()