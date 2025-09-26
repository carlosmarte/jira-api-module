"""User service for JIRA operations."""

from typing import List, Optional

from jira_api.core.client import JiraClient
from jira_api.models.user import User


class UserService:
    """Service for user-related operations."""

    def __init__(self, client: JiraClient) -> None:
        """Initialize the user service.

        Args:
            client: JIRA API client instance
        """
        self.client = client

    def get_user_by_id(self, account_id: str) -> User:
        """Get a user by their account ID.

        Args:
            account_id: The account ID of the user

        Returns:
            User object
        """
        return self.client.get_user(account_id)

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by their email address.

        Args:
            email: The email address of the user

        Returns:
            User object if found, None otherwise
        """
        users = self.client.search_users(email, max_results=1)
        
        # Find exact email match
        for user in users:
            if user.email_address and user.email_address.lower() == email.lower():
                return user
        
        return None

    def search_users(self, query: str, max_results: int = 50) -> List[User]:
        """Search for users by query string.

        Args:
            query: Query string to search for users
            max_results: Maximum number of results to return

        Returns:
            List of User objects matching the search
        """
        return self.client.search_users(query, max_results)

    def find_assignable_users_for_projects(
        self, 
        project_keys: List[str], 
        query: Optional[str] = None, 
        max_results: int = 50
    ) -> List[User]:
        """Find users who can be assigned to issues in the specified projects.

        Args:
            project_keys: List of project keys
            query: Optional query string to filter users
            max_results: Maximum number of results to return

        Returns:
            List of User objects who can be assigned to the projects
        """
        return self.client.find_assignable_users(project_keys, query, max_results)

    def get_user_by_identifier(self, identifier: str) -> Optional[User]:
        """Get a user by either account ID or email address.

        This method first tries to get the user by account ID,
        and if that fails, it searches by email address.

        Args:
            identifier: Either account ID or email address

        Returns:
            User object if found, None otherwise
        """
        # First try as account ID
        try:
            return self.get_user_by_id(identifier)
        except Exception:
            # If that fails, try as email
            return self.get_user_by_email(identifier)