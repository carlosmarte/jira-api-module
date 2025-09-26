"""Project service for JIRA operations."""

from typing import List, Optional

from jira_api.core.client import JiraClient
from jira_api.models.project import Project, ProjectVersion, ProjectVersionCreate


class ProjectService:
    """Service for project-related operations."""

    def __init__(self, client: JiraClient) -> None:
        """Initialize the project service.

        Args:
            client: JIRA API client instance
        """
        self.client = client

    def get_project(self, project_key: str) -> Project:
        """Get a project by its key.

        Args:
            project_key: The project key

        Returns:
            Project object
        """
        return self.client.get_project(project_key)

    def get_project_versions(
        self, 
        project_key: str, 
        released_only: Optional[bool] = None
    ) -> List[ProjectVersion]:
        """Get all versions for a project.

        Args:
            project_key: The project key
            released_only: If True, return only released versions.
                          If False, return only unreleased versions.
                          If None, return all versions.

        Returns:
            List of ProjectVersion objects
        """
        versions = self.client.get_project_versions(project_key)
        
        if released_only is None:
            return versions
        elif released_only:
            return [v for v in versions if v.released]
        else:
            return [v for v in versions if not v.released]

    def create_version(
        self,
        project_key: str,
        version_name: str,
        description: Optional[str] = None,
        start_date: Optional[str] = None,
        release_date: Optional[str] = None,
        released: bool = False,
        archived: bool = False,
    ) -> ProjectVersion:
        """Create a new version for a project.

        Args:
            project_key: The project key
            version_name: Name of the version
            description: Optional description
            start_date: Optional start date (YYYY-MM-DD format)
            release_date: Optional release date (YYYY-MM-DD format)
            released: Whether the version is released
            archived: Whether the version is archived

        Returns:
            Created ProjectVersion object
        """
        # First get the project to obtain its ID
        project = self.get_project(project_key)
        project_id = int(project.id)

        version_data = ProjectVersionCreate(
            name=version_name,
            description=description,
            project_id=project_id,
            start_date=start_date,
            release_date=release_date,
            released=released,
            archived=archived,
        )

        return self.client.create_project_version(version_data)

    def get_version_by_name(self, project_key: str, version_name: str) -> Optional[ProjectVersion]:
        """Get a specific version by name.

        Args:
            project_key: The project key
            version_name: Name of the version to find

        Returns:
            ProjectVersion object if found, None otherwise
        """
        versions = self.get_project_versions(project_key)
        
        for version in versions:
            if version.name == version_name:
                return version
        
        return None

    def get_released_versions(self, project_key: str) -> List[ProjectVersion]:
        """Get all released versions for a project.

        Args:
            project_key: The project key

        Returns:
            List of released ProjectVersion objects
        """
        return self.get_project_versions(project_key, released_only=True)

    def get_unreleased_versions(self, project_key: str) -> List[ProjectVersion]:
        """Get all unreleased versions for a project.

        Args:
            project_key: The project key

        Returns:
            List of unreleased ProjectVersion objects
        """
        return self.get_project_versions(project_key, released_only=False)

    def get_issue_types(self) -> List[dict]:
        """Get all available issue types.

        Returns:
            List of issue type data
        """
        return self.client.get_issue_types()