/**
 * Machine-readable error codes for consistent error handling.
 */
export enum ErrorCode {
  /** Network-level error (connection failed, DNS resolution, etc.) */
  NETWORK = "NETWORK",
  /** HTTP response error (4xx, 5xx status codes) */
  RESPONSE = "RESPONSE",
  /** Request timeout */
  TIMEOUT = "TIMEOUT",
  /** Invalid configuration */
  CONFIGURATION = "CONFIGURATION",
}

/**
 * Options for creating a JiraFetchError.
 */
export interface JiraFetchErrorOptions {
  /** The underlying error cause */
  cause?: unknown;
  /** HTTP status code (for RESPONSE errors) */
  status?: number;
  /** Additional error details (response body, etc.) */
  details?: unknown;
  /** The request URL */
  url?: string;
  /** The HTTP method */
  method?: string;
}

/**
 * Standardized error class for all fetch-related errors.
 * Provides machine-readable error codes and detailed error information.
 */
export class JiraFetchError extends Error {
  public readonly name = "JiraFetchError";
  public readonly code: ErrorCode;
  public readonly status?: number;
  public readonly details?: unknown;
  public readonly url?: string;
  public readonly method?: string;
  public readonly cause?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    options: JiraFetchErrorOptions = {}
  ) {
    super(message);
    this.code = code;
    this.status = options.status;
    this.details = options.details;
    this.url = options.url;
    this.method = options.method;
    this.cause = options.cause;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, JiraFetchError);
    }
  }

  /**
   * Returns a JSON representation of the error.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      status: this.status,
      details: this.details,
      url: this.url,
      method: this.method,
    };
  }

  /**
   * Helper to check if an error is a JiraFetchError.
   */
  static isJiraFetchError(error: unknown): error is JiraFetchError {
    return error instanceof JiraFetchError;
  }

  /**
   * Helper to check if an error is a specific error code.
   */
  static hasErrorCode(error: unknown, code: ErrorCode): boolean {
    return JiraFetchError.isJiraFetchError(error) && error.code === code;
  }
}
