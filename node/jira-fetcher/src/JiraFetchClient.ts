import { FetchClient } from "./FetchClient.js";
import type { JiraClientOptions, JiraRequestConfig, JiraResponse } from "./types.js";
import { ErrorCode, JiraFetchError } from "./errors.js";

/**
 * JIRA-specific fetch client that wraps the generic FetchClient.
 * Provides conveniences for working with JIRA API:
 * - Base URL handling
 * - Path parameter interpolation
 * - Query parameter serialization
 * - Type-safe request/response handling
 */
export class JiraFetchClient {
  private readonly baseUrl: string;
  private readonly fetchClient: FetchClient;

  constructor(options: JiraClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.fetchClient = new FetchClient(options.fetchClientOptions);
  }

  /**
   * Makes a type-safe JIRA API request.
   *
   * @param config - JIRA request configuration
   * @returns Parsed response data
   *
   * @example
   * ```typescript
   * // GET request with path parameters
   * const issue = await client.request<Issue>({
   *   method: "GET",
   *   path: "/rest/api/2/issue/{issueIdOrKey}",
   *   pathParams: { issueIdOrKey: "PROJ-123" }
   * });
   *
   * // POST request with body
   * const newIssue = await client.request<Issue>({
   *   method: "POST",
   *   path: "/rest/api/2/issue",
   *   body: { fields: { ... } }
   * });
   * ```
   */
  async request<T = unknown>(config: JiraRequestConfig): Promise<JiraResponse<T>> {
    // Build the URL with path parameters and query parameters
    const url = this.buildUrl(config);

    // Build RequestInit
    const init: RequestInit = {
      method: config.method,
      headers: this.buildHeaders(config),
    };

    // Add body for POST, PUT, PATCH requests
    if (config.body !== undefined && config.method !== "GET") {
      init.body = JSON.stringify(config.body);
    }

    // Make the request
    return this.fetchClient.request<T>(url, init);
  }

  /**
   * Builds the full URL with path and query parameters.
   */
  private buildUrl(config: JiraRequestConfig): string {
    let path = config.path;

    // Interpolate path parameters
    if (config.pathParams) {
      for (const [key, value] of Object.entries(config.pathParams)) {
        const placeholder = `{${key}}`;
        if (!path.includes(placeholder)) {
          throw new JiraFetchError(
            ErrorCode.CONFIGURATION,
            `Path parameter "${key}" not found in path: ${path}`,
            { details: { path, pathParams: config.pathParams } }
          );
        }
        path = path.replace(placeholder, encodeURIComponent(String(value)));
      }
    }

    // Check for remaining placeholders
    const remainingPlaceholders = path.match(/\{[^}]+\}/g);
    if (remainingPlaceholders) {
      throw new JiraFetchError(
        ErrorCode.CONFIGURATION,
        `Missing path parameters: ${remainingPlaceholders.join(", ")}`,
        { details: { path, pathParams: config.pathParams } }
      );
    }

    // Build the full URL
    const url = new URL(path, this.baseUrl);

    // Add query parameters
    if (config.queryParams) {
      for (const [key, value] of Object.entries(config.queryParams)) {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            // Handle array query parameters
            for (const item of value) {
              url.searchParams.append(key, String(item));
            }
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      }
    }

    return url.toString();
  }

  /**
   * Builds request headers.
   */
  private buildHeaders(config: JiraRequestConfig): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...config.headers,
    };

    return headers;
  }

  /**
   * Convenience method for GET requests.
   */
  async get<T = unknown>(
    path: string,
    options: Omit<JiraRequestConfig, "method" | "path"> = {}
  ): Promise<JiraResponse<T>> {
    return this.request<T>({ ...options, method: "GET", path });
  }

  /**
   * Convenience method for POST requests.
   */
  async post<T = unknown>(
    path: string,
    body?: unknown,
    options: Omit<JiraRequestConfig, "method" | "path" | "body"> = {}
  ): Promise<JiraResponse<T>> {
    return this.request<T>({ ...options, method: "POST", path, body });
  }

  /**
   * Convenience method for PUT requests.
   */
  async put<T = unknown>(
    path: string,
    body?: unknown,
    options: Omit<JiraRequestConfig, "method" | "path" | "body"> = {}
  ): Promise<JiraResponse<T>> {
    return this.request<T>({ ...options, method: "PUT", path, body });
  }

  /**
   * Convenience method for DELETE requests.
   */
  async delete<T = unknown>(
    path: string,
    options: Omit<JiraRequestConfig, "method" | "path"> = {}
  ): Promise<JiraResponse<T>> {
    return this.request<T>({ ...options, method: "DELETE", path });
  }

  /**
   * Convenience method for PATCH requests.
   */
  async patch<T = unknown>(
    path: string,
    body?: unknown,
    options: Omit<JiraRequestConfig, "method" | "path" | "body"> = {}
  ): Promise<JiraResponse<T>> {
    return this.request<T>({ ...options, method: "PATCH", path, body });
  }
}
