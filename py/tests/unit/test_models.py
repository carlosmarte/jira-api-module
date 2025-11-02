"""Unit tests for Pydantic models."""

import pytest
from datetime import datetime

from jira_api.models.user import User, UserSearch
from jira_api.models.project import Project, ProjectVersion, ProjectVersionCreate
from jira_api.models.issue import (
    Issue,
    IssueCreate,
    IssueUpdate,
    IssueFields,
    IssueStatus,
    IssueTransition,
    IssueTransitionRequest,
)


class TestUserModels:
    """Test user-related models."""

    def test_user_model_creation(self):
        """Test User model creation with required fields."""
        user = User(
            account_id="12345",
            display_name="John Doe",
            active=True,
        )
        
        assert user.account_id == "12345"
        assert user.display_name == "John Doe"
        assert user.active is True
        assert user.email_address is None

    def test_user_model_with_all_fields(self):
        """Test User model with all optional fields."""
        user = User(
            account_id="12345",
            email_address="john@example.com",
            display_name="John Doe",
            active=True,
            avatar_urls={"48x48": "https://example.com/avatar.png"},
            time_zone="UTC",
            locale="en_US",
        )
        
        assert user.email_address == "john@example.com"
        assert user.avatar_urls == {"48x48": "https://example.com/avatar.png"}
        assert user.time_zone == "UTC"
        assert user.locale == "en_US"

    def test_user_search_model(self):
        """Test UserSearch model."""
        search = UserSearch(query="john", max_results=25)
        
        assert search.query == "john"
        assert search.max_results == 25
        assert search.start_at == 0
        assert search.project_keys is None


class TestProjectModels:
    """Test project-related models."""

    def test_project_version_model(self):
        """Test ProjectVersion model creation."""
        version = ProjectVersion(
            id="10000",
            name="Version 1.0",
            project_id=1000,
            archived=False,
            released=True,
        )
        
        assert version.id == "10000"
        assert version.name == "Version 1.0"
        assert version.project_id == 1000
        assert version.archived is False
        assert version.released is True
        assert version.description is None

    def test_project_version_create_model(self):
        """Test ProjectVersionCreate model."""
        version_create = ProjectVersionCreate(
            name="Version 2.0",
            project_id=1000,
            description="New version",
            start_date="2023-01-01",
            release_date="2023-12-31",
        )
        
        assert version_create.name == "Version 2.0"
        assert version_create.project_id == 1000
        assert version_create.description == "New version"
        assert version_create.start_date == "2023-01-01"
        assert version_create.release_date == "2023-12-31"

    def test_project_model(self):
        """Test Project model creation."""
        project = Project(
            id="10000",
            key="TEST",
            name="Test Project",
            project_type_key="software",
        )
        
        assert project.id == "10000"
        assert project.key == "TEST"
        assert project.name == "Test Project"
        assert project.project_type_key == "software"
        assert project.description is None


class TestIssueModels:
    """Test issue-related models."""

    def test_issue_status_model(self):
        """Test IssueStatus model."""
        status = IssueStatus(
            id="1",
            name="Open",
            description="Issue is open",
        )
        
        assert status.id == "1"
        assert status.name == "Open"
        assert status.description == "Issue is open"

    def test_issue_transition_model(self):
        """Test IssueTransition model."""
        status = IssueStatus(id="2", name="In Progress", description="Work in progress")
        transition = IssueTransition(
            id="11",
            name="Start Progress",
            to=status,
            has_screen=True,
        )
        
        assert transition.id == "11"
        assert transition.name == "Start Progress"
        assert transition.to.name == "In Progress"
        assert transition.has_screen is True

    def test_issue_create_model(self):
        """Test IssueCreate model."""
        issue_create = IssueCreate(
            project_id="10000",
            summary="Test issue",
            issue_type_id="10001",
            description="Test description",
            labels=["bug", "urgent"],
        )
        
        assert issue_create.project_id == "10000"
        assert issue_create.summary == "Test issue"
        assert issue_create.issue_type_id == "10001"
        assert issue_create.description == "Test description"
        assert issue_create.labels == ["bug", "urgent"]

    def test_issue_create_to_jira_format(self):
        """Test IssueCreate to_jira_format method."""
        issue_create = IssueCreate(
            project_id="10000",
            summary="Test issue",
            issue_type_id="10001",
            description="Test description",
            priority_id="3",
            assignee_account_id="12345",
            labels=["bug"],
        )
        
        jira_format = issue_create.to_jira_format()
        
        assert jira_format["fields"]["project"]["id"] == "10000"
        assert jira_format["fields"]["summary"] == "Test issue"
        assert jira_format["fields"]["issuetype"]["id"] == "10001"
        assert jira_format["fields"]["priority"]["id"] == "3"
        assert jira_format["fields"]["assignee"]["accountId"] == "12345"
        assert jira_format["fields"]["labels"] == ["bug"]
        
        # Check description format (ADF)
        description = jira_format["fields"]["description"]
        assert description["type"] == "doc"
        assert description["version"] == 1
        assert description["content"][0]["type"] == "paragraph"
        assert description["content"][0]["content"][0]["text"] == "Test description"

    def test_issue_update_model(self):
        """Test IssueUpdate model."""
        issue_update = IssueUpdate(
            summary="Updated summary",
            labels_add=["new-label"],
            labels_remove=["old-label"],
        )
        
        assert issue_update.summary == "Updated summary"
        assert issue_update.labels_add == ["new-label"]
        assert issue_update.labels_remove == ["old-label"]

    def test_issue_update_to_jira_format(self):
        """Test IssueUpdate to_jira_format method."""
        issue_update = IssueUpdate(
            summary="Updated summary",
            description="Updated description",
            labels_add=["new"],
            labels_remove=["old"],
        )
        
        jira_format = issue_update.to_jira_format()
        
        assert jira_format["update"]["summary"] == [{"set": "Updated summary"}]
        assert {"add": "new"} in jira_format["update"]["labels"]
        assert {"remove": "old"} in jira_format["update"]["labels"]
        
        # Check description format
        description_update = jira_format["update"]["description"][0]["set"]
        assert description_update["type"] == "doc"

    def test_issue_transition_request_model(self):
        """Test IssueTransitionRequest model."""
        transition_request = IssueTransitionRequest(
            transition_id="11",
            comment="Moving to in progress",
            resolution_name="Fixed",
        )
        
        assert transition_request.transition_id == "11"
        assert transition_request.comment == "Moving to in progress"
        assert transition_request.resolution_name == "Fixed"

    def test_issue_transition_request_to_jira_format(self):
        """Test IssueTransitionRequest to_jira_format method."""
        transition_request = IssueTransitionRequest(
            transition_id="11",
            comment="Resolving issue",
            resolution_name="Fixed",
        )
        
        jira_format = transition_request.to_jira_format()
        
        assert jira_format["transition"]["id"] == "11"
        assert jira_format["fields"]["resolution"]["name"] == "Fixed"
        
        # Check comment format
        comment_update = jira_format["update"]["comment"][0]["add"]["body"]
        assert comment_update["type"] == "doc"
        assert comment_update["content"][0]["content"][0]["text"] == "Resolving issue"


class TestModelValidation:
    """Test model validation."""

    def test_user_missing_required_fields(self):
        """Test User model validation with missing required fields."""
        with pytest.raises(ValueError):
            User()

    def test_issue_create_missing_required_fields(self):
        """Test IssueCreate model validation with missing required fields."""
        with pytest.raises(ValueError):
            IssueCreate()

    def test_project_version_create_missing_required_fields(self):
        """Test ProjectVersionCreate validation with missing required fields."""
        with pytest.raises(ValueError):
            ProjectVersionCreate()