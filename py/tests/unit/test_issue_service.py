"""Unit tests for IssueService functionality."""

import pytest
from unittest.mock import Mock, patch

from jira_api.services.issue_service import IssueService
from jira_api.core.client import JiraClient
from jira_api.models.project import Project
from jira_api.models.issue import Issue, IssueFields, IssueType, IssueStatus, ProjectRef


class TestIssueService:
    """Test IssueService functionality."""

    def setup_method(self):
        """Set up test fixtures."""
        self.mock_client = Mock(spec=JiraClient)
        self.issue_service = IssueService(self.mock_client)

    def test_create_issue_by_type_name_success(self):
        """Test successful issue creation by type name."""
        # Mock project
        mock_project = Project(
            id="10000",
            key="PROJ",
            name="Test Project",
            project_type_key="software"
        )
        
        # Mock issue
        mock_issue = Issue(
            id="10100",
            key="PROJ-1",
            fields=IssueFields(
                summary="Test issue",
                status=IssueStatus(id="1", name="Open", description="Open"),
                issue_type=IssueType(id="10001", name="Bug", description="Bug"),
                project=ProjectRef(id="10000", key="PROJ", name="Test Project")
            )
        )
        
        # Set up mocks
        self.mock_client.get_project.return_value = mock_project
        self.mock_client.get_issue_type_id_by_name.return_value = "10001"
        
        # Mock the create_issue method that will be called internally
        with patch.object(self.issue_service, 'create_issue', return_value=mock_issue) as mock_create:
            result = self.issue_service.create_issue_by_type_name(
                project_key="PROJ",
                summary="Test issue",
                issue_type_name="Bug",
                description="Test description",
            )
            
            # Verify the result
            assert result == mock_issue
            
            # Verify method calls
            self.mock_client.get_project.assert_called_once_with("PROJ")
            self.mock_client.get_issue_type_id_by_name.assert_called_once_with("PROJ", "Bug")
            
            # Verify create_issue was called with correct parameters
            mock_create.assert_called_once_with(
                project_id="10000",
                summary="Test issue",
                issue_type_id="10001",
                description="Test description",
                priority_id=None,
                assignee_email=None,
                labels=[],
            )

    def test_create_issue_by_type_name_with_all_params(self):
        """Test issue creation by type name with all optional parameters."""
        # Mock project
        mock_project = Project(
            id="10000",
            key="PROJ",
            name="Test Project",
            project_type_key="software"
        )
        
        # Mock issue
        mock_issue = Issue(
            id="10100",
            key="PROJ-1",
            fields=IssueFields(
                summary="Test issue",
                status=IssueStatus(id="1", name="Open", description="Open"),
                issue_type=IssueType(id="10001", name="Story", description="Story"),
                project=ProjectRef(id="10000", key="PROJ", name="Test Project")
            )
        )
        
        # Set up mocks
        self.mock_client.get_project.return_value = mock_project
        self.mock_client.get_issue_type_id_by_name.return_value = "10001"
        
        # Mock the create_issue method that will be called internally
        with patch.object(self.issue_service, 'create_issue', return_value=mock_issue) as mock_create:
            result = self.issue_service.create_issue_by_type_name(
                project_key="PROJ",
                summary="Test story",
                issue_type_name="Story",
                description="Story description",
                priority_id="2",
                assignee_email="user@example.com",
                labels=["frontend", "urgent"],
            )
            
            # Verify the result
            assert result == mock_issue
            
            # Verify method calls
            self.mock_client.get_project.assert_called_once_with("PROJ")
            self.mock_client.get_issue_type_id_by_name.assert_called_once_with("PROJ", "Story")
            
            # Verify create_issue was called with correct parameters
            mock_create.assert_called_once_with(
                project_id="10000",
                summary="Test story",
                issue_type_id="10001",
                description="Story description",
                priority_id="2",
                assignee_email="user@example.com",
                labels=["frontend", "urgent"],
            )

    def test_create_issue_by_type_name_case_insensitive(self):
        """Test issue creation by type name is case insensitive."""
        # Mock project
        mock_project = Project(
            id="10000",
            key="PROJ",
            name="Test Project",
            project_type_key="software"
        )
        
        # Mock issue
        mock_issue = Issue(
            id="10100",
            key="PROJ-1",
            fields=IssueFields(
                summary="Test issue",
                status=IssueStatus(id="1", name="Open", description="Open"),
                issue_type=IssueType(id="10002", name="Task", description="Task"),
                project=ProjectRef(id="10000", key="PROJ", name="Test Project")
            )
        )
        
        # Set up mocks
        self.mock_client.get_project.return_value = mock_project
        self.mock_client.get_issue_type_id_by_name.return_value = "10002"
        
        # Mock the create_issue method that will be called internally
        with patch.object(self.issue_service, 'create_issue', return_value=mock_issue) as mock_create:
            result = self.issue_service.create_issue_by_type_name(
                project_key="PROJ",
                summary="Test task",
                issue_type_name="TASK",  # Uppercase
            )
            
            # Verify the result
            assert result == mock_issue
            
            # Verify get_issue_type_id_by_name was called with the original case
            self.mock_client.get_issue_type_id_by_name.assert_called_once_with("PROJ", "TASK")