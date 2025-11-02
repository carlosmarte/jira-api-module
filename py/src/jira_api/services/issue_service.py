"""Issue service for JIRA operations."""

from typing import List, Optional

from jira_api.core.client import JiraClient
from jira_api.models.issue import (
    Issue,
    IssueAssignment,
    IssueCreate,
    IssueTransition,
    IssueTransitionRequest,
    IssueUpdate,
)
from jira_api.services.user_service import UserService


class IssueService:
    """Service for issue-related operations."""

    def __init__(self, client: JiraClient) -> None:
        """Initialize the issue service.

        Args:
            client: JIRA API client instance
        """
        self.client = client
        self.user_service = UserService(client)

    def create_issue(
        self,
        project_id: str,
        summary: str,
        issue_type_id: str,
        description: Optional[str] = None,
        priority_id: Optional[str] = None,
        assignee_email: Optional[str] = None,
        labels: Optional[List[str]] = None,
    ) -> Issue:
        """Create a new issue with simplified parameters.

        Args:
            project_id: ID of the project
            summary: Summary of the issue
            issue_type_id: ID of the issue type
            description: Optional description
            priority_id: Optional priority ID
            assignee_email: Optional email of the assignee
            labels: Optional list of labels

        Returns:
            Created Issue object
        """
        assignee_account_id = None
        if assignee_email:
            assignee = self.user_service.get_user_by_email(assignee_email)
            if assignee:
                assignee_account_id = assignee.account_id

        issue_data = IssueCreate(
            project_id=project_id,
            summary=summary,
            description=description,
            issue_type_id=issue_type_id,
            priority_id=priority_id,
            assignee_account_id=assignee_account_id,
            labels=labels or [],
        )

        return self.client.create_issue(issue_data)

    def create_issue_by_type_name(
        self,
        project_key: str,
        summary: str,
        issue_type_name: str,
        description: Optional[str] = None,
        priority_id: Optional[str] = None,
        assignee_email: Optional[str] = None,
        labels: Optional[List[str]] = None,
    ) -> Issue:
        """Create a new issue using issue type name instead of ID.

        Args:
            project_key: Key of the project
            summary: Summary of the issue
            issue_type_name: Name of the issue type (e.g., 'Bug', 'Story', 'Task')
            description: Optional description
            priority_id: Optional priority ID
            assignee_email: Optional email of the assignee
            labels: Optional list of labels

        Returns:
            Created Issue object

        Raises:
            JiraValidationError: If issue type name is not found in project
        """
        # Get the project to find the project ID
        project = self.client.get_project(project_key)
        project_id = project.id
        
        # Get issue type ID by name
        issue_type_id = self.client.get_issue_type_id_by_name(project_key, issue_type_name)
        
        return self.create_issue(
            project_id=project_id,
            summary=summary,
            issue_type_id=issue_type_id,
            description=description,
            priority_id=priority_id,
            assignee_email=assignee_email,
            labels=labels,
        )

    def get_issue(self, issue_key: str) -> Issue:
        """Get an issue by its key.

        Args:
            issue_key: The issue key (e.g., PROJ-123)

        Returns:
            Issue object
        """
        return self.client.get_issue(issue_key)

    def update_issue_summary(self, issue_key: str, summary: str) -> None:
        """Update an issue's summary.

        Args:
            issue_key: The issue key (e.g., PROJ-123)
            summary: New summary text
        """
        update_data = IssueUpdate(summary=summary)
        self.client.update_issue(issue_key, update_data)

    def update_issue_description(self, issue_key: str, description: str) -> None:
        """Update an issue's description.

        Args:
            issue_key: The issue key (e.g., PROJ-123)
            description: New description text
        """
        update_data = IssueUpdate(description=description)
        self.client.update_issue(issue_key, update_data)

    def add_labels_to_issue(self, issue_key: str, labels: List[str]) -> None:
        """Add labels to an issue.

        Args:
            issue_key: The issue key (e.g., PROJ-123)
            labels: List of labels to add
        """
        update_data = IssueUpdate(labels_add=labels)
        self.client.update_issue(issue_key, update_data)

    def remove_labels_from_issue(self, issue_key: str, labels: List[str]) -> None:
        """Remove labels from an issue.

        Args:
            issue_key: The issue key (e.g., PROJ-123)
            labels: List of labels to remove
        """
        update_data = IssueUpdate(labels_remove=labels)
        self.client.update_issue(issue_key, update_data)

    def assign_issue_by_email(self, issue_key: str, assignee_email: str) -> None:
        """Assign an issue to a user by email.

        Args:
            issue_key: The issue key (e.g., PROJ-123)
            assignee_email: Email of the user to assign the issue to
        """
        assignee = self.user_service.get_user_by_email(assignee_email)
        if not assignee:
            raise ValueError(f"User with email '{assignee_email}' not found")

        assignment = IssueAssignment(account_id=assignee.account_id)
        self.client.assign_issue(issue_key, assignment)

    def unassign_issue(self, issue_key: str) -> None:
        """Unassign an issue.

        Args:
            issue_key: The issue key (e.g., PROJ-123)
        """
        assignment = IssueAssignment(account_id=None)
        self.client.assign_issue(issue_key, assignment)

    def get_available_transitions(self, issue_key: str) -> List[IssueTransition]:
        """Get available transitions for an issue.

        Args:
            issue_key: The issue key (e.g., PROJ-123)

        Returns:
            List of available transitions
        """
        return self.client.get_issue_transitions(issue_key)

    def transition_issue_by_name(
        self,
        issue_key: str,
        transition_name: str,
        comment: Optional[str] = None,
        resolution_name: Optional[str] = None,
    ) -> None:
        """Transition an issue by transition name.

        Args:
            issue_key: The issue key (e.g., PROJ-123)
            transition_name: Name of the transition to perform
            comment: Optional comment to add with the transition
            resolution_name: Optional resolution name

        Raises:
            ValueError: If transition name is not found
        """
        transitions = self.get_available_transitions(issue_key)
        
        transition_id = None
        for transition in transitions:
            if transition.name.lower() == transition_name.lower():
                transition_id = transition.id
                break

        if not transition_id:
            available_names = [t.name for t in transitions]
            raise ValueError(
                f"Transition '{transition_name}' not found. "
                f"Available transitions: {', '.join(available_names)}"
            )

        transition_request = IssueTransitionRequest(
            transition_id=transition_id,
            comment=comment,
            resolution_name=resolution_name,
        )
        
        self.client.transition_issue(issue_key, transition_request)

    def transition_issue_by_id(
        self,
        issue_key: str,
        transition_id: str,
        comment: Optional[str] = None,
        resolution_name: Optional[str] = None,
    ) -> None:
        """Transition an issue by transition ID.

        Args:
            issue_key: The issue key (e.g., PROJ-123)
            transition_id: ID of the transition to perform
            comment: Optional comment to add with the transition
            resolution_name: Optional resolution name
        """
        transition_request = IssueTransitionRequest(
            transition_id=transition_id,
            comment=comment,
            resolution_name=resolution_name,
        )
        
        self.client.transition_issue(issue_key, transition_request)