"""Pydantic models for JIRA project entities."""

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class ProjectVersion(BaseModel):
    """JIRA Project Version model."""

    id: str = Field(..., description="The ID of the version")
    name: str = Field(..., description="The name of the version")
    description: Optional[str] = Field(None, description="Description of the version")
    archived: bool = Field(False, description="Whether the version is archived")
    released: bool = Field(False, description="Whether the version is released")
    start_date: Optional[datetime] = Field(None, description="Start date of the version")
    release_date: Optional[datetime] = Field(None, description="Release date of the version")
    overdue: Optional[bool] = Field(None, description="Whether the version is overdue")
    user_start_date: Optional[str] = Field(None, description="User-friendly start date")
    user_release_date: Optional[str] = Field(None, description="User-friendly release date")
    project_id: int = Field(..., description="ID of the project this version belongs to")


class ProjectVersionCreate(BaseModel):
    """Model for creating a new project version."""

    name: str = Field(..., description="The name of the version")
    description: Optional[str] = Field(None, description="Description of the version")
    project_id: int = Field(..., description="ID of the project")
    archived: bool = Field(False, description="Whether the version is archived")
    released: bool = Field(False, description="Whether the version is released")
    start_date: Optional[str] = Field(None, description="Start date (YYYY-MM-DD)")
    release_date: Optional[str] = Field(None, description="Release date (YYYY-MM-DD)")


class IssueType(BaseModel):
    """JIRA Issue Type model."""

    id: str = Field(..., description="The ID of the issue type")
    name: str = Field(..., description="The name of the issue type")
    description: str = Field(..., description="Description of the issue type")
    icon_url: Optional[str] = Field(None, description="URL to the issue type icon")
    subtask: bool = Field(False, description="Whether this is a subtask type")


class ProjectLead(BaseModel):
    """JIRA Project Lead model."""
    
    account_id: Optional[str] = Field(None, alias="accountId", description="Account ID of the lead")
    display_name: Optional[str] = Field(None, alias="displayName", description="Display name of the lead")
    active: Optional[bool] = Field(None, description="Whether the lead is active")
    avatar_urls: Optional[Dict[str, str]] = Field(None, alias="avatarUrls", description="Avatar URLs")
    
    class Config:
        populate_by_name = True


class Project(BaseModel):
    """JIRA Project model."""

    id: str = Field(..., description="The ID of the project")
    key: str = Field(..., description="The key of the project")
    name: str = Field(..., description="The name of the project")
    description: Optional[str] = Field(None, description="Description of the project")
    lead: Optional[ProjectLead] = Field(None, description="Project lead information")
    project_type_key: Optional[str] = Field(None, alias="projectTypeKey", description="Type of the project")
    avatar_urls: Optional[Dict[str, str]] = Field(None, alias="avatarUrls", description="URLs for project avatar images")
    url: Optional[str] = Field(None, description="URL to the project")
    issue_types: Optional[List[IssueType]] = Field(None, alias="issueTypes", description="Available issue types")
    versions: Optional[List[ProjectVersion]] = Field(None, description="Project versions")
    
    class Config:
        populate_by_name = True


class ProjectDetails(BaseModel):
    """Extended project details model."""

    project: Project = Field(..., description="Project information")
    versions: List[ProjectVersion] = Field(default_factory=list, description="Project versions")
    issue_types: List[IssueType] = Field(default_factory=list, description="Available issue types")