# Advanced Adapters Guide

This guide provides design patterns and example implementations for advanced features like rate limiting, retry logic, and request caching. **These features are not built into the library by default** - you implement them as needed for your use case.

---

## Rate Limiting

Control request throughput to respect JIRA API rate limits.

### 1. Simple Rate Limiter

Enforces a minimum delay between requests:

```typescript
import { RateLimitAdapter } from "@thinkeloquent/jira-fetcher-core";

export class SimpleRateLimiter implements RateLimitAdapter {
  private lastRequestTime = 0;

  constructor(private readonly intervalMs: number = 100) {}

  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const waitTime = Math.max(0, this.intervalMs - timeSinceLastRequest);

    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
    return fn();
  }
}

// Usage
import {
  JiraFetchClient,
  UndiciFetchAdapter,
} from "@thinkeloquent/jira-fetcher-core";

const client = new JiraFetchClient({
  baseUrl: "https://your-domain.atlassian.net",
  fetchClientOptions: {
    fetchAdapter: new UndiciFetchAdapter(),
    rateLimitAdapter: new SimpleRateLimiter(200), // 200ms between requests
  },
});
```

### 2. Token Bucket Rate Limiter

More sophisticated rate limiting with burst capacity:

```typescript
import { RateLimitAdapter } from "@thinkeloquent/jira-fetcher-core";

export class TokenBucketRateLimiter implements RateLimitAdapter {
  private tokens: number;
  private lastRefillTime: number;

  constructor(
    private readonly capacity: number = 10,
    private readonly refillRate: number = 1 // tokens per second
  ) {
    this.tokens = capacity;
    this.lastRefillTime = Date.now();
  }

  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitForToken();
    this.tokens -= 1;
    return fn();
  }

  private async waitForToken(): Promise<void> {
    while (true) {
      this.refillTokens();

      if (this.tokens >= 1) {
        return;
      }

      // Wait until we can refill at least one token
      const tokensNeeded = 1 - this.tokens;
      const msToWait = (tokensNeeded / this.refillRate) * 1000;
      await new Promise((resolve) => setTimeout(resolve, msToWait));
    }
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefillTime) / 1000;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }
}

// Usage
const client = new JiraFetchClient({
  baseUrl: "https://your-domain.atlassian.net",
  fetchClientOptions: {
    fetchAdapter: new UndiciFetchAdapter(),
    rateLimitAdapter: new TokenBucketRateLimiter(10, 5), // 10 burst, 5/sec sustained
  },
});
```

### 3. Concurrency Limiter

Limit the number of concurrent requests:

```typescript
import { RateLimitAdapter } from "@thinkeloquent/jira-fetcher-core";

export class ConcurrencyLimiter implements RateLimitAdapter {
  private activeRequests = 0;
  private queue: Array<() => void> = [];

  constructor(private readonly maxConcurrency: number = 5) {}

  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitForSlot();
    this.activeRequests += 1;

    try {
      return await fn();
    } finally {
      this.activeRequests -= 1;
      this.processQueue();
    }
  }

  private async waitForSlot(): Promise<void> {
    if (this.activeRequests < this.maxConcurrency) {
      return;
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  private processQueue(): void {
    if (this.queue.length > 0 && this.activeRequests < this.maxConcurrency) {
      const resolve = this.queue.shift()!;
      resolve();
    }
  }
}

// Usage
const client = new JiraFetchClient({
  baseUrl: "https://your-domain.atlassian.net",
  fetchClientOptions: {
    fetchAdapter: new UndiciFetchAdapter(),
    rateLimitAdapter: new ConcurrencyLimiter(5), // Max 5 concurrent requests
  },
});
```

---

## Retry Logic

Automatically retry failed requests with exponential backoff.

### 1. Simple Retry Handler

Fixed number of retries with linear delay:

```typescript
import { RetryHandler } from "@thinkeloquent/jira-fetcher-core";

export class SimpleRetryHandler implements RetryHandler {
  constructor(
    private readonly maxRetries: number = 3,
    private readonly delayMs: number = 1000
  ) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, this.delayMs));
        }
      }
    }

    throw lastError;
  }
}

// Usage
const client = new JiraFetchClient({
  baseUrl: "https://your-domain.atlassian.net",
  fetchClientOptions: {
    fetchAdapter: new UndiciFetchAdapter(),
    retryHandler: new SimpleRetryHandler(3, 1000), // 3 retries, 1s delay
  },
});
```

### 2. Exponential Backoff Retry Handler

Increasing delays between retries:

```typescript
import {
  RetryHandler,
  JiraFetchError,
  ErrorCode,
} from "@thinkeloquent/jira-fetcher-core";

export class ExponentialBackoffRetryHandler implements RetryHandler {
  constructor(
    private readonly maxRetries: number = 3,
    private readonly initialDelayMs: number = 1000,
    private readonly maxDelayMs: number = 30000,
    private readonly retryableStatusCodes: number[] = [
      408, 429, 500, 502, 503, 504,
    ]
  ) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Only retry on specific conditions
        if (!this.shouldRetry(error, attempt)) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.initialDelayMs * Math.pow(2, attempt),
          this.maxDelayMs
        );

        // Add jitter to prevent thundering herd
        const jitter = Math.random() * delay * 0.1;
        await new Promise((resolve) => setTimeout(resolve, delay + jitter));
      }
    }

    throw lastError;
  }

  private shouldRetry(error: unknown, attempt: number): boolean {
    // Don't retry if we've exhausted attempts
    if (attempt >= this.maxRetries) {
      return false;
    }

    // Retry on network errors
    if (error instanceof JiraFetchError && error.code === ErrorCode.NETWORK) {
      return true;
    }

    // Retry on timeout errors
    if (error instanceof JiraFetchError && error.code === ErrorCode.TIMEOUT) {
      return true;
    }

    // Retry on specific HTTP status codes
    if (error instanceof JiraFetchError && error.status) {
      return this.retryableStatusCodes.includes(error.status);
    }

    return false;
  }
}

// Usage
const client = new JiraFetchClient({
  baseUrl: "https://your-domain.atlassian.net",
  fetchClientOptions: {
    fetchAdapter: new UndiciFetchAdapter(),
    retryHandler: new ExponentialBackoffRetryHandler(5, 1000, 30000),
  },
});
```

---

## Request Caching

Cache GET requests to reduce API calls.

### 1. In-Memory Cache

Simple in-memory cache:

```typescript
import { RequestCache } from "@thinkeloquent/jira-fetcher-core";

export class MemoryRequestCache implements RequestCache {
  private cache = new Map<string, Response>();

  async get(key: string): Promise<Response | undefined> {
    return this.cache.get(key);
  }

  async set(key: string, response: Response): Promise<void> {
    // Clone the response to avoid consuming the body
    this.cache.set(key, response.clone());
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

// Usage
const cache = new MemoryRequestCache();

const client = new JiraFetchClient({
  baseUrl: "https://your-domain.atlassian.net",
  fetchClientOptions: {
    fetchAdapter: new UndiciFetchAdapter(),
    requestCache: cache,
  },
});

// Clear cache when needed
cache.clear();
```

### 2. TTL-Based Cache

Cache with time-to-live expiration:

```typescript
import { RequestCache } from "@thinkeloquent/jira-fetcher-core";

interface CacheEntry {
  response: Response;
  expiresAt: number;
}

export class TTLCache implements RequestCache {
  private cache = new Map<string, CacheEntry>();

  constructor(private readonly ttlMs: number = 60000) {} // 1 minute default

  async get(key: string): Promise<Response | undefined> {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.response.clone();
  }

  async set(key: string, response: Response): Promise<void> {
    this.cache.set(key, {
      response: response.clone(),
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Periodically clean up expired entries
  startCleanup(intervalMs: number = 60000): NodeJS.Timeout {
    return setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
        }
      }
    }, intervalMs);
  }
}

// Usage
const cache = new TTLCache(5 * 60 * 1000); // 5 minute TTL
const cleanupInterval = cache.startCleanup();

const client = new JiraFetchClient({
  baseUrl: "https://your-domain.atlassian.net",
  fetchClientOptions: {
    fetchAdapter: new UndiciFetchAdapter(),
    requestCache: cache,
  },
});

// Stop cleanup when done
// clearInterval(cleanupInterval);
```

### 3. LRU Cache

Least Recently Used cache with size limit:

```typescript
import { RequestCache } from "@thinkeloquent/jira-fetcher-core";

interface CacheNode {
  key: string;
  response: Response;
  prev: CacheNode | null;
  next: CacheNode | null;
}

export class LRUCache implements RequestCache {
  private cache = new Map<string, CacheNode>();
  private head: CacheNode | null = null;
  private tail: CacheNode | null = null;

  constructor(private readonly maxSize: number = 100) {}

  async get(key: string): Promise<Response | undefined> {
    const node = this.cache.get(key);

    if (!node) {
      return undefined;
    }

    // Move to front (most recently used)
    this.moveToFront(node);

    return node.response.clone();
  }

  async set(key: string, response: Response): Promise<void> {
    // Remove existing node if present
    const existingNode = this.cache.get(key);
    if (existingNode) {
      this.removeNode(existingNode);
    }

    // Create new node
    const node: CacheNode = {
      key,
      response: response.clone(),
      prev: null,
      next: null,
    };

    // Add to front
    this.addToFront(node);
    this.cache.set(key, node);

    // Evict least recently used if over capacity
    if (this.cache.size > this.maxSize) {
      this.evictLRU();
    }
  }

  private moveToFront(node: CacheNode): void {
    this.removeNode(node);
    this.addToFront(node);
  }

  private addToFront(node: CacheNode): void {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: CacheNode): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private evictLRU(): void {
    if (!this.tail) {
      return;
    }

    this.cache.delete(this.tail.key);
    this.removeNode(this.tail);
  }
}

// Usage
const client = new JiraFetchClient({
  baseUrl: "https://your-domain.atlassian.net",
  fetchClientOptions: {
    fetchAdapter: new UndiciFetchAdapter(),
    requestCache: new LRUCache(100), // Keep 100 most recent requests
  },
});
```

---

## Combining Multiple Adapters

You can use multiple adapters together:

```typescript
const client = new JiraFetchClient({
  baseUrl: "https://your-domain.atlassian.net",
  fetchClientOptions: {
    fetchAdapter: new UndiciFetchAdapter(),
    rateLimitAdapter: new TokenBucketRateLimiter(10, 5),
    retryHandler: new ExponentialBackoffRetryHandler(3, 1000, 30000),
    requestCache: new TTLCache(5 * 60 * 1000),
    timeoutMs: 30000,
  },
});
```

---

## Best Practices

### 1. Choose the Right Rate Limiter

- **Simple**: Good for basic rate limiting
- **Token Bucket**: Best for handling bursts while maintaining average rate
- **Concurrency**: Best for controlling resource usage

### 2. Implement Smart Retry Logic

- Only retry on transient errors (network, timeout, 5xx)
- Use exponential backoff to reduce server load
- Add jitter to prevent thundering herd
- Respect `Retry-After` headers from the server

### 3. Cache Wisely

- Only cache GET requests
- Use appropriate TTL based on data volatility
- Consider cache invalidation strategies
- Be mindful of memory usage with large responses

### 4. Monitor and Log

Add logging to adapters for debugging:

```typescript
export class LoggingRateLimiter implements RateLimitAdapter {
  constructor(private readonly inner: RateLimitAdapter) {}

  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    console.log("[RateLimit] Scheduling request");

    const result = await this.inner.schedule(fn);

    const duration = Date.now() - start;
    console.log(`[RateLimit] Request completed in ${duration}ms`);

    return result;
  }
}
```
