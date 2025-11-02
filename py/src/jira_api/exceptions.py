"""Custom exceptions for JIRA API operations."""

from typing import Any, Dict, Optional


class JiraAPIError(Exception):
    """Base exception for all JIRA API errors."""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        response_data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Initialize JiraAPIError.
        
        Args:
            message: Error message
            status_code: HTTP status code if applicable
            response_data: Response data from API if available
        """
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.response_data = response_data or {}

    def __str__(self) -> str:
        """Return string representation of the error."""
        if self.status_code:
            return f"JIRA API Error ({self.status_code}): {self.message}"
        return f"JIRA API Error: {self.message}"


class JiraAuthenticationError(JiraAPIError):
    """Exception raised for authentication failures."""

    def __init__(self, message: str = "Authentication failed") -> None:
        """Initialize JiraAuthenticationError."""
        super().__init__(message, status_code=401)


class JiraPermissionError(JiraAPIError):
    """Exception raised for permission/authorization failures."""

    def __init__(self, message: str = "Permission denied") -> None:
        """Initialize JiraPermissionError."""
        super().__init__(message, status_code=403)


class JiraNotFoundError(JiraAPIError):
    """Exception raised when a resource is not found."""

    def __init__(self, message: str = "Resource not found") -> None:
        """Initialize JiraNotFoundError."""
        super().__init__(message, status_code=404)


class JiraValidationError(JiraAPIError):
    """Exception raised for validation failures."""

    def __init__(self, message: str = "Validation failed") -> None:
        """Initialize JiraValidationError."""
        super().__init__(message, status_code=400)


class JiraRateLimitError(JiraAPIError):
    """Exception raised when rate limit is exceeded."""

    def __init__(self, message: str = "Rate limit exceeded") -> None:
        """Initialize JiraRateLimitError."""
        super().__init__(message, status_code=429)


class JiraServerError(JiraAPIError):
    """Exception raised for server-side errors."""

    def __init__(self, message: str = "Internal server error") -> None:
        """Initialize JiraServerError."""
        super().__init__(message, status_code=500)


class SDKError(Exception):
    """Exception raised by the SDK client for non-successful server responses."""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        response_data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Initialize SDKError.
        
        Args:
            message: Error message
            status_code: HTTP status code if applicable
            response_data: Response data from server if available
        """
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.response_data = response_data or {}

    def __str__(self) -> str:
        """Return string representation of the error."""
        if self.status_code:
            return f"SDK Error ({self.status_code}): {self.message}"
        return f"SDK Error: {self.message}"