# JIRA Fetcher Core - Technical Specification

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Adapter Pattern Implementation](#adapter-pattern-implementation)
3. [Core Classes](#core-classes)
4. [Configuration Patterns](#configuration-patterns)
5. [Request Lifecycle](#request-lifecycle)
6. [Key Features](#key-features)
7. [Dependencies & Utilities](#dependencies--utilities)
8. [Design Decisions](#design-decisions)
9. [Usage Examples](#usage-examples)

---

## Architecture Overview

### Layered Architecture

The JIRA Fetcher Core implements a **composable, plugin-based HTTP client** built around the **Strategy Pattern** and **Adapter Pattern**.

```
┌─────────────────────────────────────┐
│      JiraFetchClient                │
│  (JIRA-specific layer)              │
│  - Path parameter interpolation     │
│  - Query parameter serialization    │
│  - JIRA API conveniences            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      FetchClient                    │
│  (Generic HTTP layer)               │
│  - Request lifecycle management     │
│  - Transform hooks                  │
│  - Error handling                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      FetchAdapter                   │
│  (Pluggable fetch implementation)   │
│  - Authentication                   │
│  - HTTP library abstraction         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Actual HTTP Library                │
│  (undici, node-fetch, browser, etc) │
└─────────────────────────────────────┘
```

### Design Principles

1. **Bring Your Own Fetch (BYOF)**: Users MUST provide their own fetch adapter
2. **Minimal Core**: No built-in rate limiting, retry, or caching by default
3. **Opt-in Complexity**: Features are added via optional adapters
4. **Type Safety**: Full TypeScript support with generics throughout
5. **Composability**: Multiple adapters can be combined seamlessly

---

## Adapter Pattern Implementation

The library uses the **Strategy Pattern** to allow pluggable behavior through adapters. All adapters are simple interfaces that users implement.

### 1. FetchAdapter (Required)

**Purpose**: Abstracts the actual HTTP fetch implementation

**Location**: `src/types.ts`

```typescript
interface FetchAdapter {
  fetch(url: string, init?: RequestInit): Promise<Response>;
}
```

**Why Required**:
- Allows users to choose their HTTP library
- Enables authentication implementation at the HTTP layer
- Facilitates easy mocking for tests

**Provided Implementation**:
```typescript
// src/adapters/UndiciFetchAdapter.ts
export class UndiciFetchAdapter implements FetchAdapter {
  async fetch(url: string, init?: RequestInit): Promise<Response> {
    return undiciFetch(url, init);
  }
}
```

### 2. RateLimitAdapter (Optional)

**Purpose**: Controls request throughput

```typescript
interface RateLimitAdapter {
  schedule<T>(fn: () => Promise<T>): Promise<T>;
}
```

**Example Implementations**:
- `SimpleRateLimiter`: Fixed delay between requests
- `TokenBucketRateLimiter`: Burst-friendly with refill rate
- `ConcurrencyLimiter`: Limits concurrent requests

### 3. RequestCache (Optional)

**Purpose**: Caches HTTP responses

```typescript
interface RequestCache {
  get(key: string): Promise<Response | undefined>;
  set(key: string, response: Response): Promise<void>;
}
```

**Cache Key Format**: `{METHOD}:{URL}`

**Behavior**:
- Only GET requests are cached
- Responses are cloned before storage/retrieval
- No caching for POST, PUT, DELETE, PATCH

**Example Implementations**:
- `MemoryRequestCache`: In-memory Map-based cache
- `TTLCache`: Time-to-live expiration
- `LRUCache`: Least-recently-used eviction

### 4. RetryHandler (Optional)

**Purpose**: Handles retry logic for transient failures

```typescript
interface RetryHandler {
  run<T>(fn: () => Promise<T>): Promise<T>;
}
```

**Example Implementations**:
- `SimpleRetryHandler`: Fixed retry count with delay
- `ExponentialBackoffRetryHandler`: Exponential backoff with jitter
- `ConditionalRetryHandler`: Retry based on error type

---

## Core Classes

### FetchClient

**Location**: `src/FetchClient.ts`

**Responsibility**: Generic, composable HTTP client with pluggable adapters

**Key Features**:
- Request lifecycle management
- Timeout handling via AbortController
- Signal merging (timeout + user signals)
- Response parsing (JSON, text, binary)
- Error handling and normalization
- Cache integration (GET only)
- Rate limiting integration
- Retry logic integration
- Request/Response transformation hooks

**Constructor**:
```typescript
constructor(options: FetchClientOptions)
```

**Public Methods**:
```typescript
async request<T>(config: RequestConfig): Promise<T>
```

**Request Execution Order**:
```typescript
rateLimitAdapter.schedule(
  retryHandler.run(
    async () => {
      // 1. Apply transformRequest hook
      // 2. Check cache (GET only)
      // 3. Create timeout signal
      // 4. Merge signals if needed
      // 5. Execute fetch via adapter
      // 6. Apply transformResponse hook
      // 7. Check HTTP status
      // 8. Cache response (GET only, if successful)
      // 9. Parse response data
      // 10. Return typed result
    }
  )
)
```

### JiraFetchClient

**Location**: `src/JiraFetchClient.ts`

**Responsibility**: JIRA-specific wrapper providing API conveniences

**Key Features**:

1. **Base URL Management**:
   - Stores base URL
   - Strips trailing slash for consistent URL building

2. **Path Parameter Interpolation**:
   ```typescript
   // Finds {placeholder} in paths
   // Replaces with URL-encoded values
   // Example: "/issue/{key}" + { key: "PROJ-123" }
   //       → "/issue/PROJ-123"
   ```

3. **Query Parameter Serialization**:
   - Handles strings, numbers, booleans
   - Arrays: Multiple params with same key
   - Skips undefined values

4. **Header Management**:
   - Default headers:
     - `Content-Type: application/json`
     - `Accept: application/json`
   - Merges custom headers

**Constructor**:
```typescript
constructor(options: JiraClientOptions)
```

**Convenience Methods**:
```typescript
async get<T>(path: string, config?: Partial<JiraRequestConfig>): Promise<T>
async post<T>(path: string, config?: Partial<JiraRequestConfig>): Promise<T>
async put<T>(path: string, config?: Partial<JiraRequestConfig>): Promise<T>
async delete<T>(path: string, config?: Partial<JiraRequestConfig>): Promise<T>
async patch<T>(path: string, config?: Partial<JiraRequestConfig>): Promise<T>
```

**URL Building Algorithm**:
```typescript
// 1. Interpolate path params
let processedPath = path;
for (const [key, value] of Object.entries(pathParams)) {
  processedPath = processedPath.replace(
    `{${key}}`,
    encodeURIComponent(String(value))
  );
}

// 2. Validate no missing params
if (processedPath.match(/\{[^}]+\}/g)) {
  throw new JiraFetchError(
    ErrorCode.CONFIGURATION,
    'Missing path parameters'
  );
}

// 3. Build full URL
const url = new URL(processedPath, this.baseUrl);

// 4. Add query params
for (const [key, value] of Object.entries(queryParams)) {
  if (value === undefined) continue;

  if (Array.isArray(value)) {
    value.forEach(v => url.searchParams.append(key, String(v)));
  } else {
    url.searchParams.append(key, String(value));
  }
}
```

### JiraFetchError

**Location**: `src/errors.ts`

**Responsibility**: Standardized error handling with machine-readable codes

**Error Codes**:
```typescript
enum ErrorCode {
  NETWORK = "NETWORK",          // Connection failed, DNS issues
  RESPONSE = "RESPONSE",         // HTTP 4xx, 5xx errors
  TIMEOUT = "TIMEOUT",           // Request timeout via AbortController
  CONFIGURATION = "CONFIGURATION" // Invalid config (missing path params)
}
```

**Class Structure**:
```typescript
class JiraFetchError extends Error {
  readonly code: ErrorCode;
  readonly status?: number;
  readonly details?: unknown;
  readonly url?: string;
  readonly method?: string;

  constructor(code: ErrorCode, message: string, context?: ErrorContext)

  toJSON(): object

  static network(message: string, context?: ErrorContext): JiraFetchError
  static response(status: number, message: string, context?: ErrorContext): JiraFetchError
  static timeout(message: string, context?: ErrorContext): JiraFetchError
  static configuration(message: string, context?: ErrorContext): JiraFetchError
}
```

**Usage**:
```typescript
try {
  await client.get('/issue/PROJ-123');
} catch (error) {
  if (error instanceof JiraFetchError) {
    switch (error.code) {
      case ErrorCode.NETWORK:
        // Handle network error
        break;
      case ErrorCode.RESPONSE:
        // Handle HTTP error (check error.status)
        break;
      case ErrorCode.TIMEOUT:
        // Handle timeout
        break;
      case ErrorCode.CONFIGURATION:
        // Handle config error
        break;
    }
  }
}
```

---

## Configuration Patterns

### JiraClientOptions (Constructor)

```typescript
interface JiraClientOptions {
  baseUrl: string;                    // Required: JIRA instance URL
  fetchClientOptions: FetchClientOptions;
}
```

**Example**:
```typescript
const client = new JiraFetchClient({
  baseUrl: 'https://jira.example.com',
  fetchClientOptions: {
    fetchAdapter: new UndiciFetchAdapter(),
    timeoutMs: 30000
  }
});
```

### FetchClientOptions (Core Configuration)

```typescript
interface FetchClientOptions {
  fetchAdapter: FetchAdapter;         // Required
  rateLimitAdapter?: RateLimitAdapter;
  requestCache?: RequestCache;
  retryHandler?: RetryHandler;
  timeoutMs?: number;                 // Default: 10000ms
  transformRequest?: TransformRequest;
  transformResponse?: TransformResponse;
}
```

### JiraRequestConfig (Per-Request Configuration)

```typescript
interface JiraRequestConfig {
  method: HttpMethod;                 // GET, POST, PUT, DELETE, PATCH
  path: string;                       // e.g., "/rest/api/2/issue/{key}"
  pathParams?: Record<string, string | number>;
  queryParams?: Record<string, string | number | boolean | string[] | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;                 // Override default timeout
}
```

### Transform Hooks

**Transform Request**:
```typescript
type TransformRequest = (
  url: string,
  init: RequestInit
) => Promise<[string, RequestInit]> | [string, RequestInit];
```

**Use Cases**:
- Add authentication headers
- Modify request URL
- Add tracing headers
- Log outgoing requests

**Transform Response**:
```typescript
type TransformResponse = (
  response: Response
) => Promise<Response> | Response;
```

**Use Cases**:
- Log response status
- Clone response for debugging
- Check custom headers
- Transform response structure

---

## Request Lifecycle

### Complete Request Flow

```
┌─────────────────────────────────────┐
│  client.get('/issue/{key}')         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  1. Interpolate Path Parameters     │
│     {key} → PROJ-123                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. Build Full URL with Query Params│
│     + baseUrl + queryParams         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. Merge Default Headers           │
│     Content-Type, Accept, etc       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. Rate Limit Schedule             │
│     (if rateLimitAdapter present)   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  5. Retry Handler Wrapping          │
│     (if retryHandler present)       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  6. Transform Request Hook          │
│     (if transformRequest present)   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  7. Check Cache (GET only)          │
│     (if requestCache present)       │
└──────────────┬──────────────────────┘
               │ Cache miss
               ▼
┌─────────────────────────────────────┐
│  8. Create Timeout Signal           │
│     AbortController + timeoutMs     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  9. Merge Abort Signals             │
│     (timeout + user signal)         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  10. Execute Fetch via Adapter      │
│      fetchAdapter.fetch(url, init)  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  11. Transform Response Hook        │
│      (if transformResponse present) │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  12. Check HTTP Status              │
│      Throw JiraFetchError if !ok    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  13. Cache Response (GET only)      │
│      (if requestCache present)      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  14. Parse Response Data            │
│      JSON / text / binary           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  15. Return Typed Result            │
│      Promise<T>                     │
└─────────────────────────────────────┘
```

### Execution Order with Adapters

When all optional adapters are present:

```typescript
// Outer wrapper: Rate limiting
await rateLimitAdapter.schedule(
  // Middle wrapper: Retry logic
  async () => await retryHandler.run(
    // Inner core: Actual fetch
    async () => {
      // Transform request
      const [finalUrl, finalInit] = await transformRequest(url, init);

      // Check cache
      const cached = await requestCache.get(`${method}:${finalUrl}`);
      if (cached) return cached.clone();

      // Execute fetch
      let response = await fetchAdapter.fetch(finalUrl, finalInit);

      // Transform response
      response = await transformResponse(response);

      // Check status
      if (!response.ok) {
        throw JiraFetchError.response(response.status, ...);
      }

      // Cache result
      await requestCache.set(`${method}:${finalUrl}`, response.clone());

      // Parse and return
      return parseResponseData(response);
    }
  )
);
```

---

## Key Features

### 1. Path Parameter Interpolation

Automatically replaces `{placeholder}` in paths with URL-encoded values.

**Example**:
```typescript
await client.get('/rest/api/2/issue/{key}', {
  pathParams: { key: 'PROJ-123' }
});
// → GET https://jira.example.com/rest/api/2/issue/PROJ-123
```

**Validation**: Throws `JiraFetchError` with `ErrorCode.CONFIGURATION` if any placeholder is missing.

### 2. Query Parameter Serialization

Handles various data types with special array support.

**Example**:
```typescript
await client.get('/rest/api/2/search', {
  queryParams: {
    jql: 'project = PROJ',
    maxResults: 50,
    expand: ['changelog', 'names'],
    includeArchived: true,
    optional: undefined  // Skipped
  }
});
// → GET .../search?jql=project+%3D+PROJ&maxResults=50
//                   &expand=changelog&expand=names
//                   &includeArchived=true
```

**Array Handling**: Each array element becomes a separate query parameter with the same key.

### 3. Timeout Handling

Automatic request timeout using AbortController.

**Default**: 10000ms (10 seconds)

**Override**:
```typescript
// Global
new JiraFetchClient({
  baseUrl: '...',
  fetchClientOptions: {
    fetchAdapter: adapter,
    timeoutMs: 30000  // 30 seconds
  }
});

// Per-request
await client.get('/issue/PROJ-123', {
  timeoutMs: 60000  // 60 seconds
});
```

**Implementation**:
```typescript
const timeoutSignal = createTimeoutSignal(timeoutMs);
const finalSignal = userSignal
  ? mergeAbortSignals([timeoutSignal, userSignal])
  : timeoutSignal;

await fetchAdapter.fetch(url, { ...init, signal: finalSignal });
```

### 4. Response Parsing

Automatic parsing based on Content-Type header.

**Algorithm**:
```typescript
const contentType = response.headers.get('content-type') || '';

if (contentType.includes('application/json')) {
  const text = await response.text();
  return text.trim() === '' ? null : JSON.parse(text);
}

if (contentType.includes('text/')) {
  return response.text();
}

// Default: binary
return response.arrayBuffer();
```

### 5. Authentication Patterns

Authentication is implemented **inside the FetchAdapter**.

**Example - Basic Auth**:
```typescript
class BasicAuthAdapter implements FetchAdapter {
  constructor(
    private email: string,
    private apiToken: string
  ) {}

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    const credentials = Buffer
      .from(`${this.email}:${this.apiToken}`)
      .toString('base64');
    headers.set('Authorization', `Basic ${credentials}`);

    return undiciFetch(url, { ...init, headers });
  }
}
```

**Example - Bearer Token**:
```typescript
class BearerTokenAdapter implements FetchAdapter {
  constructor(private token: string) {}

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${this.token}`);

    return undiciFetch(url, { ...init, headers });
  }
}
```

**Example - OAuth**:
```typescript
class OAuthAdapter implements FetchAdapter {
  constructor(private getAccessToken: () => Promise<string>) {}

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    const token = await this.getAccessToken();
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${token}`);

    return undiciFetch(url, { ...init, headers });
  }
}
```

---

## Dependencies & Utilities

### Runtime Dependencies

```json
{
  "undici": "^6.0.0"
}
```

**Why undici?**
- Fast, reliable HTTP/1.1 client for Node.js
- Spec-compliant fetch implementation
- Official Node.js foundation project
- Only used in the provided `UndiciFetchAdapter`

Users can replace undici with any fetch-compatible library by implementing `FetchAdapter`.

### Built-in Node.js APIs

1. **AbortController/AbortSignal**: Timeouts and cancellation
2. **URL/URLSearchParams**: URL building and query params
3. **Headers**: Header management
4. **Response**: Standard fetch Response object
5. **Buffer**: Base64 encoding in auth examples

### Utility Functions

#### parseResponseData

**Location**: `src/utils/parseResponseData.ts`

**Purpose**: Automatically parse response based on Content-Type

**Signature**:
```typescript
export async function parseResponseData(response: Response): Promise<unknown>
```

**Logic**:
- `application/json` → JSON.parse (or null for empty body)
- `text/*` → response.text()
- Otherwise → response.arrayBuffer()

#### createTimeoutSignal

**Location**: `src/utils/createTimeoutSignal.ts`

**Purpose**: Create AbortSignal that auto-aborts after timeout

**Signature**:
```typescript
export function createTimeoutSignal(timeoutMs: number): AbortSignal
```

**Implementation**:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

// Cleanup on abort
controller.signal.addEventListener('abort', () => {
  clearTimeout(timeoutId);
});

return controller.signal;
```

#### mergeAbortSignals

**Location**: `src/utils/createTimeoutSignal.ts`

**Purpose**: Combine multiple AbortSignals into one

**Signature**:
```typescript
export function mergeAbortSignals(signals: AbortSignal[]): AbortSignal
```

**Logic**:
- Create new controller
- If any signal already aborted, abort immediately
- Otherwise, listen to all signals and abort when first one aborts

---

## Design Decisions

### Why User-Provided Fetch Adapter?

**Problem**: Built-in HTTP clients add dependencies and reduce flexibility.

**Solution**: Require users to provide their own fetch implementation.

**Benefits**:
1. **Full control** over HTTP implementation
2. **Authentication flexibility** - implement any auth method at the HTTP layer
3. **Easy testing** - mock the adapter interface
4. **No forced dependencies** - choose your preferred library (undici, node-fetch, axios, etc.)
5. **Smaller bundle** - no built-in HTTP client code
6. **Platform agnostic** - works in Node.js, browser, Deno, etc.

**Trade-off**: Slightly more setup required, but provides maximum flexibility.

### Why Minimal Core?

**Problem**: Opinionated defaults and built-in features increase bundle size and reduce flexibility.

**Solution**: Minimal core with opt-in features via adapters.

**Benefits**:
1. **Smaller bundle size** for simple use cases
2. **Explicit complexity** - only add what you need
3. **Customizable behavior** - implement adapters for exact requirements
4. **No opinionated defaults** - users decide retry logic, rate limits, caching strategy
5. **Easier testing** - less code, fewer side effects

**Trade-off**: More initial setup for complex use cases, but better long-term maintainability.

### Why Separate JiraFetchClient from FetchClient?

**Problem**: Mixing generic HTTP logic with JIRA-specific logic creates tight coupling.

**Solution**: Layer JIRA-specific features on top of generic HTTP client.

**Benefits**:
1. **Reusability**: FetchClient can be used for non-JIRA APIs
2. **Single Responsibility**: Each class has one clear job
3. **Testability**: Can test generic HTTP logic separately from JIRA logic
4. **Composability**: JIRA-specific features are additive, not intrusive
5. **Clear boundaries**: HTTP concerns vs. API concerns

**Trade-off**: One extra layer of abstraction, but much better separation of concerns.

### Why Composition Over Configuration?

**Problem**: Large configuration objects become hard to understand and maintain.

**Solution**: Use dependency injection and composition of small adapters.

**Benefits**:
1. **Type safety**: Each adapter has a clear interface
2. **Testability**: Easy to mock individual adapters
3. **Flexibility**: Mix and match adapters as needed
4. **Discoverability**: IDE autocomplete shows available options
5. **Extensibility**: Add new adapters without modifying core

**Example**:
```typescript
// Bad: Large config object
{ cache: true, cacheType: 'lru', cacheSize: 100, cacheTTL: 300000 }

// Good: Composed adapter
requestCache: new LRUCache({ maxSize: 100, ttl: 300000 })
```

### Why Explicit Error Codes?

**Problem**: Catching and handling errors based on message strings is fragile.

**Solution**: Machine-readable error codes with rich context.

**Benefits**:
1. **Reliable error handling**: Switch on error code, not message
2. **Internationalization**: Error messages can be localized, codes cannot
3. **Debugging**: Rich context (status, URL, method) helps diagnose issues
4. **Monitoring**: Easy to track error types in logging systems
5. **Backwards compatibility**: Can change error messages without breaking code

**Example**:
```typescript
// Reliable
if (error.code === ErrorCode.TIMEOUT) { /* retry */ }

// Fragile
if (error.message.includes('timeout')) { /* breaks if message changes */ }
```

---

## Usage Examples

### Basic Setup

```typescript
import { JiraFetchClient, UndiciFetchAdapter } from 'jira-fetcher-core';

const client = new JiraFetchClient({
  baseUrl: 'https://jira.example.com',
  fetchClientOptions: {
    fetchAdapter: new UndiciFetchAdapter()
  }
});

// Fetch an issue
const issue = await client.get('/rest/api/2/issue/PROJ-123');

// Search for issues
const results = await client.get('/rest/api/2/search', {
  queryParams: {
    jql: 'project = PROJ AND status = "In Progress"',
    maxResults: 50
  }
});

// Create an issue
const newIssue = await client.post('/rest/api/2/issue', {
  body: {
    fields: {
      project: { key: 'PROJ' },
      summary: 'New issue',
      issuetype: { name: 'Task' }
    }
  }
});
```

### With Authentication

```typescript
import { JiraFetchClient, FetchAdapter } from 'jira-fetcher-core';
import { fetch as undiciFetch } from 'undici';

class BasicAuthAdapter implements FetchAdapter {
  constructor(
    private email: string,
    private apiToken: string
  ) {}

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    const credentials = Buffer
      .from(`${this.email}:${this.apiToken}`)
      .toString('base64');
    headers.set('Authorization', `Basic ${credentials}`);

    return undiciFetch(url, { ...init, headers });
  }
}

const client = new JiraFetchClient({
  baseUrl: 'https://jira.example.com',
  fetchClientOptions: {
    fetchAdapter: new BasicAuthAdapter(
      'user@example.com',
      'api-token-here'
    )
  }
});
```

### With Optional Adapters

```typescript
import { JiraFetchClient, UndiciFetchAdapter } from 'jira-fetcher-core';

// Simple rate limiter
class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private maxTokens: number,
    private refillRate: number
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquireToken();
    return fn();
  }

  private async acquireToken(): Promise<void> {
    while (this.tokens < 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
      this.refill();
    }
    this.tokens--;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const newTokens = (elapsed / 1000) * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }
}

// Simple retry handler
class ExponentialBackoffRetryHandler {
  constructor(
    private maxRetries: number = 3,
    private initialDelayMs: number = 1000
  ) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.maxRetries) {
          const delay = this.initialDelayMs * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }
}

// In-memory cache
class MemoryRequestCache {
  private cache = new Map<string, Response>();

  async get(key: string): Promise<Response | undefined> {
    const cached = this.cache.get(key);
    return cached?.clone();
  }

  async set(key: string, response: Response): Promise<void> {
    this.cache.set(key, response.clone());
  }
}

// Client with all adapters
const client = new JiraFetchClient({
  baseUrl: 'https://jira.example.com',
  fetchClientOptions: {
    fetchAdapter: new UndiciFetchAdapter(),
    rateLimitAdapter: new TokenBucketRateLimiter(10, 5),
    retryHandler: new ExponentialBackoffRetryHandler(3, 1000),
    requestCache: new MemoryRequestCache(),
    timeoutMs: 30000
  }
});
```

### With Transform Hooks

```typescript
import { JiraFetchClient, UndiciFetchAdapter } from 'jira-fetcher-core';

const client = new JiraFetchClient({
  baseUrl: 'https://jira.example.com',
  fetchClientOptions: {
    fetchAdapter: new UndiciFetchAdapter(),

    // Add request tracing
    transformRequest: async (url, init) => {
      const headers = new Headers(init.headers);
      headers.set('X-Request-ID', crypto.randomUUID());
      headers.set('X-Request-Time', new Date().toISOString());

      console.log(`[REQUEST] ${init.method} ${url}`);

      return [url, { ...init, headers }];
    },

    // Log responses
    transformResponse: async (response) => {
      console.log(`[RESPONSE] ${response.status} ${response.url}`);
      return response;
    }
  }
});
```

### Error Handling

```typescript
import {
  JiraFetchClient,
  JiraFetchError,
  ErrorCode
} from 'jira-fetcher-core';

try {
  const issue = await client.get('/rest/api/2/issue/PROJ-123');
  console.log('Issue:', issue);

} catch (error) {
  if (error instanceof JiraFetchError) {
    switch (error.code) {
      case ErrorCode.NETWORK:
        console.error('Network error:', error.message);
        // Retry or show offline message
        break;

      case ErrorCode.RESPONSE:
        console.error(`HTTP ${error.status}:`, error.message);

        if (error.status === 401) {
          // Re-authenticate
        } else if (error.status === 404) {
          // Show not found message
        } else if (error.status === 429) {
          // Rate limited - back off
        } else if (error.status && error.status >= 500) {
          // Server error - retry
        }
        break;

      case ErrorCode.TIMEOUT:
        console.error('Request timeout:', error.message);
        // Retry with longer timeout
        break;

      case ErrorCode.CONFIGURATION:
        console.error('Configuration error:', error.message);
        // Fix code - this shouldn't happen in production
        break;
    }

    // Log error details
    console.error('Error details:', error.toJSON());
  } else {
    // Unexpected error
    console.error('Unexpected error:', error);
  }
}
```

### Testing with Mock Adapter

```typescript
import { JiraFetchClient, FetchAdapter } from 'jira-fetcher-core';
import { describe, it, expect } from 'vitest';

class MockFetchAdapter implements FetchAdapter {
  private mockResponses = new Map<string, Response>();

  mockResponse(url: string, data: unknown, status = 200): void {
    this.mockResponses.set(url, new Response(
      JSON.stringify(data),
      {
        status,
        headers: { 'content-type': 'application/json' }
      }
    ));
  }

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    const response = this.mockResponses.get(url);
    if (!response) {
      throw new Error(`No mock response for ${url}`);
    }
    return response.clone();
  }
}

describe('JiraFetchClient', () => {
  it('should fetch an issue', async () => {
    const mockAdapter = new MockFetchAdapter();
    mockAdapter.mockResponse(
      'https://jira.example.com/rest/api/2/issue/PROJ-123',
      { key: 'PROJ-123', fields: { summary: 'Test issue' } }
    );

    const client = new JiraFetchClient({
      baseUrl: 'https://jira.example.com',
      fetchClientOptions: {
        fetchAdapter: mockAdapter
      }
    });

    const issue = await client.get('/rest/api/2/issue/PROJ-123');

    expect(issue).toEqual({
      key: 'PROJ-123',
      fields: { summary: 'Test issue' }
    });
  });
});
```

---

## Appendix: Type Definitions

### Core Types

```typescript
// HTTP Methods
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Request configuration
interface RequestConfig {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
}

// JIRA-specific request configuration
interface JiraRequestConfig {
  method: HttpMethod;
  path: string;
  pathParams?: Record<string, string | number>;
  queryParams?: Record<string, string | number | boolean | string[] | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

// Transform hooks
type TransformRequest = (
  url: string,
  init: RequestInit
) => Promise<[string, RequestInit]> | [string, RequestInit];

type TransformResponse = (
  response: Response
) => Promise<Response> | Response;

// Error context
interface ErrorContext {
  status?: number;
  details?: unknown;
  url?: string;
  method?: string;
}
```

### Adapter Interfaces

```typescript
// Required fetch adapter
interface FetchAdapter {
  fetch(url: string, init?: RequestInit): Promise<Response>;
}

// Optional rate limit adapter
interface RateLimitAdapter {
  schedule<T>(fn: () => Promise<T>): Promise<T>;
}

// Optional request cache
interface RequestCache {
  get(key: string): Promise<Response | undefined>;
  set(key: string, response: Response): Promise<void>;
}

// Optional retry handler
interface RetryHandler {
  run<T>(fn: () => Promise<T>): Promise<T>;
}
```

---

## Summary

The JIRA Fetcher Core implements a **flexible, composable HTTP client** using:

- **Adapter Pattern**: Pluggable fetch implementation for maximum flexibility
- **Strategy Pattern**: Optional behaviors via adapters (rate limit, cache, retry)
- **Layered Architecture**: Clear separation of concerns (generic HTTP vs. JIRA-specific)
- **Type Safety**: Full TypeScript support with generics
- **Minimal Dependencies**: Only undici (and only in the provided adapter)

**Key Innovation**: Requiring users to provide their own fetch adapter enables:
- Complete control over authentication
- Easy mocking for tests
- No vendor lock-in
- Minimal bundle size
- Platform independence

All features are **opt-in**, keeping the core minimal while supporting sophisticated use cases through composition.
