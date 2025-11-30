# @thinkeloquent/jira-fetcher-core

Generic, composable JIRA API fetcher with pluggable fetch adapter support.

## Features

- **Bring Your Own Fetch** - Use any fetch implementation (undici, node-fetch, cross-fetch, browser fetch)
- **Type-Safe** - Full TypeScript support with generics
- **JIRA-Specific Conveniences** - Path parameter interpolation, query serialization, base URL handling
- **Minimal Core** - No built-in rate limiting, retry, or caching (opt-in via adapters)
- **Extensible** - Easy to layer additional functionality
- **Consistent Error Handling** - Machine-readable error codes

## Installation

```bash
npm install @thinkeloquent/jira-fetcher-core undici
```

## Quick Start

```typescript
import { fetch as undiciFetch } from "undici";
import {
  JiraFetchClient,
  FetchAdapter,
} from "@thinkeloquent/jira-fetcher-core";

// 1. Create a fetch adapter (required - you must provide this)
class BasicAuthAdapter implements FetchAdapter {
  constructor(
    private readonly email: string,
    private readonly apiToken: string
  ) {}

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    const credentials = Buffer.from(`${this.email}:${this.apiToken}`).toString(
      "base64"
    );
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Basic ${credentials}`);
    return undiciFetch(url, { ...init, headers });
  }
}

// 2. Create the JIRA client
const client = new JiraFetchClient({
  baseUrl: "https://your-domain.atlassian.net",
  fetchClientOptions: {
    fetchAdapter: new BasicAuthAdapter(
      process.env.JIRA_EMAIL!,
      process.env.JIRA_API_TOKEN!
    ),
  },
});

// 3. Make requests
const issue = await client.get("/rest/api/2/issue/PROJ-123");
console.log(issue);
```

## Core Concepts

### Fetch Adapter (Required)

**You must provide your own fetch adapter.** This gives you complete control over:

- HTTP implementation (undici, node-fetch, etc.)
- Authentication (Basic Auth, Bearer Token, PAT, OAuth)
- Custom headers and middleware
- Testing and mocking

```typescript
import { UndiciFetchAdapter } from "@thinkeloquent/jira-fetcher-core";

// Use the provided undici adapter
const fetchAdapter = new UndiciFetchAdapter();

// Or create your own
class CustomFetchAdapter implements FetchAdapter {
  async fetch(url: string, init?: RequestInit): Promise<Response> {
    // Your implementation
    return fetch(url, init);
  }
}
```

### Making Requests

```typescript
// Using request() method with full config
const issue = await client.request({
  method: "GET",
  path: "/rest/api/2/issue/{issueIdOrKey}",
  pathParams: { issueIdOrKey: "PROJ-123" },
  queryParams: { fields: ["summary", "status"] },
});

// Using convenience methods
const issue = await client.get("/rest/api/2/issue/PROJ-123");
const created = await client.post("/rest/api/2/issue", { fields: {...} });
await client.put("/rest/api/2/issue/PROJ-123", { fields: {...} });
await client.delete("/rest/api/2/issue/PROJ-123");
```

### Type Safety

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
// `issue` is typed as Issue
console.log(issue.fields.summary);
```

### Error Handling

```typescript
import { JiraFetchError, ErrorCode } from "@thinkeloquent/jira-fetcher-core";

try {
  await client.get("/rest/api/2/issue/INVALID");
} catch (error) {
  if (error instanceof JiraFetchError) {
    switch (error.code) {
      case ErrorCode.RESPONSE:
        console.error(`HTTP ${error.status}: ${error.details}`);
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

## Advanced Usage

### Optional Adapters

Add rate limiting, retry logic, and caching via optional adapters:

```typescript
import { JiraFetchClient } from "@thinkeloquent/jira-fetcher-core";
import { SimpleRateLimiter } from "./adapters/SimpleRateLimiter";
import { ExponentialBackoffRetryHandler } from "./adapters/RetryHandler";
import { TTLCache } from "./adapters/TTLCache";

const client = new JiraFetchClient({
  baseUrl: "https://your-domain.atlassian.net",
  fetchClientOptions: {
    fetchAdapter: new BasicAuthAdapter(email, token),
    rateLimitAdapter: new SimpleRateLimiter(200), // 200ms between requests
    retryHandler: new ExponentialBackoffRetryHandler(3, 1000, 30000),
    requestCache: new TTLCache(5 * 60 * 1000), // 5 minute TTL
    timeoutMs: 30000,
  },
});
```

See [ADVANCED_ADAPTERS.md](./docs/ADVANCED_ADAPTERS.md) for implementation examples.

### Custom Request Transformation

```typescript
const client = new JiraFetchClient({
  baseUrl: "https://your-domain.atlassian.net",
  fetchClientOptions: {
    fetchAdapter: new UndiciFetchAdapter(),
    transformRequest: async (url, init) => {
      // Add custom headers
      const headers = new Headers(init.headers);
      headers.set("X-Custom-Header", "value");
      return [url, { ...init, headers }];
    },
    transformResponse: async (response) => {
      // Transform response before parsing
      return response;
    },
  },
});
```

## Documentation

- **[Usage Guide](./docs/USAGE.md)** - Complete usage documentation
- **[Authentication](./docs/AUTHENTICATION.md)** - Authentication patterns (Basic Auth, Bearer Token, PAT, OAuth)
- **[Advanced Adapters](./docs/ADVANCED_ADAPTERS.md)** - Rate limiting, retry, and caching patterns
- **[Examples](./docs/EXAMPLES.md)** - Real-world usage examples

## API Reference

### JiraFetchClient

```typescript
class JiraFetchClient {
  constructor(options: JiraClientOptions);

  // Main request method
  request<T>(config: JiraRequestConfig): Promise<T>;

  // Convenience methods
  get<T>(
    path: string,
    options?: Omit<JiraRequestConfig, "method" | "path">
  ): Promise<T>;
  post<T>(
    path: string,
    body?: unknown,
    options?: Omit<JiraRequestConfig, "method" | "path" | "body">
  ): Promise<T>;
  put<T>(
    path: string,
    body?: unknown,
    options?: Omit<JiraRequestConfig, "method" | "path" | "body">
  ): Promise<T>;
  delete<T>(
    path: string,
    options?: Omit<JiraRequestConfig, "method" | "path">
  ): Promise<T>;
  patch<T>(
    path: string,
    body?: unknown,
    options?: Omit<JiraRequestConfig, "method" | "path" | "body">
  ): Promise<T>;
}
```

### Types

```typescript
interface JiraClientOptions {
  baseUrl: string;
  fetchClientOptions: FetchClientOptions;
}

interface FetchClientOptions {
  fetchAdapter: FetchAdapter; // Required
  rateLimitAdapter?: RateLimitAdapter;
  requestCache?: RequestCache;
  retryHandler?: RetryHandler;
  timeoutMs?: number;
  transformRequest?: TransformRequest;
  transformResponse?: TransformResponse;
}

interface JiraRequestConfig {
  method: HttpMethod;
  path: string;
  pathParams?: Record<string, string | number>;
  queryParams?: Record<
    string,
    string | number | boolean | string[] | undefined
  >;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
}
```

### Adapters

```typescript
interface FetchAdapter {
  fetch(url: string, init?: RequestInit): Promise<Response>;
}

interface RateLimitAdapter {
  schedule<T>(fn: () => Promise<T>): Promise<T>;
}

interface RequestCache {
  get(key: string): Promise<Response | undefined>;
  set(key: string, response: Response): Promise<void>;
}

interface RetryHandler {
  run<T>(fn: () => Promise<T>): Promise<T>;
}
```

## Why This Design?

### User-Provided Fetch Adapter

By requiring users to provide their own fetch adapter, you get:

- **Full control** over HTTP implementation
- **Authentication flexibility** - implement any auth method in your adapter
- **Easy testing** - mock the adapter for unit tests
- **No forced dependencies** - choose your preferred fetch library

### Minimal Core, Opt-In Features

Rate limiting, retry, and caching are **not** built-in by default:

- **Smaller bundle size** for simple use cases
- **Explicit complexity** - only add what you need
- **Customizable behavior** - implement adapters that fit your exact requirements

### Type-Safe by Design

Full TypeScript support with generics:

- IDE autocomplete for response data
- Compile-time type checking
- Clear API contracts

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or pull request.

### Development Workflow

This project uses [Changesets](https://github.com/changesets/changesets) for version management and publishing.

When making changes:

1. **Make your changes** to the codebase
2. **Create a changeset** describing your changes:
   ```bash
   npm run changeset
   ```
   - Select the package(s) to version
   - Choose the version bump type (major/minor/patch)
   - Write a summary of your changes

3. **Commit the changeset** along with your code changes
4. **Submit a pull request** with your changes and the changeset file

### Available Scripts

```bash
# Create a new changeset
npm run changeset

# Update package versions based on changesets (maintainers only)
npm run version

# Build and publish to npm (maintainers only)
npm run release
```

The changeset file will be used to automatically generate changelogs and determine version bumps when your PR is merged.

## Support

- **Issues**: [GitHub Issues](https://github.com/your-org/jira-fetcher/issues)
- **Documentation**: See the `docs/` directory
