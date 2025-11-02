"""Pydantic models for JIRA issue entities."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from jira_api.models.project import IssueType, Project
from jira_api.models.user import User


class IssueStatus(BaseModel):
    """JIRA Issue Status model."""

    id: str = Field(..., description="The ID of the status")
    name: str = Field(..., description="The name of the status")
    description: str = Field(..., description="Description of the status")
    category: Optional[Dict[str, Any]] = Field(None, description="Status category")


class IssuePriority(BaseModel):
    """JIRA Issue Priority model."""

    id: str = Field(..., description="The ID of the priority")
    name: str = Field(..., description="The name of the priority")
    description: Optional[str] = Field(None, description="Description of the priority")
    icon_url: Optional[str] = Field(None, description="URL to the priority icon")


class IssueTransition(BaseModel):
    """JIRA Issue Transition model."""

    id: str = Field(..., description="The ID of the transition")
    name: str = Field(..., description="The name of the transition")
    to: IssueStatus = Field(..., description="The status this transition leads to")
    has_screen: bool = Field(False, description="Whether this transition has a screen")


class IssueFields(BaseModel):
    """JIRA Issue Fields model."""

    summary: str = Field(..., description="Summary of the issue")
    description: Optional[str] = Field(None, description="Description of the issue")
    issue_type: IssueType = Field(..., alias="issuetype", description="Type of the issue")
    project: Project = Field(..., description="Project the issue belongs to")
    status: IssueStatus = Field(..., description="Current status of the issue")
    priority: Optional[IssuePriority] = Field(None, description="Priority of the issue")
    assignee: Optional[User] = Field(None, description="User assigned to the issue")
    reporter: Optional[User] = Field(None, description="User who reported the issue")
    labels: List[str] = Field(default_factory=list, description="Labels attached to the issue")
    created: Optional[datetime] = Field(None, description="When the issue was created")
    updated: Optional[datetime] = Field(None, description="When the issue was last updated")
    resolution: Optional[Dict[str, Any]] = Field(None, description="Resolution of the issue")
    resolution_date: Optional[datetime] = Field(None, alias="resolutiondate", description="When the issue was resolved")


class Issue(BaseModel):
    """JIRA Issue model."""

    id: str = Field(..., description="The ID of the issue")
    key: str = Field(..., description="The key of the issue")
    self: str = Field(..., description="URL to the issue")
    fields: IssueFields = Field(..., description="Issue fields")
    changelog: Optional[Dict[str, Any]] = Field(None, description="Issue changelog")


class IssueCreate(BaseModel):
    """Model for creating a new issue."""

    project_id: str = Field(..., description="ID of the project")
    summary: str = Field(..., description="Summary of the issue")
    description: Optional[str] = Field(None, description="Description of the issue")
    issue_type_id: str = Field(..., description="ID of the issue type")
    priority_id: Optional[str] = Field(None, description="ID of the priority")
    assignee_account_id: Optional[str] = Field(None, description="Account ID of the assignee")
    reporter_account_id: Optional[str] = Field(None, description="Account ID of the reporter")
    labels: List[str] = Field(default_factory=list, description="Labels to attach to the issue")

    def to_jira_format(self) -> Dict[str, Any]:
        """Convert to JIRA API format."""
        fields: Dict[str, Any] = {
            "project": {"id": self.project_id},
            "summary": self.summary,
            "issuetype": {"id": self.issue_type_id},
        }

        if self.description:
            # JIRA Cloud uses Atlassian Document Format (ADF)
            fields["description"] = {
                "type": "doc",
                "version": 1,
                "content": [
                    {
                        "type": "paragraph",
                        "content": [{"type": "text", "text": self.description}],
                    }
                ],
            }

        if self.priority_id:
            fields["priority"] = {"id": self.priority_id}

        if self.assignee_account_id:
            fields["assignee"] = {"accountId": self.assignee_account_id}

        if self.reporter_account_id:
            fields["reporter"] = {"accountId": self.reporter_account_id}

        if self.labels:
            fields["labels"] = self.labels

        return {"fields": fields}


class IssueUpdate(BaseModel):
    """Model for updating an existing issue."""

    summary: Optional[str] = Field(None, description="New summary for the issue")
    description: Optional[str] = Field(None, description="New description for the issue")
    labels_add: List[str] = Field(default_factory=list, description="Labels to add")
    labels_remove: List[str] = Field(default_factory=list, description="Labels to remove")
    priority_id: Optional[str] = Field(None, description="New priority ID")

    def to_jira_format(self) -> Dict[str, Any]:
        """Convert to JIRA API update format."""
        update: Dict[str, Any] = {}

        if self.summary:
            update["summary"] = [{"set": self.summary}]

        if self.description:
            # JIRA Cloud uses Atlassian Document Format (ADF)
            update["description"] = [
                {
                    "set": {
                        "type": "doc",
                        "version": 1,
                        "content": [
                            {
                                "type": "paragraph",
                                "content": [{"type": "text", "text": self.description}],
                            }
                        ],
                    }
                }
            ]

        label_operations = []
        for label in self.labels_add:
            label_operations.append({"add": label})
        for label in self.labels_remove:
            label_operations.append({"remove": label})

        if label_operations:
            update["labels"] = label_operations

        if self.priority_id:
            update["priority"] = [{"set": {"id": self.priority_id}}]

        return {"update": update}


class IssueTransitionRequest(BaseModel):
    """Model for transitioning an issue."""

    transition_id: str = Field(..., description="ID of the transition to perform")
    comment: Optional[str] = Field(None, description="Comment to add with the transition")
    resolution_name: Optional[str] = Field(None, description="Resolution name if applicable")

    def to_jira_format(self) -> Dict[str, Any]:
        """Convert to JIRA API transition format."""
        data: Dict[str, Any] = {
            "transition": {"id": self.transition_id}
        }

        fields: Dict[str, Any] = {}

        if self.resolution_name:
            fields["resolution"] = {"name": self.resolution_name}

        if fields:
            data["fields"] = fields

        if self.comment:
            data["update"] = {
                "comment": [
                    {
                        "add": {
                            "body": {
                                "type": "doc",
                                "version": 1,
                                "content": [
                                    {
                                        "type": "paragraph",
                                        "content": [{"type": "text", "text": self.comment}],
                                    }
                                ],
                            }
                        }
                    }
                ]
            }

        return data


class IssueAssignment(BaseModel):
    """Model for assigning an issue."""

    account_id: Optional[str] = Field(None, description="Account ID of the assignee (None to unassign)")

    def to_jira_format(self) -> Dict[str, Any]:
        """Convert to JIRA API assignment format."""
        if self.account_id:
            return {"accountId": self.account_id}
        return {"accountId": None}  # Unassign


class IssueSearchResult(BaseModel):
    """Model for issue search results."""

    issues: List[Issue] = Field(default_factory=list, description="List of issues")
    total: int = Field(0, description="Total number of issues found")
    start_at: int = Field(0, description="Starting index of results")
    max_results: int = Field(50, description="Maximum results requested")