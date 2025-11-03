# Usage Guide

## Overview

`@thinkeloquent/jira-fetcher-core` is a minimal, composable JIRA API client that requires you to provide your own fetch adapter. This design gives you complete control over the HTTP layer while providing type-safe request/response handling and JIRA-specific conveniences.

## Core Concepts

### 1. Fetch Adapter (Required)

**You must provide your own fetch adapter.** The library does not include a default fetch implementation. This allows you to:

- Choose your preferred fetch library (undici, node-fetch, cross-fetch, etc.)
- Use the native browser fetch
- Mock fetch for testing
- Add custom authentication, headers, or other middleware

### 2. Type-Safe Requests

All requests are fully typed with TypeScript generics, giving you autocomplete and type checking for response data.

### 3. JIRA-Specific Features

- Automatic path parameter interpolation
- Query parameter serialization
- Consistent error handling
- Base URL management

---

## Basic Setup

### Step 1: Install the Package

```bash
npm install @thinkeloquent/jira-fetcher-core undici
# or
yarn add @thinkeloquent/jira-fetcher-core undici
```

### Step 2: Create a Fetch Adapter

You can use the provided `UndiciFetchAdapter` as a starting point:

```typescript
import { UndiciFetchAdapter } from "@thinkeloquent/jira-fetcher-core";

const fetchAdapter = new UndiciFetchAdapter();
```

Or create your own custom adapter:

```typescript
import { FetchAdapter } from "@thinkeloquent/jira-fetcher-core";

class CustomFetchAdapter implements FetchAdapter {
  async fetch(url: string, init?: RequestInit): Promise<Response> {
    // Your custom fetch implementation
    return fetch(url, init);
  }
}

const fetchAdapter = new CustomFetchAdapter();
```

### Step 3: Create a JIRA Client

```typescript
import { JiraFetchClient } from "@thinkeloquent/jira-fetcher-core";

const client = new JiraFetchClient({
  baseUrl: "https://your-domain.atlassian.net",
  fetchClientOptions: {
    fetchAdapter: fetchAdapter, // Required: your fetch adapter
    timeoutMs: 30000, // Optional: request timeout (default: 10000)
  },
});
```

---

## Making Requests

### Using the `request()` Method

The primary method for making requests:

```typescript
const issue = await client.request({
  method: "GET",
  path: "/rest/api/2/issue/{issueIdOrKey}",
  pathParams: { issueIdOrKey: "PROJ-123" },
});
```

### Convenience Methods

Shorthand methods for common HTTP verbs:

```typescript
// GET request
const issue = await client.get("/rest/api/2/issue/PROJ-123");

// POST request
const newIssue = await client.post("/rest/api/2/issue", {
  fields: {
    project: { key: "PROJ" },
    summary: "New issue",
    issuetype: { name: "Task" },
  },
});

// PUT request
await client.put("/rest/api/2/issue/PROJ-123", {
  fields: { summary: "Updated summary" },
});

// DELETE request
await client.delete("/rest/api/2/issue/PROJ-123");

// PATCH request
await client.patch("/rest/api/2/issue/PROJ-123", {
  fields: { priority: { name: "High" } },
});
```

---

## Path Parameters

Use `{placeholder}` syntax in the path and provide values via `pathParams`:

```typescript
const issue = await client.request({
  method: "GET",
  path: "/rest/api/2/issue/{issueIdOrKey}",
  pathParams: { issueIdOrKey: "PROJ-123" },
});

// Automatically converts to:
// GET https://your-domain.atlassian.net/rest/api/2/issue/PROJ-123
```

**Important:** All path parameters are URL-encoded automatically.

---

## Query Parameters

Pass query parameters via the `queryParams` option:

```typescript
const issues = await client.request({
  method: "GET",
  path: "/rest/api/2/search",
  queryParams: {
    jql: "project = PROJ",
    maxResults: 50,
    startAt: 0,
    fields: ["summary", "status"], // Arrays are handled correctly
  },
});

// Converts to:
// GET https://your-domain.atlassian.net/rest/api/2/search?jql=project%20%3D%20PROJ&maxResults=50&startAt=0&fields=summary&fields=status
```

---

## Type Safety

Use TypeScript generics to type your responses:

```typescript
interface Issue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: { name: string };
  };
}

const issue = await client.get<Issue>("/rest/api/2/issue/PROJ-123");

// Now `issue` is typed as Issue
console.log(issue.fields.summary);
```

---

## Error Handling

All errors are wrapped in `JiraFetchError` with machine-readable error codes:

```typescript
import { JiraFetchError, ErrorCode } from "@thinkeloquent/jira-fetcher-core";

try {
  const issue = await client.get("/rest/api/2/issue/INVALID");
} catch (error) {
  if (error instanceof JiraFetchError) {
    console.error("Error code:", error.code);
    console.error("Status:", error.status);
    console.error("Details:", error.details);

    // Handle specific error types
    switch (error.code) {
      case ErrorCode.RESPONSE:
        console.error("HTTP error:", error.status);
        break;
      case ErrorCode.TIMEOUT:
        console.error("Request timed out");
        break;
      case ErrorCode.NETWORK:
        console.error("Network error");
        break;
      case ErrorCode.CONFIGURATION:
        console.error("Configuration error");
        break;
    }
  }
}
```

---

## Custom Headers

Add custom headers to individual requests:

```typescript
const issue = await client.get("/rest/api/2/issue/PROJ-123", {
  headers: {
    "X-Custom-Header": "value",
  },
});
```

---

## Request Timeout

Override the default timeout for specific requests:

```typescript
const issue = await client.get("/rest/api/2/issue/PROJ-123", {
  timeoutMs: 5000, // 5 second timeout
});
```

---

## Next Steps

- **Authentication**: See [AUTHENTICATION.md](./AUTHENTICATION.md) for examples of implementing authentication in your fetch adapter
- **Advanced Features**: See [ADVANCED_ADAPTERS.md](./ADVANCED_ADAPTERS.md) for rate limiting, retry logic, and caching patterns
- **Real-World Examples**: See [EXAMPLES.md](./EXAMPLES.md) for complete usage examples
