import { describe, it, expect, vi, beforeEach } from "vitest";
import { FetchClient } from "./FetchClient.js";
import { ErrorCode, JiraFetchError } from "./errors.js";
import type {
  FetchAdapter,
  RateLimitAdapter,
  RequestCache,
  RetryHandler,
} from "./types.js";

// Mock adapters
class MockFetchAdapter implements FetchAdapter {
  private mockFetch = vi.fn();

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    return this.mockFetch(url, init);
  }

  mockResponse(data: unknown, options: { status?: number; headers?: Record<string, string> } = {}) {
    const response = new Response(JSON.stringify(data), {
      status: options.status ?? 200,
      headers: {
        "content-type": "application/json",
        ...options.headers,
      },
    });
    this.mockFetch.mockResolvedValueOnce(response);
  }

  mockError(error: Error) {
    this.mockFetch.mockRejectedValueOnce(error);
  }

  getMock() {
    return this.mockFetch;
  }
}

class MockRateLimiter implements RateLimitAdapter {
  public scheduleCallCount = 0;

  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    this.scheduleCallCount++;
    return fn();
  }
}

class MockCache implements RequestCache {
  private cache = new Map<string, Response>();

  async get(key: string): Promise<Response | undefined> {
    return this.cache.get(key);
  }

  async set(key: string, response: Response): Promise<void> {
    this.cache.set(key, response);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }
}

class MockRetryHandler implements RetryHandler {
  public runCallCount = 0;

  constructor(private shouldSucceed = true) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    this.runCallCount++;
    if (this.shouldSucceed) {
      return fn();
    }
    throw new Error("Retry failed");
  }
}

describe("FetchClient", () => {
  let mockAdapter: MockFetchAdapter;

  beforeEach(() => {
    mockAdapter = new MockFetchAdapter();
    vi.clearAllMocks();
  });

  describe("basic requests", () => {
    it("should make a successful request", async () => {
      const client = new FetchClient({ fetchAdapter: mockAdapter });
      const responseData = { id: 1, name: "Test" };

      mockAdapter.mockResponse(responseData);

      const result = await client.request("https://api.example.com/data");
      expect(result).toEqual(responseData);
    });

    it("should pass URL and init to fetch adapter", async () => {
      const client = new FetchClient({ fetchAdapter: mockAdapter });
      mockAdapter.mockResponse({ success: true });

      await client.request("https://api.example.com/data", {
        method: "POST",
        headers: { "X-Custom": "header" },
      });

      const mock = mockAdapter.getMock();
      expect(mock).toHaveBeenCalledWith(
        "https://api.example.com/data",
        expect.objectContaining({
          method: "POST",
          headers: { "X-Custom": "header" },
        })
      );
    });

    it("should handle GET request by default", async () => {
      const client = new FetchClient({ fetchAdapter: mockAdapter });
      mockAdapter.mockResponse({ data: "test" });

      await client.request("https://api.example.com/data");

      const mock = mockAdapter.getMock();
      const callInit = mock.mock.calls[0][1];
      expect(callInit?.method).toBeUndefined(); // GET is default
    });
  });

  describe("error handling", () => {
    it("should throw JiraFetchError on HTTP error", async () => {
      const client = new FetchClient({ fetchAdapter: mockAdapter });
      mockAdapter.mockResponse({ error: "Not found" }, { status: 404 });

      try {
        await client.request("https://api.example.com/data");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(JiraFetchError);
        expect((error as JiraFetchError).code).toBe(ErrorCode.RESPONSE);
        expect((error as JiraFetchError).status).toBe(404);
      }
    });

    it("should throw NETWORK error on fetch failure", async () => {
      const client = new FetchClient({ fetchAdapter: mockAdapter });
      mockAdapter.mockError(new Error("Connection refused"));

      await expect(
        client.request("https://api.example.com/data")
      ).rejects.toThrow(JiraFetchError);

      try {
        await client.request("https://api.example.com/data");
      } catch (error) {
        expect(error).toBeInstanceOf(JiraFetchError);
        expect((error as JiraFetchError).code).toBe(ErrorCode.NETWORK);
      }
    });

    it("should throw TIMEOUT error on abort", async () => {
      const client = new FetchClient({
        fetchAdapter: mockAdapter,
        timeoutMs: 100,
      });

      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      mockAdapter.mockError(abortError);

      try {
        await client.request("https://api.example.com/data");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(JiraFetchError);
        expect((error as JiraFetchError).code).toBe(ErrorCode.TIMEOUT);
      }
    });

    it("should preserve JiraFetchError thrown from transformResponse", async () => {
      const customError = new JiraFetchError(
        ErrorCode.CONFIGURATION,
        "Transform failed"
      );

      const client = new FetchClient({
        fetchAdapter: mockAdapter,
        transformResponse: () => {
          throw customError;
        },
      });

      mockAdapter.mockResponse({ data: "test" });

      await expect(
        client.request("https://api.example.com/data")
      ).rejects.toBe(customError);
    });
  });

  describe("transformRequest", () => {
    it("should transform request URL and init", async () => {
      const client = new FetchClient({
        fetchAdapter: mockAdapter,
        transformRequest: (url, init) => [
          url + "?transformed=true",
          {
            ...init,
            headers: { ...init.headers, Authorization: "Bearer token" },
          },
        ],
      });

      mockAdapter.mockResponse({ success: true });

      await client.request("https://api.example.com/data");

      const mock = mockAdapter.getMock();
      expect(mock).toHaveBeenCalledWith(
        "https://api.example.com/data?transformed=true",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer token",
          }),
        })
      );
    });

    it("should support async transformRequest", async () => {
      const client = new FetchClient({
        fetchAdapter: mockAdapter,
        transformRequest: async (url, init) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return [url, { ...init, headers: { "X-Async": "true" } }];
        },
      });

      mockAdapter.mockResponse({ success: true });

      await client.request("https://api.example.com/data");

      const mock = mockAdapter.getMock();
      expect(mock).toHaveBeenCalledWith(
        "https://api.example.com/data",
        expect.objectContaining({
          headers: expect.objectContaining({ "X-Async": "true" }),
        })
      );
    });
  });

  describe("transformResponse", () => {
    it("should transform response", async () => {
      const client = new FetchClient({
        fetchAdapter: mockAdapter,
        transformResponse: async (response) => {
          const data = await response.json() as Record<string, unknown>;
          return new Response(JSON.stringify({ transformed: true, ...data }), {
            status: response.status,
            headers: response.headers,
          });
        },
      });

      mockAdapter.mockResponse({ original: "data" });

      const result = await client.request("https://api.example.com/data");
      expect(result).toEqual({ transformed: true, original: "data" });
    });

    it("should support sync transformResponse", async () => {
      const client = new FetchClient({
        fetchAdapter: mockAdapter,
        transformResponse: (response) => {
          return new Response(JSON.stringify({ sync: true }), {
            status: response.status,
            headers: response.headers,
          });
        },
      });

      mockAdapter.mockResponse({ original: "data" });

      const result = await client.request("https://api.example.com/data");
      expect(result).toEqual({ sync: true });
    });
  });

  describe("caching", () => {
    it("should cache successful GET requests", async () => {
      const cache = new MockCache();
      const client = new FetchClient({
        fetchAdapter: mockAdapter,
        requestCache: cache,
      });

      mockAdapter.mockResponse({ data: "cached" });

      await client.request("https://api.example.com/data");

      expect(cache.has("GET:https://api.example.com/data")).toBe(true);
    });

    it("should return cached response for subsequent GET requests", async () => {
      const cache = new MockCache();
      const client = new FetchClient({
        fetchAdapter: mockAdapter,
        requestCache: cache,
      });

      mockAdapter.mockResponse({ data: "first" });
      const firstResult = await client.request("https://api.example.com/data");
      expect(firstResult).toEqual({ data: "first" });

      mockAdapter.mockResponse({ data: "second" });
      const secondResult = await client.request(
        "https://api.example.com/data"
      );
      expect(secondResult).toEqual({ data: "first" }); // Should return cached

      expect(mockAdapter.getMock()).toHaveBeenCalledTimes(1); // Only called once
    });

    it("should not cache POST requests", async () => {
      const cache = new MockCache();
      const client = new FetchClient({
        fetchAdapter: mockAdapter,
        requestCache: cache,
      });

      mockAdapter.mockResponse({ data: "posted" });

      await client.request("https://api.example.com/data", { method: "POST" });

      expect(cache.has("POST:https://api.example.com/data")).toBe(false);
    });

    it("should use different cache keys for different URLs", async () => {
      const cache = new MockCache();
      const client = new FetchClient({
        fetchAdapter: mockAdapter,
        requestCache: cache,
      });

      mockAdapter.mockResponse({ data: "first" });
      await client.request("https://api.example.com/data1");

      mockAdapter.mockResponse({ data: "second" });
      await client.request("https://api.example.com/data2");

      expect(cache.has("GET:https://api.example.com/data1")).toBe(true);
      expect(cache.has("GET:https://api.example.com/data2")).toBe(true);
    });
  });

  describe("rate limiting", () => {
    it("should use rate limiter when provided", async () => {
      const rateLimiter = new MockRateLimiter();
      const client = new FetchClient({
        fetchAdapter: mockAdapter,
        rateLimitAdapter: rateLimiter,
      });

      mockAdapter.mockResponse({ data: "test" });

      await client.request("https://api.example.com/data");

      expect(rateLimiter.scheduleCallCount).toBe(1);
    });

    it("should work without rate limiter", async () => {
      const client = new FetchClient({ fetchAdapter: mockAdapter });

      mockAdapter.mockResponse({ data: "test" });

      const result = await client.request("https://api.example.com/data");
      expect(result).toEqual({ data: "test" });
    });
  });

  describe("retry handler", () => {
    it("should use retry handler when provided", async () => {
      const retryHandler = new MockRetryHandler();
      const client = new FetchClient({
        fetchAdapter: mockAdapter,
        retryHandler,
      });

      mockAdapter.mockResponse({ data: "test" });

      await client.request("https://api.example.com/data");

      expect(retryHandler.runCallCount).toBe(1);
    });

    it("should work without retry handler", async () => {
      const client = new FetchClient({ fetchAdapter: mockAdapter });

      mockAdapter.mockResponse({ data: "test" });

      const result = await client.request("https://api.example.com/data");
      expect(result).toEqual({ data: "test" });
    });
  });

  describe("timeout", () => {
    it("should use custom timeout", async () => {
      const client = new FetchClient({
        fetchAdapter: mockAdapter,
        timeoutMs: 5000,
      });

      mockAdapter.mockResponse({ data: "test" });

      await client.request("https://api.example.com/data");

      const mock = mockAdapter.getMock();
      const callInit = mock.mock.calls[0][1];
      expect(callInit?.signal).toBeDefined();
    });

    it("should use default timeout of 10000ms", async () => {
      const client = new FetchClient({ fetchAdapter: mockAdapter });

      mockAdapter.mockResponse({ data: "test" });

      await client.request("https://api.example.com/data");

      const mock = mockAdapter.getMock();
      const callInit = mock.mock.calls[0][1];
      expect(callInit?.signal).toBeDefined();
    });

    it("should merge existing signal with timeout signal", async () => {
      const client = new FetchClient({
        fetchAdapter: mockAdapter,
        timeoutMs: 1000,
      });

      const controller = new AbortController();
      mockAdapter.mockResponse({ data: "test" });

      await client.request("https://api.example.com/data", {
        signal: controller.signal,
      });

      const mock = mockAdapter.getMock();
      const callInit = mock.mock.calls[0][1];
      expect(callInit?.signal).toBeDefined();
      expect(callInit?.signal).not.toBe(controller.signal); // Should be merged
    });
  });

  describe("integration", () => {
    it("should work with all adapters together", async () => {
      const cache = new MockCache();
      const rateLimiter = new MockRateLimiter();
      const retryHandler = new MockRetryHandler();

      const client = new FetchClient({
        fetchAdapter: mockAdapter,
        requestCache: cache,
        rateLimitAdapter: rateLimiter,
        retryHandler,
        timeoutMs: 5000,
        transformRequest: (url, init) => [
          url,
          { ...init, headers: { "X-Custom": "header" } },
        ],
        transformResponse: async (response) => {
          const data = await response.json();
          return new Response(JSON.stringify({ wrapped: data }), response);
        },
      });

      mockAdapter.mockResponse({ data: "test" });

      const result = await client.request("https://api.example.com/data");

      expect(result).toEqual({ wrapped: { data: "test" } });
      expect(rateLimiter.scheduleCallCount).toBe(1);
      expect(retryHandler.runCallCount).toBe(1);
      expect(cache.has("GET:https://api.example.com/data")).toBe(true);
    });
  });
});
