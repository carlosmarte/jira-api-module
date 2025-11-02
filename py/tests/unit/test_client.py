"""Unit tests for JIRA client functionality."""

import pytest
from unittest.mock import Mock, patch
import httpx

from jira_api.core.client import JiraClient
from jira_api.exceptions import JiraValidationError


class TestJiraClient:
    """Test JIRA client functionality."""

    def test_get_issue_type_id_by_name_success(self):
        """Test successful issue type ID lookup by name."""
        # Mock the project data with issue types
        mock_project_data = {
            "issueTypes": [
                {"id": "10000", "name": "Epic"},
                {"id": "10001", "name": "Story"},
                {"id": "10002", "name": "Task"},
                {"id": "10004", "name": "Bug"},
            ]
        }
        
        with patch.object(JiraClient, '_make_request', return_value=mock_project_data):
            client = JiraClient(
                base_url="https://test.atlassian.net",
                email="test@example.com",
                api_token="test-token"
            )
            
            # Test exact match
            issue_type_id = client.get_issue_type_id_by_name("PROJ", "Bug")
            assert issue_type_id == "10004"
            
            # Test case insensitive match
            issue_type_id = client.get_issue_type_id_by_name("PROJ", "bug")
            assert issue_type_id == "10004"
            
            issue_type_id = client.get_issue_type_id_by_name("PROJ", "STORY")
            assert issue_type_id == "10001"

    def test_get_issue_type_id_by_name_not_found(self):
        """Test issue type ID lookup when type name not found."""
        # Mock the project data with issue types
        mock_project_data = {
            "issueTypes": [
                {"id": "10000", "name": "Epic"},
                {"id": "10001", "name": "Story"},
                {"id": "10002", "name": "Task"},
            ]
        }
        
        with patch.object(JiraClient, '_make_request', return_value=mock_project_data):
            client = JiraClient(
                base_url="https://test.atlassian.net",
                email="test@example.com",
                api_token="test-token"
            )
            
            with pytest.raises(JiraValidationError) as exc_info:
                client.get_issue_type_id_by_name("PROJ", "Bug")
            
            error_msg = str(exc_info.value)
            assert "Issue type 'Bug' not found in project 'PROJ'" in error_msg
            assert "Available types: Epic, Story, Task" in error_msg

    def test_get_project_issue_types(self):
        """Test getting issue types for a project."""
        expected_issue_types = [
            {"id": "10000", "name": "Epic"},
            {"id": "10001", "name": "Story"},
            {"id": "10002", "name": "Task"},
            {"id": "10004", "name": "Bug"},
        ]
        
        mock_project_data = {"issueTypes": expected_issue_types}
        
        with patch.object(JiraClient, '_make_request', return_value=mock_project_data):
            client = JiraClient(
                base_url="https://test.atlassian.net",
                email="test@example.com",
                api_token="test-token"
            )
            
            issue_types = client.get_project_issue_types("PROJ")
            assert issue_types == expected_issue_types

    def test_get_project_issue_types_empty(self):
        """Test getting issue types when none exist."""
        mock_project_data = {"issueTypes": []}
        
        with patch.object(JiraClient, '_make_request', return_value=mock_project_data):
            client = JiraClient(
                base_url="https://test.atlassian.net",
                email="test@example.com",
                api_token="test-token"
            )
            
            issue_types = client.get_project_issue_types("PROJ")
            assert issue_types == []

    def test_get_project_issue_types_missing_key(self):
        """Test getting issue types when issueTypes key is missing."""
        mock_project_data = {}
        
        with patch.object(JiraClient, '_make_request', return_value=mock_project_data):
            client = JiraClient(
                base_url="https://test.atlassian.net",
                email="test@example.com",
                api_token="test-token"
            )
            
            issue_types = client.get_project_issue_types("PROJ")
            assert issue_types == []