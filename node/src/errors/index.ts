/**
 * Custom error hierarchy for JIRA API operations
 * Maps HTTP status codes to specific error types for better error handling
 */

/**
 * Base error class for all JIRA API errors
 */
export class JiraAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'JiraAPIError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication error (HTTP 401)
 * Thrown when API token is invalid or missing
 */
export class JiraAuthenticationError extends JiraAPIError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'JiraAuthenticationError';
  }
}

/**
 * Permission error (HTTP 403)
 * Thrown when user lacks permission for the operation
 */
export class JiraPermissionError extends JiraAPIError {
  constructor(message: string = 'Permission denied') {
    super(message, 403);
    this.name = 'JiraPermissionError';
  }
}

/**
 * Not found error (HTTP 404)
 * Thrown when a resource (issue, user, project) is not found
 */
export class JiraNotFoundError extends JiraAPIError {
  constructor(resource: string) {
    super(`Resource not found: ${resource}`, 404);
    this.name = 'JiraNotFoundError';
  }
}

/**
 * Validation error (HTTP 400)
 * Thrown when request data fails validation
 */
export class JiraValidationError extends JiraAPIError {
  constructor(message: string, public errors?: any[]) {
    super(message, 400);
    this.name = 'JiraValidationError';
  }
}

/**
 * Rate limit error (HTTP 429)
 * Thrown when API rate limit is exceeded
 */
export class JiraRateLimitError extends JiraAPIError {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message, 429);
    this.name = 'JiraRateLimitError';
  }
}

/**
 * Server error (HTTP 5xx)
 * Thrown when JIRA server encounters an error
 */
export class JiraServerError extends JiraAPIError {
  constructor(message: string = 'JIRA server error', statusCode: number = 500) {
    super(message, statusCode);
    this.name = 'JiraServerError';
  }
}

/**
 * SDK error for REST client issues
 */
export class SDKError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'SDKError';
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

/**
 * Maps HTTP status code to appropriate error class
 */
export function mapHttpError(status: number, response: any): JiraAPIError {
  const message = response?.message || response?.errorMessages?.[0] || 'Unknown error';

  switch (status) {
    case 401:
      return new JiraAuthenticationError(message);
    case 403:
      return new JiraPermissionError(message);
    case 404:
      return new JiraNotFoundError(response?.resource || 'Unknown resource');
    case 400:
      return new JiraValidationError(message, response?.errors);
    case 429:
      return new JiraRateLimitError(message, response?.retryAfter);
    case 500:
    case 502:
    case 503:
    case 504:
      return new JiraServerError(message, status);
    default:
      return new JiraAPIError(message, status, response);
  }
}

/**
 * Type guard to check if an error is a JIRA API error
 */
export function isJiraError(error: unknown): error is JiraAPIError {
  return error instanceof JiraAPIError;
}

/**
 * Type guard for authentication errors
 */
export function isAuthError(error: unknown): error is JiraAuthenticationError {
  return error instanceof JiraAuthenticationError;
}

/**
 * Type guard for rate limit errors
 */
export function isRateLimitError(error: unknown): error is JiraRateLimitError {
  return error instanceof JiraRateLimitError;
}
