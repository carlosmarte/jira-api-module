import type { FetchClientOptions } from "./types.js";
import { parseResponseData } from "./utils/parseResponseData.js";
import { createTimeoutSignal, mergeAbortSignals } from "./utils/createTimeoutSignal.js";
import { ErrorCode, JiraFetchError } from "./errors.js";

/**
 * Generic, composable fetch client with pluggable adapters.
 * Provides a foundation for making HTTP requests with consistent error handling,
 * timeout support, and optional caching/retry/rate-limiting.
 */
export class FetchClient {
  private readonly options: FetchClientOptions;

  constructor(options: FetchClientOptions) {
    this.options = options;
  }

  /**
   * Makes an HTTP request with full lifecycle support.
   *
   * @param url - The URL to fetch
   * @param init - RequestInit options
   * @returns Parsed response data
   */
  async request<T = unknown>(url: string, init: RequestInit = {}): Promise<T> {
    const {
      fetchAdapter,
      rateLimitAdapter,
      requestCache,
      retryHandler,
      transformResponse,
      timeoutMs = 10_000,
    } = this.options;

    // Use URL and init as-is (no transformation)
    const finalUrl = url;
    const finalInit = init;

    // Check cache for GET requests
    const cacheKey = `${finalInit.method ?? "GET"}:${finalUrl}`;
    if (requestCache && (finalInit.method === "GET" || !finalInit.method)) {
      const cached = await requestCache.get(cacheKey);
      if (cached) {
        return (await parseResponseData(cached)) as T;
      }
    }

    // Setup timeout signal
    const timeoutSignal = createTimeoutSignal(timeoutMs);
    finalInit.signal = finalInit.signal
      ? mergeAbortSignals([finalInit.signal, timeoutSignal])
      : timeoutSignal;

    // Core fetch execution
    const execute = async (): Promise<T> => {
      try {
        // Perform the fetch
        const response = await fetchAdapter.fetch(finalUrl, finalInit);

        // Apply response transformation
        const processed = transformResponse
          ? await transformResponse(response)
          : response;

        // Check for HTTP errors
        if (!processed.ok) {
          const body = await processed.text().catch(() => undefined);
          throw new JiraFetchError(
            ErrorCode.RESPONSE,
            `Request failed with status ${processed.status}`,
            {
              status: processed.status,
              details: body,
              url: finalUrl,
              method: finalInit.method ?? "GET",
            }
          );
        }

        // Cache successful GET requests
        if (requestCache && (finalInit.method === "GET" || !finalInit.method)) {
          await requestCache.set(cacheKey, processed.clone());
        }

        // Parse and return response data
        return (await parseResponseData(processed)) as T;
      } catch (error: unknown) {
        // Handle timeout errors
        if (error instanceof Error && error.name === "AbortError") {
          throw new JiraFetchError(
            ErrorCode.TIMEOUT,
            `Request timed out after ${timeoutMs}ms`,
            {
              cause: error,
              url: finalUrl,
              method: finalInit.method ?? "GET",
            }
          );
        }

        // Re-throw JiraFetchError as-is
        if (error instanceof JiraFetchError) {
          throw error;
        }

        // Wrap all other errors as network errors
        throw new JiraFetchError(ErrorCode.NETWORK, "Network request failed", {
          cause: error,
          url: finalUrl,
          method: finalInit.method ?? "GET",
        });
      }
    };

    // Apply retry logic
    const withRetry = retryHandler ? () => retryHandler.run(execute) : execute;

    // Apply rate limiting
    const invoke = rateLimitAdapter
      ? () => rateLimitAdapter.schedule(withRetry)
      : withRetry;

    return invoke();
  }
}
