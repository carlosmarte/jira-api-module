// Main clients
export { JiraFetchClient } from "./JiraFetchClient.js";
export { FetchClient } from "./FetchClient.js";

// Types
export type {
  FetchAdapter,
  RateLimitAdapter,
  RequestCache,
  RetryHandler,
  TransformRequest,
  TransformResponse,
  FetchClientOptions,
  HttpMethod,
  JiraRequestConfig,
  JiraClientOptions,
  JiraResponse,
} from "./types.js";

// Errors
export { JiraFetchError, ErrorCode } from "./errors.js";
export type { JiraFetchErrorOptions } from "./errors.js";

// Built-in adapters
export { UndiciFetchAdapter } from "./adapters/index.js";

// Utils
export {
  parseResponseData,
  createTimeoutSignal,
  mergeAbortSignals,
} from "./utils/index.js";
