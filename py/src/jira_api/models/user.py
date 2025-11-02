"""Pydantic models for JIRA user entities."""

from typing import Dict, Optional

from pydantic import BaseModel, Field


class User(BaseModel):
    """JIRA User model."""

    account_id: str = Field(..., alias="accountId", description="The account ID of the user")
    email_address: Optional[str] = Field(None, alias="emailAddress", description="Email address of the user")
    display_name: str = Field(..., alias="displayName", description="Display name of the user")
    active: bool = Field(True, description="Whether the user account is active")
    avatar_urls: Optional[Dict[str, str]] = Field(None, alias="avatarUrls", description="URLs for user avatar images")
    time_zone: Optional[str] = Field(None, alias="timeZone", description="User's time zone")
    locale: Optional[str] = Field(None, description="User's locale")

    class Config:
        """Pydantic model configuration."""
        
        populate_by_name = True
        json_encoders = {
            # Add any custom encoders if needed
        }


class UserSearch(BaseModel):
    """Model for user search parameters."""

    query: str = Field(..., description="Query string to search users")
    project_keys: Optional[str] = Field(None, description="Comma-separated project keys")
    start_at: int = Field(0, description="Starting index for pagination")
    max_results: int = Field(50, description="Maximum number of results to return")


class UserSearchResult(BaseModel):
    """Model for user search results."""

    users: list[User] = Field(default_factory=list, description="List of users matching the search")
    total: int = Field(0, description="Total number of users found")
    start_at: int = Field(0, description="Starting index of results")
    max_results: int = Field(50, description="Maximum results requested")