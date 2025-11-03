# Authentication Guide

Authentication is handled by your custom fetch adapter. This gives you complete flexibility to implement any authentication method supported by your JIRA instance.

## Authentication Methods

### 1. Basic Authentication (API Token)

Most common for JIRA Cloud. Uses username (email) and API token.

```typescript
import { fetch as undiciFetch } from "undici";
import {
  FetchAdapter,
  JiraFetchClient,
} from "@thinkeloquent/jira-fetcher-core";

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

    return undiciFetch(url, {
      ...init,
      headers,
    });
  }
}

// Usage
const client = new JiraFetchClient({
  baseUrl: "https://your-domain.atlassian.net",
  fetchClientOptions: {
    fetchAdapter: new BasicAuthAdapter("user@example.com", "your-api-token"),
  },
});
```

### 2. Bearer Token (OAuth 2.0)

For OAuth 2.0 authenticated requests.

```typescript
import { fetch as undiciFetch } from "undici";
import {
  FetchAdapter,
  JiraFetchClient,
} from "@thinkeloquent/jira-fetcher-core";

class BearerTokenAdapter implements FetchAdapter {
  constructor(private readonly token: string) {}

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${this.token}`);

    return undiciFetch(url, {
      ...init,
      headers,
    });
  }
}

// Usage
const client = new JiraFetchClient({
  baseUrl: "https://your-domain.atlassian.net",
  fetchClientOptions: {
    fetchAdapter: new BearerTokenAdapter("your-oauth-token"),
  },
});
```

### 3. Personal Access Token (PAT)

JIRA Data Center supports Personal Access Tokens.

```typescript
import { fetch as undiciFetch } from "undici";
import {
  FetchAdapter,
  JiraFetchClient,
} from "@thinkeloquent/jira-fetcher-core";

class PersonalAccessTokenAdapter implements FetchAdapter {
  constructor(private readonly pat: string) {}

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${this.pat}`);

    return undiciFetch(url, {
      ...init,
      headers,
    });
  }
}

// Usage
const client = new JiraFetchClient({
  baseUrl: "https://jira.your-company.com",
  fetchClientOptions: {
    fetchAdapter: new PersonalAccessTokenAdapter("your-pat-token"),
  },
});
```

### 4. Token Refresh (OAuth with Auto-Refresh)

Automatically refresh expired OAuth tokens.

```typescript
import { fetch as undiciFetch } from "undici";
import {
  FetchAdapter,
  JiraFetchClient,
} from "@thinkeloquent/jira-fetcher-core";

interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

class OAuthAdapter implements FetchAdapter {
  private tokens: OAuthTokens;

  constructor(
    private readonly initialTokens: OAuthTokens,
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly tokenEndpoint: string
  ) {
    this.tokens = initialTokens;
  }

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    // Refresh token if expired
    if (Date.now() >= this.tokens.expiresAt) {
      await this.refreshAccessToken();
    }

    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${this.tokens.accessToken}`);

    return undiciFetch(url, {
      ...init,
      headers,
    });
  }

  private async refreshAccessToken(): Promise<void> {
    const response = await undiciFetch(this.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.tokens.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh access token");
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    this.tokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
  }
}

// Usage
const client = new JiraFetchClient({
  baseUrl: "https://your-domain.atlassian.net",
  fetchClientOptions: {
    fetchAdapter: new OAuthAdapter(
      {
        accessToken: "initial-access-token",
        refreshToken: "initial-refresh-token",
        expiresAt: Date.now() + 3600000, // 1 hour
      },
      "your-client-id",
      "your-client-secret",
      "https://auth.atlassian.com/oauth/token"
    ),
  },
});
```

### 5. Custom Headers

Add any custom headers required by your JIRA setup.

```typescript
import { fetch as undiciFetch } from "undici";
import {
  FetchAdapter,
  JiraFetchClient,
} from "@thinkeloquent/jira-fetcher-core";

class CustomHeaderAdapter implements FetchAdapter {
  constructor(private readonly customHeaders: Record<string, string>) {}

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);

    for (const [key, value] of Object.entries(this.customHeaders)) {
      headers.set(key, value);
    }

    return undiciFetch(url, {
      ...init,
      headers,
    });
  }
}

// Usage
const client = new JiraFetchClient({
  baseUrl: "https://jira.your-company.com",
  fetchClientOptions: {
    fetchAdapter: new CustomHeaderAdapter({
      "X-Atlassian-Token": "no-check",
      "X-Custom-Auth": "custom-value",
    }),
  },
});
```

### 6. Environment Variables

Load credentials from environment variables for security.

```typescript
import { fetch as undiciFetch } from "undici";
import {
  FetchAdapter,
  JiraFetchClient,
} from "@thinkeloquent/jira-fetcher-core";

class EnvAuthAdapter implements FetchAdapter {
  private readonly email: string;
  private readonly apiToken: string;

  constructor() {
    this.email = process.env.JIRA_EMAIL!;
    this.apiToken = process.env.JIRA_API_TOKEN!;

    if (!this.email || !this.apiToken) {
      throw new Error("JIRA_EMAIL and JIRA_API_TOKEN must be set");
    }
  }

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    const credentials = Buffer.from(`${this.email}:${this.apiToken}`).toString(
      "base64"
    );

    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Basic ${credentials}`);

    return undiciFetch(url, {
      ...init,
      headers,
    });
  }
}

// Usage
const client = new JiraFetchClient({
  baseUrl: process.env.JIRA_BASE_URL!,
  fetchClientOptions: {
    fetchAdapter: new EnvAuthAdapter(),
  },
});
```

---

## Using Transform Request Hook

Alternatively, you can use the `transformRequest` hook to add authentication:

```typescript
import {
  UndiciFetchAdapter,
  JiraFetchClient,
} from "@thinkeloquent/jira-fetcher-core";

const client = new JiraFetchClient({
  baseUrl: "https://your-domain.atlassian.net",
  fetchClientOptions: {
    fetchAdapter: new UndiciFetchAdapter(),
    transformRequest: async (url, init) => {
      const headers = new Headers(init.headers);
      const credentials = Buffer.from("email:token").toString("base64");
      headers.set("Authorization", `Basic ${credentials}`);

      return [url, { ...init, headers }];
    },
  },
});
```

---

## Best Practices

### 1. Never Hardcode Credentials

Always load credentials from environment variables or secure configuration:

```typescript
// ❌ Bad
const adapter = new BasicAuthAdapter("user@example.com", "hardcoded-token");

// ✅ Good
const adapter = new BasicAuthAdapter(
  process.env.JIRA_EMAIL!,
  process.env.JIRA_API_TOKEN!
);
```

### 2. Use API Tokens, Not Passwords

For JIRA Cloud, always use API tokens instead of passwords:

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create a new API token
3. Use your email and the token for Basic Auth

### 3. Implement Token Refresh for Long-Running Apps

If using OAuth, implement automatic token refresh to prevent authentication failures.

### 4. Handle Authentication Errors Gracefully

```typescript
import { JiraFetchError, ErrorCode } from "@thinkeloquent/jira-fetcher-core";

try {
  const issue = await client.get("/rest/api/2/issue/PROJ-123");
} catch (error) {
  if (error instanceof JiraFetchError && error.status === 401) {
    console.error("Authentication failed. Check your credentials.");
  }
}
```

---

## Testing with Mock Authentication

Create a mock adapter for testing:

```typescript
class MockAuthAdapter implements FetchAdapter {
  async fetch(url: string, init?: RequestInit): Promise<Response> {
    // Mock implementation
    return new Response(JSON.stringify({ key: "PROJ-123" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

const testClient = new JiraFetchClient({
  baseUrl: "https://test.atlassian.net",
  fetchClientOptions: {
    fetchAdapter: new MockAuthAdapter(),
  },
});
```
