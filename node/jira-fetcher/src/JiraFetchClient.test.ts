import { describe, it, expect, vi, beforeEach } from "vitest";
import { JiraFetchClient } from "./JiraFetchClient.js";
import { ErrorCode, JiraFetchError } from "./errors.js";
import type { FetchAdapter } from "./types.js";

// Mock fetch adapter
class MockFetchAdapter implements FetchAdapter {
  private mockFetch = vi.fn();

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    return this.mockFetch(url, init);
  }

  mockResponse(
    data: unknown,
    options: { status?: number; headers?: Record<string, string> } = {}
  ) {
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

  reset() {
    this.mockFetch.mockReset();
  }
}

describe("JiraFetchClient", () => {
  let mockAdapter: MockFetchAdapter;

  beforeEach(() => {
    mockAdapter = new MockFetchAdapter();
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should create client with base URL", () => {
      const client = new JiraFetchClient({
        baseUrl: "https://jira.example.com",
        fetchClientOptions: { fetchAdapter: mockAdapter },
      });

      expect(client).toBeInstanceOf(JiraFetchClient);
    });

    it("should strip trailing slash from base URL", async () => {
      const client = new JiraFetchClient({
        baseUrl: "https://jira.example.com/",
        fetchClientOptions: { fetchAdapter: mockAdapter },
      });

      mockAdapter.mockResponse({ success: true });

      await client.get("/api/2/issue/TEST-1");

      const mock = mockAdapter.getMock();
      expect(mock).toHaveBeenCalledWith(
        "https://jira.example.com/api/2/issue/TEST-1",
        expect.any(Object)
      );
    });

    it("should preserve base URL pathname with simple concatenation", async () => {
      const client = new JiraFetchClient({
        baseUrl: "https://jira.example.com/context",
        fetchClientOptions: { fetchAdapter: mockAdapter },
      });

      mockAdapter.mockResponse({ success: true });

      await client.get("/rest/api/2/issue/TEST-1");

      const mock = mockAdapter.getMock();
      expect(mock).toHaveBeenCalledWith(
        "https://jira.example.com/context/rest/api/2/issue/TEST-1",
        expect.any(Object)
      );
    });
  });

  describe("request method", () => {
    it("should make a GET request", async () => {
      const client = new JiraFetchClient({
        baseUrl: "https://jira.example.com",
        fetchClientOptions: { fetchAdapter: mockAdapter },
      });

      const issueData = { key: "TEST-1", fields: { summary: "Test issue" } };
      mockAdapter.mockResponse(issueData);

      const result = await client.request({
        method: "GET",
        path: "/rest/api/2/issue/TEST-1",
      });

      expect(result).toEqual(issueData);
    });

    it("should make a POST request with body", async () => {
      const client = new JiraFetchClient({
        baseUrl: "https://jira.example.com",
        fetchClientOptions: { fetchAdapter: mockAdapter },
      });

      const createBody = { fields: { summary: "New issue" } };
      mockAdapter.mockResponse({ key: "TEST-2" });

      await client.request({
        method: "POST",
        path: "/rest/api/2/issue",
        body: createBody,
      });

      const mock = mockAdapter.getMock();
      const [url, init] = mock.mock.calls[0];

      expect(url).toBe("https://jira.example.com/rest/api/2/issue");
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify(createBody));
    });

    it("should not include body for GET requests", async () => {
      const client = new JiraFetchClient({
        baseUrl: "https://jira.example.com",
        fetchClientOptions: { fetchAdapter: mockAdapter },
      });

      mockAdapter.mockResponse({ data: "test" });

      await client.request({
        method: "GET",
        path: "/rest/api/2/issue/TEST-1",
        body: { ignored: "data" }, // Should be ignored for GET
      });

      const mock = mockAdapter.getMock();
      const [, init] = mock.mock.calls[0];

      expect(init?.body).toBeUndefined();
    });
  });

  describe("path parameters", () => {
    it("should interpolate path parameters", async () => {
      const client = new JiraFetchClient({
        baseUrl: "https://jira.example.com",
        fetchClientOptions: { fetchAdapter: mockAdapter },
      });

      mockAdapter.mockResponse({ key: "PROJ-123" });

      await client.request({
        method: "GET",
        path: "/rest/api/2/issue/{issueIdOrKey}",
        pathParams: { issueIdOrKey: "PROJ-123" },
      });

      const mock = mockAdapter.getMock();
      expect(mock).toHaveBeenCalledWith(
        "https://jira.example.com/rest/api/2/issue/PROJ-123",
        expect.any(Object)
      );
    });

    it("should interpolate multiple path parameters", async () => {
      const client = new JiraFetchClient({
        baseUrl: "https://jira.example.com",
        fetchClientOptions: { fetchAdapter: mockAdapter },
      });

      mockAdapter.mockResponse({ success: true });

      await client.request({
        method: "GET",
        path: "/rest/api/2/project/{projectKey}/version/{versionId}",
        pathParams: { projectKey: "PROJ", versionId: 123 },
      });

      const mock = mockAdapter.getMock();
      expect(mock).toHaveBeenCalledWith(
        "https://jira.example.com/rest/api/2/project/PROJ/version/123",
        expect.any(Object)
      );
    });

    it("should URL encode path parameters", async () => {
      const client = new JiraFetchClient({
        baseUrl: "https://jira.example.com",
        fetchClientOptions: { fetchAdapter: mockAdapter },
      });

      mockAdapter.mockResponse({ success: true });

      await client.request({
        method: "GET",
        path: "/rest/api/2/issue/{issueIdOrKey}",
        pathParams: { issueIdOrKey: "PROJ-123 with spaces" },
      });

      const mock = mockAdapter.getMock();
      expect(mock).toHaveBeenCalledWith(
        "https://jira.example.com/rest/api/2/issue/PROJ-123%20with%20spaces",
        expect.any(Object)
      );
    });

    it("should throw error if path parameter not found in path", async () => {
      const client = new JiraFetchClient({
        baseUrl: "https://jira.example.com",
        fetchClientOptions: { fetchAdapter: mockAdapter },
      });

      await expect(
        client.request({
          method: "GET",
          path: "/rest/api/2/issue/TEST-1",
          pathParams: { nonExistent: "value" },
        })
      ).rejects.toThrow(JiraFetchError);

      try {
        await client.request({
          method: "GET",
          path: "/rest/api/2/issue/TEST-1",
          pathParams: { nonExistent: "value" },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(JiraFetchError);
        expect((error as JiraFetchError).code).toBe(ErrorCode.CONFIGURATION);
        expect((error as JiraFetchError).message).toContain("not found");
      }
    });

    it("should throw error if path has missing parameters", async () => {
      const client = new JiraFetchClient({
        baseUrl: "https://jira.example.com",
        fetchClientOptions: { fetchAdapter: mockAdapter },
      });

      await expect(
        client.request({
          method: "GET",
          path: "/rest/api/2/issue/{issueIdOrKey}",
          pathParams: {}, // Missing issueIdOrKey
        })
      ).rejects.toThrow(JiraFetchError);

      try {
        await client.request({
          method: "GET",
          path: "/rest/api/2/issue/{issueIdOrKey}",
        });
      } catch (error) {
        expect(error).toBeInstanceOf(JiraFetchError);
        expect((error as JiraFetchError).code).toBe(ErrorCode.CONFIGURATION);
        expect((error as JiraFetchError).message).toContain("Missing path");
      }
    });
  });

  describe("query parameters", () => {
    it("should add query parameters", async () => {
      const client = new JiraFetchClient({
        baseUrl: "https://jira.example.com",
        fetchClientOptions: { fetchAdapter: mockAdapter },
      });

      mockAdapter.mockResponse({ issues: [] });

      await client.request({
        method: "GET",
        path: "/rest/api/2/search",
        queryParams: { jql: "project = TEST", maxResults: 50 },
      });

      const mock = mockAdapter.getMock();
      const url = new URL(mock.mock.calls[0][0]);

      expect(url.searchParams.get("jql")).toBe("project = TEST");
      expect(url.searchParams.get("maxResults")).toBe("50");
    });

    it("should handle array query parameters", async () => {
      const client = new JiraFetchClient({
        baseUrl: "https://jira.example.com",
        fetchClientOptions: { fetchAdapter: mockAdapter },
      });

      mockAdapter.mockResponse({ issues: [] });

      await client.request({
        method: "GET",
        path: "/rest/api/2/search",
        queryParams: { fields: ["summary", "status", "assignee"] },
      });

      const mock = mockAdapter.getMock();
      const url = new URL(mock.mock.calls[0][0]);

      expect(url.searchParams.getAll("fields")).toEqual([
        "summary",
        "status",
        "assignee",
      ]);
    });

    it("should skip undefined query parameters", async () => {
      const client = new JiraFetchClient({
        baseUrl: "https://jira.example.com",
        fetchClientOptions: { fetchAdapter: mockAdapter },
      });

      mockAdapter.mockResponse({ issues: [] });

      await client.request({
        method: "GET",
        path: "/rest/api/2/search",
        queryParams: { jql: "project = TEST", maxResults: undefined },
      });

      const mock = mockAdapter.getMock();
      const url = new URL(mock.mock.calls[0][0]);

      expect(url.searchParams.has("jql")).toBe(true);
      expect(url.searchParams.has("maxResults")).toBe(false);
    });

    it("should handle boolean query parameters", async () => {
      const client = new JiraFetchClient({
        baseUrl: "https://jira.example.com",
        fetchClientOptions: { fetchAdapter: mockAdapter },
      });

      mockAdapter.mockResponse({ issues: [] });

      await client.request({
        method: "GET",
        path: "/rest/api/2/search",
        queryParams: { validateQuery: true },
      });

      const mock = mockAdapter.getMock();
      const url = new URL(mock.mock.calls[0][0]);

      expect(url.searchParams.get("validateQuery")).toBe("true");
    });
  });

  describe("headers", () => {
    it("should set default headers", async () => {
      const client = new JiraFetchClient({
        baseUrl: "https://jira.example.com",
        fetchClientOptions: { fetchAdapter: mockAdapter },
      });

      mockAdapter.mockResponse({ success: true });

      await client.request({
        method: "GET",
        path: "/rest/api/2/issue/TEST-1",
      });

      const mock = mockAdapter.getMock();
      const [, init] = mock.mock.calls[0];

      expect(init?.headers).toEqual({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
    });

    it("should merge custom headers", async () => {
      const client = new JiraFetchClient({
        baseUrl: "https://jira.example.com",
        fetchClientOptions: { fetchAdapter: mockAdapter },
      });

      mockAdapter.mockResponse({ success: true });

      await client.request({
        method: "GET",
        path: "/rest/api/2/issue/TEST-1",
        headers: { Authorization: "Bearer token", "X-Custom": "value" },
      });

      const mock = mockAdapter.getMock();
      const [, init] = mock.mock.calls[0];

      expect(init?.headers).toEqual({
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer token",
        "X-Custom": "value",
      });
    });

    it("should allow overriding default headers", async () => {
      const client = new JiraFetchClient({
        baseUrl: "https://jira.example.com",
        fetchClientOptions: { fetchAdapter: mockAdapter },
      });

      mockAdapter.mockResponse({ success: true });

      await client.request({
        method: "GET",
        path: "/rest/api/2/issue/TEST-1",
        headers: { "Content-Type": "application/xml" },
      });

      const mock = mockAdapter.getMock();
      const [, init] = mock.mock.calls[0];

      expect(init?.headers).toEqual({
        "Content-Type": "application/xml",
        Accept: "application/json",
      });
    });
  });

  describe("convenience methods", () => {
    describe("get", () => {
      it("should make GET request", async () => {
        const client = new JiraFetchClient({
          baseUrl: "https://jira.example.com",
          fetchClientOptions: { fetchAdapter: mockAdapter },
        });

        mockAdapter.mockResponse({ key: "TEST-1" });

        const result = await client.get("/rest/api/2/issue/TEST-1");

        expect(result).toEqual({ key: "TEST-1" });

        const mock = mockAdapter.getMock();
        const [url, init] = mock.mock.calls[0];
        expect(url).toBe("https://jira.example.com/rest/api/2/issue/TEST-1");
        expect(init?.method).toBe("GET");
      });

      it("should accept options", async () => {
        const client = new JiraFetchClient({
          baseUrl: "https://jira.example.com",
          fetchClientOptions: { fetchAdapter: mockAdapter },
        });

        mockAdapter.mockResponse({ key: "TEST-1" });

        await client.get("/rest/api/2/issue/{key}", {
          pathParams: { key: "TEST-1" },
          queryParams: { fields: "summary" },
        });

        const mock = mockAdapter.getMock();
        const url = new URL(mock.mock.calls[0][0]);
        expect(url.pathname).toBe("/rest/api/2/issue/TEST-1");
        expect(url.searchParams.get("fields")).toBe("summary");
      });
    });

    describe("post", () => {
      it("should make POST request with body", async () => {
        const client = new JiraFetchClient({
          baseUrl: "https://jira.example.com",
          fetchClientOptions: { fetchAdapter: mockAdapter },
        });

        const body = { fields: { summary: "New issue" } };
        mockAdapter.mockResponse({ key: "TEST-2" });

        const result = await client.post("/rest/api/2/issue", body);

        expect(result).toEqual({ key: "TEST-2" });

        const mock = mockAdapter.getMock();
        const [url, init] = mock.mock.calls[0];
        expect(url).toBe("https://jira.example.com/rest/api/2/issue");
        expect(init?.method).toBe("POST");
        expect(init?.body).toBe(JSON.stringify(body));
      });
    });

    describe("put", () => {
      it("should make PUT request with body", async () => {
        const client = new JiraFetchClient({
          baseUrl: "https://jira.example.com",
          fetchClientOptions: { fetchAdapter: mockAdapter },
        });

        const body = { fields: { summary: "Updated" } };
        mockAdapter.mockResponse({ success: true });

        await client.put("/rest/api/2/issue/TEST-1", body);

        const mock = mockAdapter.getMock();
        const [, init] = mock.mock.calls[0];
        expect(init?.method).toBe("PUT");
        expect(init?.body).toBe(JSON.stringify(body));
      });
    });

    describe("delete", () => {
      it("should make DELETE request", async () => {
        const client = new JiraFetchClient({
          baseUrl: "https://jira.example.com",
          fetchClientOptions: { fetchAdapter: mockAdapter },
        });

        mockAdapter.mockResponse({ success: true });

        await client.delete("/rest/api/2/issue/TEST-1");

        const mock = mockAdapter.getMock();
        const [, init] = mock.mock.calls[0];
        expect(init?.method).toBe("DELETE");
      });
    });

    describe("patch", () => {
      it("should make PATCH request with body", async () => {
        const client = new JiraFetchClient({
          baseUrl: "https://jira.example.com",
          fetchClientOptions: { fetchAdapter: mockAdapter },
        });

        const body = { fields: { summary: "Patched" } };
        mockAdapter.mockResponse({ success: true });

        await client.patch("/rest/api/2/issue/TEST-1", body);

        const mock = mockAdapter.getMock();
        const [, init] = mock.mock.calls[0];
        expect(init?.method).toBe("PATCH");
        expect(init?.body).toBe(JSON.stringify(body));
      });
    });
  });

  describe("complex scenarios", () => {
    it("should handle JIRA search with all parameters", async () => {
      const client = new JiraFetchClient({
        baseUrl: "https://jira.example.com",
        fetchClientOptions: { fetchAdapter: mockAdapter },
      });

      mockAdapter.mockResponse({
        issues: [{ key: "TEST-1" }, { key: "TEST-2" }],
        total: 2,
      });

      const result = await client.get("/rest/api/2/search", {
        queryParams: {
          jql: "project = TEST AND status = Open",
          startAt: 0,
          maxResults: 50,
          fields: ["summary", "status", "assignee"],
          validateQuery: true,
        },
      });

      expect(result).toEqual({
        issues: [{ key: "TEST-1" }, { key: "TEST-2" }],
        total: 2,
      });

      const mock = mockAdapter.getMock();
      const url = new URL(mock.mock.calls[0][0]);
      expect(url.searchParams.get("jql")).toBe(
        "project = TEST AND status = Open"
      );
      expect(url.searchParams.get("maxResults")).toBe("50");
      expect(url.searchParams.getAll("fields")).toEqual([
        "summary",
        "status",
        "assignee",
      ]);
    });

    it("should handle creating issue with path and body", async () => {
      const client = new JiraFetchClient({
        baseUrl: "https://jira.example.com",
        fetchClientOptions: { fetchAdapter: mockAdapter },
      });

      mockAdapter.mockResponse({ key: "PROJ-123" });

      const result = await client.post("/rest/api/2/issue", {
        fields: {
          project: { key: "PROJ" },
          summary: "New issue",
          description: "Issue description",
          issuetype: { name: "Bug" },
        },
      });

      expect(result).toEqual({ key: "PROJ-123" });
    });
  });
});
