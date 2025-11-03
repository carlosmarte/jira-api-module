/**
 * Core adapter interface for pluggable fetch implementations.
 * Users can provide their own fetch implementation (undici, node-fetch, cross-fetch, browser fetch, etc.)
 */
export interface FetchAdapter {
  fetch(url: string, init?: RequestInit): Promise<Response>;
}

/**
 * Optional rate limiting adapter interface.
 * Allows throttling and concurrency control.
 */
export interface RateLimitAdapter {
  schedule<T>(fn: () => Promise<T>): Promise<T>;
}

/**
 * Optional request cache adapter interface.
 * Enables caching of request/response pairs.
 */
export interface RequestCache {
  get(key: string): Promise<Response | undefined>;
  set(key: string, response: Response): Promise<void>;
}

/**
 * Optional retry handler interface.
 * Handles retry logic for transient failures.
 */
export interface RetryHandler {
  run<T>(fn: () => Promise<T>): Promise<T>;
}

/**
 * Request transformation hook.
 * Allows modifying the request before it's sent.
 */
export type TransformRequest = (
  url: string,
  init: RequestInit
) => Promise<[string, RequestInit]> | [string, RequestInit];

/**
 * Response transformation hook.
 * Allows modifying the response after it's received.
 */
export type TransformResponse = (
  response: Response
) => Promise<Response> | Response;

/**
 * Configuration options for the generic FetchClient.
 */
export interface FetchClientOptions {
  /** Required: Fetch adapter implementation */
  fetchAdapter: FetchAdapter;
  /** Optional: Rate limiting adapter */
  rateLimitAdapter?: RateLimitAdapter;
  /** Optional: Request cache adapter */
  requestCache?: RequestCache;
  /** Optional: Retry handler */
  retryHandler?: RetryHandler;
  /** Optional: Request timeout in milliseconds (default: 10000) */
  timeoutMs?: number;
  /** Optional: Transform request before sending */
  transformRequest?: TransformRequest;
  /** Optional: Transform response after receiving */
  transformResponse?: TransformResponse;
}

/**
 * HTTP method types supported by JIRA API.
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/**
 * JIRA request configuration.
 * Provides a clean interface for making JIRA API requests.
 */
export interface JiraRequestConfig {
  /** HTTP method */
  method: HttpMethod;
  /** API endpoint path (e.g., "/api/2/issue/{issueIdOrKey}") */
  path: string;
  /** Path parameters to interpolate (e.g., { issueIdOrKey: "PROJ-123" }) */
  pathParams?: Record<string, string | number>;
  /** Query parameters */
  queryParams?: Record<string, string | number | boolean | string[] | undefined>;
  /** Request body */
  body?: unknown;
  /** Additional headers */
  headers?: Record<string, string>;
  /** Override default timeout for this request */
  timeoutMs?: number;
}

/**
 * JIRA client configuration options.
 */
export interface JiraClientOptions {
  /** JIRA instance base URL (e.g., "https://your-domain.atlassian.net") */
  baseUrl: string;
  /** Fetch client options */
  fetchClientOptions: FetchClientOptions;
}

/**
 * Type-safe JIRA response wrapper.
 */
export type JiraResponse<T = unknown> = T;
