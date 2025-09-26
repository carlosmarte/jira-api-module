"""Core JIRA API client using HTTPX."""

import logging
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin

import httpx
from pydantic import ValidationError

from jira_api.exceptions import (
    JiraAPIError,
    JiraAuthenticationError,
    JiraNotFoundError,
    JiraPermissionError,
    JiraRateLimitError,
    JiraServerError,
    JiraValidationError,
)
from jira_api.models.issue import (
    Issue,
    IssueAssignment,
    IssueCreate,
    IssueTransition,
    IssueTransitionRequest,
    IssueUpdate,
)
from jira_api.models.project import Project, ProjectVersion, ProjectVersionCreate
from jira_api.models.user import User

logger = logging.getLogger(__name__)


class JiraClient:
    """Core JIRA API client for interacting with Jira Cloud REST API v3."""

    def __init__(
        self,
        base_url: str,
        email: str,
        api_token: str,
        timeout: float = 30.0,
    ) -> None:
        """Initialize the JIRA client.

        Args:
            base_url: Base URL of the JIRA instance (e.g., https://company.atlassian.net)
            email: Email address for authentication
            api_token: API token for authentication
            timeout: Request timeout in seconds

        Raises:
            JiraValidationError: If base_url is invalid
        """
        if not base_url.startswith(("http://", "https://")):
            raise JiraValidationError("Base URL must start with http:// or https://")

        if not base_url.endswith("/"):
            base_url += "/"

        self.base_url = urljoin(base_url, "rest/api/3/")
        self.email = email
        self.api_token = api_token
        self.timeout = timeout

        self._client = httpx.Client(
            auth=(email, api_token),
            timeout=timeout,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        )

    def __enter__(self) -> "JiraClient":
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
    ) -> Dict[str, Any]:
        """Make an HTTP request to the JIRA API.

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint (relative to base_url)
            params: Query parameters
            json_data: JSON data for request body

        Returns:
            Response data as dictionary

        Raises:
            JiraAuthenticationError: For 401 responses
            JiraPermissionError: For 403 responses
            JiraNotFoundError: For 404 responses
            JiraValidationError: For 400 responses
            JiraRateLimitError: For 429 responses
            JiraServerError: For 5xx responses
            JiraAPIError: For other error responses
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

            # Handle different status codes
            if response.status_code == 401:
                raise JiraAuthenticationError("Invalid credentials or expired token")
            elif response.status_code == 403:
                raise JiraPermissionError("Insufficient permissions for this operation")
            elif response.status_code == 404:
                raise JiraNotFoundError("Resource not found")
            elif response.status_code == 400:
                error_msg = "Bad request"
                try:
                    error_data = response.json()
                    if "errorMessages" in error_data:
                        error_msg = "; ".join(error_data["errorMessages"])
                except Exception:
                    pass
                raise JiraValidationError(error_msg)
            elif response.status_code == 429:
                raise JiraRateLimitError("Rate limit exceeded")
            elif response.status_code >= 500:
                raise JiraServerError(f"Server error: {response.status_code}")
            elif response.status_code >= 400:
                error_msg = f"HTTP {response.status_code}"
                try:
                    error_data = response.json()
                    if "errorMessages" in error_data:
                        error_msg = "; ".join(error_data["errorMessages"])
                except Exception:
                    pass
                raise JiraAPIError(error_msg, status_code=response.status_code)

            # For successful responses that don't return JSON (like 204 No Content)
            if response.status_code == 204 or not response.content:
                return {}

            try:
                return response.json()
            except Exception as e:
                raise JiraAPIError(f"Failed to parse response JSON: {e}")

        except httpx.RequestError as e:
            raise JiraAPIError(f"Request failed: {e}")

    # User Management Methods

    def get_user(self, account_id: str) -> User:
        """Get a user by account ID.

        Args:
            account_id: The account ID of the user

        Returns:
            User object

        Raises:
            JiraNotFoundError: If user is not found
        """
        params = {"accountId": account_id}
        data = self._make_request("GET", "user", params=params)
        
        try:
            return User(**data)
        except ValidationError as e:
            raise JiraAPIError(f"Failed to parse user data: {e}")

    def search_users(self, query: str, max_results: int = 50) -> List[User]:
        """Search for users.

        Args:
            query: Query string to search for users
            max_results: Maximum number of results to return

        Returns:
            List of User objects
        """
        params = {"query": query, "maxResults": max_results}
        data = self._make_request("GET", "user/search", params=params)
        
        try:
            return [User(**user_data) for user_data in data]
        except ValidationError as e:
            raise JiraAPIError(f"Failed to parse user search results: {e}")

    def find_assignable_users(
        self, project_keys: List[str], query: Optional[str] = None, max_results: int = 50
    ) -> List[User]:
        """Find users assignable to projects.

        Args:
            project_keys: List of project keys
            query: Optional query string to filter users
            max_results: Maximum number of results to return

        Returns:
            List of User objects
        """
        params = {
            "projectKeys": ",".join(project_keys),
            "maxResults": max_results,
        }
        if query:
            params["query"] = query

        data = self._make_request("GET", "user/assignable/multiProjectSearch", params=params)
        
        try:
            return [User(**user_data) for user_data in data]
        except ValidationError as e:
            raise JiraAPIError(f"Failed to parse assignable users: {e}")

    # Issue Management Methods

    def create_issue(self, issue_data: IssueCreate) -> Issue:
        """Create a new issue.

        Args:
            issue_data: Issue creation data

        Returns:
            Created Issue object
        """
        json_data = issue_data.to_jira_format()
        data = self._make_request("POST", "issue", json_data=json_data)
        
        # Get the full issue details
        issue_key = data.get("key")
        if not issue_key:
            raise JiraAPIError("Issue created but key not returned")
            
        return self.get_issue(issue_key)

    def get_issue(self, issue_key: str) -> Issue:
        """Get an issue by key.

        Args:
            issue_key: The issue key (e.g., PROJ-123)

        Returns:
            Issue object

        Raises:
            JiraNotFoundError: If issue is not found
        """
        data = self._make_request("GET", f"issue/{issue_key}")
        
        try:
            return Issue(**data)
        except ValidationError as e:
            raise JiraAPIError(f"Failed to parse issue data: {e}")

    def update_issue(self, issue_key: str, update_data: IssueUpdate) -> None:
        """Update an existing issue.

        Args:
            issue_key: The issue key (e.g., PROJ-123)
            update_data: Issue update data
        """
        json_data = update_data.to_jira_format()
        self._make_request("PUT", f"issue/{issue_key}", json_data=json_data)

    def assign_issue(self, issue_key: str, assignment: IssueAssignment) -> None:
        """Assign an issue to a user.

        Args:
            issue_key: The issue key (e.g., PROJ-123)
            assignment: Assignment data
        """
        json_data = assignment.to_jira_format()
        self._make_request("PUT", f"issue/{issue_key}/assignee", json_data=json_data)

    def get_issue_transitions(self, issue_key: str) -> List[IssueTransition]:
        """Get available transitions for an issue.

        Args:
            issue_key: The issue key (e.g., PROJ-123)

        Returns:
            List of available transitions
        """
        data = self._make_request("GET", f"issue/{issue_key}/transitions")
        
        try:
            transitions_data = data.get("transitions", [])
            return [IssueTransition(**transition) for transition in transitions_data]
        except ValidationError as e:
            raise JiraAPIError(f"Failed to parse transitions data: {e}")

    def transition_issue(self, issue_key: str, transition_request: IssueTransitionRequest) -> None:
        """Transition an issue to a new status.

        Args:
            issue_key: The issue key (e.g., PROJ-123)
            transition_request: Transition request data
        """
        json_data = transition_request.to_jira_format()
        self._make_request("POST", f"issue/{issue_key}/transitions", json_data=json_data)

    # Project Management Methods

    def get_project(self, project_key: str) -> Project:
        """Get a project by key.

        Args:
            project_key: The project key

        Returns:
            Project object

        Raises:
            JiraNotFoundError: If project is not found
        """
        data = self._make_request("GET", f"project/{project_key}")
        
        try:
            return Project(**data)
        except ValidationError as e:
            raise JiraAPIError(f"Failed to parse project data: {e}")

    def get_project_versions(self, project_key: str) -> List[ProjectVersion]:
        """Get all versions for a project.

        Args:
            project_key: The project key

        Returns:
            List of ProjectVersion objects
        """
        data = self._make_request("GET", f"project/{project_key}/versions")
        
        try:
            return [ProjectVersion(**version_data) for version_data in data]
        except ValidationError as e:
            raise JiraAPIError(f"Failed to parse project versions: {e}")

    def create_project_version(self, version_data: ProjectVersionCreate) -> ProjectVersion:
        """Create a new project version.

        Args:
            version_data: Version creation data

        Returns:
            Created ProjectVersion object
        """
        json_data = version_data.model_dump(exclude_unset=True)
        data = self._make_request("POST", "version", json_data=json_data)
        
        try:
            return ProjectVersion(**data)
        except ValidationError as e:
            raise JiraAPIError(f"Failed to parse created version data: {e}")

    def get_issue_types(self) -> List[Dict[str, Any]]:
        """Get all issue types.

        Returns:
            List of issue type data
        """
        return self._make_request("GET", "issuetype")

    def get_project_issue_types(self, project_key: str) -> List[Dict[str, Any]]:
        """Get issue types for a specific project.

        Args:
            project_key: The project key

        Returns:
            List of issue type data for the project

        Raises:
            JiraNotFoundError: If project is not found
        """
        project_data = self._make_request("GET", f"project/{project_key}")
        return project_data.get("issueTypes", [])

    def get_issue_type_id_by_name(self, project_key: str, issue_type_name: str) -> str:
        """Get issue type ID by name for a specific project.

        Args:
            project_key: The project key
            issue_type_name: The name of the issue type (e.g., 'Bug', 'Story', 'Task')

        Returns:
            Issue type ID

        Raises:
            JiraNotFoundError: If project or issue type is not found
            JiraValidationError: If issue type name is not found in project
        """
        issue_types = self.get_project_issue_types(project_key)
        
        for issue_type in issue_types:
            if issue_type.get("name", "").lower() == issue_type_name.lower():
                return issue_type["id"]
        
        available_types = [it.get("name", "") for it in issue_types]
        raise JiraValidationError(
            f"Issue type '{issue_type_name}' not found in project '{project_key}'. "
            f"Available types: {', '.join(available_types)}"
        )