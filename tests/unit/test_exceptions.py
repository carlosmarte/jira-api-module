"""Unit tests for custom exceptions."""

import pytest

from jira_api.exceptions import (
    JiraAPIError,
    JiraAuthenticationError,
    JiraNotFoundError,
    JiraPermissionError,
    JiraRateLimitError,
    JiraServerError,
    JiraValidationError,
    SDKError,
)


class TestJiraAPIError:
    """Test JiraAPIError and its subclasses."""

    def test_base_jira_api_error(self):
        """Test base JiraAPIError."""
        error = JiraAPIError("Something went wrong")
        
        assert str(error) == "JIRA API Error: Something went wrong"
        assert error.message == "Something went wrong"
        assert error.status_code is None
        assert error.response_data == {}

    def test_jira_api_error_with_status_code(self):
        """Test JiraAPIError with status code."""
        error = JiraAPIError("Bad request", status_code=400)
        
        assert str(error) == "JIRA API Error (400): Bad request"
        assert error.status_code == 400

    def test_jira_api_error_with_response_data(self):
        """Test JiraAPIError with response data."""
        response_data = {"errorMessages": ["Field is required"]}
        error = JiraAPIError("Validation failed", response_data=response_data)
        
        assert error.response_data == response_data

    def test_authentication_error(self):
        """Test JiraAuthenticationError."""
        error = JiraAuthenticationError()
        
        assert str(error) == "JIRA API Error (401): Authentication failed"
        assert error.status_code == 401

    def test_authentication_error_custom_message(self):
        """Test JiraAuthenticationError with custom message."""
        error = JiraAuthenticationError("Invalid API token")
        
        assert str(error) == "JIRA API Error (401): Invalid API token"
        assert error.message == "Invalid API token"

    def test_permission_error(self):
        """Test JiraPermissionError."""
        error = JiraPermissionError()
        
        assert str(error) == "JIRA API Error (403): Permission denied"
        assert error.status_code == 403

    def test_not_found_error(self):
        """Test JiraNotFoundError."""
        error = JiraNotFoundError("Issue not found")
        
        assert str(error) == "JIRA API Error (404): Issue not found"
        assert error.status_code == 404

    def test_validation_error(self):
        """Test JiraValidationError."""
        error = JiraValidationError("Invalid field value")
        
        assert str(error) == "JIRA API Error (400): Invalid field value"
        assert error.status_code == 400

    def test_rate_limit_error(self):
        """Test JiraRateLimitError."""
        error = JiraRateLimitError()
        
        assert str(error) == "JIRA API Error (429): Rate limit exceeded"
        assert error.status_code == 429

    def test_server_error(self):
        """Test JiraServerError."""
        error = JiraServerError("Database connection failed")
        
        assert str(error) == "JIRA API Error (500): Database connection failed"
        assert error.status_code == 500


class TestSDKError:
    """Test SDKError."""

    def test_sdk_error_basic(self):
        """Test basic SDKError."""
        error = SDKError("Server is down")
        
        assert str(error) == "SDK Error: Server is down"
        assert error.message == "Server is down"
        assert error.status_code is None
        assert error.response_data == {}

    def test_sdk_error_with_status_code(self):
        """Test SDKError with status code."""
        error = SDKError("Not found", status_code=404)
        
        assert str(error) == "SDK Error (404): Not found"
        assert error.status_code == 404

    def test_sdk_error_with_response_data(self):
        """Test SDKError with response data."""
        response_data = {"detail": "Resource not found"}
        error = SDKError("Error", status_code=404, response_data=response_data)
        
        assert error.response_data == response_data


class TestExceptionInheritance:
    """Test exception inheritance hierarchy."""

    def test_jira_api_error_inheritance(self):
        """Test that all JIRA exceptions inherit from JiraAPIError."""
        assert issubclass(JiraAuthenticationError, JiraAPIError)
        assert issubclass(JiraPermissionError, JiraAPIError)
        assert issubclass(JiraNotFoundError, JiraAPIError)
        assert issubclass(JiraValidationError, JiraAPIError)
        assert issubclass(JiraRateLimitError, JiraAPIError)
        assert issubclass(JiraServerError, JiraAPIError)

    def test_base_exception_inheritance(self):
        """Test that exceptions inherit from base Exception."""
        assert issubclass(JiraAPIError, Exception)
        assert issubclass(SDKError, Exception)

    def test_exception_catching(self):
        """Test that specific exceptions can be caught as base exceptions."""
        try:
            raise JiraAuthenticationError("Test")
        except JiraAPIError as e:
            assert e.status_code == 401

        try:
            raise SDKError("Test", status_code=500)
        except Exception as e:
            assert isinstance(e, SDKError)