"""SDK client for interacting with the JIRA API server."""

import logging
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin

import httpx
from pydantic import ValidationError

from jira_api.exceptions import SDKError
from jira_api.models.issue import Issue, IssueCreate, IssueTransition, IssueUpdate
from jira_api.models.project import Project, ProjectVersion
from jira_api.models.user import User

logger = logging.getLogger(__name__)


class JiraSDKClient:
    """SDK client for interacting with the JIRA API server."""

    def __init__(
        self,
        base_url: str,
        api_key: Optional[str] = None,
        timeout: float = 30.0,
    ) -> None:
        """Initialize the SDK client.

        Args:
            base_url: Base URL of the JIRA API server
            api_key: Optional API key for authentication
            timeout: Request timeout in seconds
        """
        if not base_url.endswith("/"):
            base_url += "/"

        self.base_url = base_url
        self.timeout = timeout

        # Set up authentication if API key is provided
        auth = None
        if api_key:
            auth = (api_key, "")  # Use API key as username, empty password

        self._client = httpx.Client(
            auth=auth,
            timeout=timeout,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        )

    def __enter__(self) -> "JiraSDKClient":
        """Context manager entry."""
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Context manager exit."""
        self.close()

    def close(self) -> None:
        """Close the HTTP client."""
        self._client.close()

    def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        json_data: Optional[Dict[str, Any]] = None,
    ) -> Any:
        """Make an HTTP request to the API server.

        Args:
            method: HTTP method
            endpoint: API endpoint
            params: Query parameters
            json_data: JSON data for request body

        Returns:
            Response data

        Raises:
            SDKError: For any error responses
        """
        url = urljoin(self.base_url, endpoint)

        try:
            logger.debug(f"Making {method} request to {url}")
            response = self._client.request(
                method=method,
                url=url,
                params=params,
                json=json_data,
            )

            if response.status_code >= 400:
                error_msg = f"HTTP {response.status_code}"
                try:
                    error_data = response.json()
                    if "detail" in error_data:
                        error_msg = error_data["detail"]
                except Exception:
                    pass

                raise SDKError(
                    error_msg,
                    status_code=response.status_code,
                    response_data=error_data if 'error_data' in locals() else {},
                )

            # Handle empty responses
            if response.status_code == 204 or not response.content:
                return {}

            return response.json()

        except httpx.RequestError as e:
            raise SDKError(f"Request failed: {e}")

    # Health Check

    def health_check(self) -> Dict[str, str]:
        """Check server health.

        Returns:
            Health status information
        """
        return self._make_request("GET", "health")

    # User Methods

    def search_users(self, query: str, max_results: int = 50) -> List[User]:
        """Search for users.

        Args:
            query: Search query
            max_results: Maximum number of results

        Returns:
            List of User objects
        """
        params = {"query": query, "max_results": max_results}
        data = self._make_request("GET", "users/search", params=params)

        try:
            return [User(**user_data) for user_data in data]
        except ValidationError as e:
            raise SDKError(f"Failed to parse user search results: {e}")

    def get_user(self, identifier: str) -> User:
        """Get a user by account ID or email.

        Args:
            identifier: User account ID or email

        Returns:
            User object
        """
        data = self._make_request("GET", f"users/{identifier}")

        try:
            return User(**data)
        except ValidationError as e:
            raise SDKError(f"Failed to parse user data: {e}")

    # Issue Methods

    def create_issue(self, issue_data: IssueCreate) -> Issue:
        """Create a new issue.

        Args:
            issue_data: Issue creation data

        Returns:
            Created Issue object
        """
        json_data = issue_data.model_dump(exclude_unset=True)
        data = self._make_request("POST", "issues", json_data=json_data)

        try:
            return Issue(**data)
        except ValidationError as e:
            raise SDKError(f"Failed to parse created issue data: {e}")

    def get_issue(self, issue_key: str) -> Issue:
        """Get an issue by key.

        Args:
            issue_key: Issue key

        Returns:
            Issue object
        """
        data = self._make_request("GET", f"issues/{issue_key}")

        try:
            return Issue(**data)
        except ValidationError as e:
            raise SDKError(f"Failed to parse issue data: {e}")

    def update_issue(self, issue_key: str, update_data: IssueUpdate) -> Dict[str, str]:
        """Update an issue.

        Args:
            issue_key: Issue key
            update_data: Update data

        Returns:
            Success message
        """
        json_data = update_data.model_dump(exclude_unset=True)
        return self._make_request("PATCH", f"issues/{issue_key}", json_data=json_data)

    def assign_issue(self, issue_key: str, email: str) -> Dict[str, str]:
        """Assign an issue to a user.

        Args:
            issue_key: Issue key
            email: Assignee email

        Returns:
            Success message
        """
        return self._make_request("PUT", f"issues/{issue_key}/assign/{email}")

    def get_issue_transitions(self, issue_key: str) -> List[IssueTransition]:
        """Get available transitions for an issue.

        Args:
            issue_key: Issue key

        Returns:
            List of available transitions
        """
        data = self._make_request("GET", f"issues/{issue_key}/transitions")

        try:
            return [IssueTransition(**transition) for transition in data]
        except ValidationError as e:
            raise SDKError(f"Failed to parse transitions data: {e}")

    def transition_issue(
        self,
        issue_key: str,
        transition_name: str,
        comment: Optional[str] = None,
        resolution_name: Optional[str] = None,
    ) -> Dict[str, str]:
        """Transition an issue.

        Args:
            issue_key: Issue key
            transition_name: Transition name
            comment: Optional comment
            resolution_name: Optional resolution name

        Returns:
            Success message
        """
        json_data = {
            "transition_name": transition_name,
            "comment": comment,
            "resolution_name": resolution_name,
        }
        return self._make_request("POST", f"issues/{issue_key}/transitions", json_data=json_data)

    # Project Methods

    def get_project(self, project_key: str) -> Project:
        """Get a project by key.

        Args:
            project_key: Project key

        Returns:
            Project object
        """
        data = self._make_request("GET", f"projects/{project_key}")

        try:
            return Project(**data)
        except ValidationError as e:
            raise SDKError(f"Failed to parse project data: {e}")

    def get_project_versions(
        self, project_key: str, released: Optional[bool] = None
    ) -> List[ProjectVersion]:
        """Get project versions.

        Args:
            project_key: Project key
            released: Filter by release status

        Returns:
            List of ProjectVersion objects
        """
        params = {}
        if released is not None:
            params["released"] = released

        data = self._make_request("GET", f"projects/{project_key}/versions", params=params)

        try:
            return [ProjectVersion(**version_data) for version_data in data]
        except ValidationError as e:
            raise SDKError(f"Failed to parse project versions: {e}")

    def create_project_version(
        self, project_key: str, name: str, description: Optional[str] = None
    ) -> ProjectVersion:
        """Create a new project version.

        Args:
            project_key: Project key
            name: Version name
            description: Optional description

        Returns:
            Created ProjectVersion object
        """
        json_data = {"name": name}
        if description:
            json_data["description"] = description

        data = self._make_request("POST", f"projects/{project_key}/versions", json_data=json_data)

        try:
            return ProjectVersion(**data)
        except ValidationError as e:
            raise SDKError(f"Failed to parse created version data: {e}")

    def get_project_issue_types(self, project_key: str) -> List[Dict[str, Any]]:
        """Get issue types for a specific project.

        Args:
            project_key: Project key

        Returns:
            List of issue type data for the project
        """
        return self._make_request("GET", f"projects/{project_key}/issue-types")

    def create_issue_by_type_name(
        self,
        project_key: str,
        summary: str,
        issue_type_name: str,
        description: Optional[str] = None,
        assignee_email: Optional[str] = None,
        labels: Optional[List[str]] = None,
    ) -> Issue:
        """Create an issue using issue type name instead of ID.

        Args:
            project_key: Project key
            summary: Issue summary
            issue_type_name: Name of the issue type (e.g., 'Bug', 'Story', 'Task')
            description: Optional description
            assignee_email: Optional assignee email
            labels: Optional labels

        Returns:
            Created Issue object
        """
        json_data = {
            "project_key": project_key,
            "summary": summary,
            "issue_type_name": issue_type_name,
            "description": description,
            "assignee_email": assignee_email,
            "labels": labels or [],
        }
        data = self._make_request("POST", "issues/by-type-name", json_data=json_data)

        try:
            return Issue(**data)
        except ValidationError as e:
            raise SDKError(f"Failed to parse created issue data: {e}")

    # Convenience Methods

    def create_bug(
        self,
        project_id: str,
        summary: str,
        description: Optional[str] = None,
        assignee_account_id: Optional[str] = None,
        labels: Optional[List[str]] = None,
    ) -> Issue:
        """Convenience method to create a bug issue.

        Args:
            project_id: Project ID
            summary: Issue summary
            description: Optional description
            assignee_account_id: Optional assignee account ID
            labels: Optional labels

        Returns:
            Created Issue object
        """
        issue_data = IssueCreate(
            project_id=project_id,
            summary=summary,
            description=description,
            issue_type_id="10004",  # Common bug issue type ID
            assignee_account_id=assignee_account_id,
            labels=labels or [],
        )
        return self.create_issue(issue_data)

    def create_task(
        self,
        project_id: str,
        summary: str,
        description: Optional[str] = None,
        assignee_account_id: Optional[str] = None,
        labels: Optional[List[str]] = None,
    ) -> Issue:
        """Convenience method to create a task issue.

        Args:
            project_id: Project ID
            summary: Issue summary
            description: Optional description
            assignee_account_id: Optional assignee account ID
            labels: Optional labels

        Returns:
            Created Issue object
        """
        issue_data = IssueCreate(
            project_id=project_id,
            summary=summary,
            description=description,
            issue_type_id="10003",  # Common task issue type ID
            assignee_account_id=assignee_account_id,
            labels=labels or [],
        )
        return self.create_issue(issue_data)