# Usage Examples

Real-world examples of using `@thinkeloquent/jira-fetcher-core` with the JIRA API.

---

## Complete Setup Example

```typescript
import { fetch as undiciFetch } from "undici";
import {
  JiraFetchClient,
  FetchAdapter,
  JiraFetchError,
  ErrorCode,
} from "@thinkeloquent/jira-fetcher-core";

// Custom auth adapter
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

// Create client
const client = new JiraFetchClient({
  baseUrl: process.env.JIRA_BASE_URL!,
  fetchClientOptions: {
    fetchAdapter: new BasicAuthAdapter(
      process.env.JIRA_EMAIL!,
      process.env.JIRA_API_TOKEN!
    ),
    timeoutMs: 30000,
  },
});

export default client;
```

---

## Issues API

### Get an Issue

```typescript
interface Issue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description: string;
    status: { name: string };
    assignee: { displayName: string } | null;
    priority: { name: string };
  };
}

async function getIssue(issueKey: string): Promise<Issue> {
  return client.get<Issue>(`/rest/api/2/issue/{issueIdOrKey}`, {
    pathParams: { issueIdOrKey: issueKey },
    queryParams: {
      fields: ["summary", "description", "status", "assignee", "priority"],
    },
  });
}

// Usage
const issue = await getIssue("PROJ-123");
console.log(issue.fields.summary);
```

### Create an Issue

```typescript
interface CreateIssueRequest {
  fields: {
    project: { key: string };
    summary: string;
    description?: string;
    issuetype: { name: string };
    priority?: { name: string };
    assignee?: { name: string };
  };
}

interface CreateIssueResponse {
  id: string;
  key: string;
  self: string;
}

async function createIssue(
  data: CreateIssueRequest
): Promise<CreateIssueResponse> {
  return client.post<CreateIssueResponse>("/rest/api/2/issue", data);
}

// Usage
const newIssue = await createIssue({
  fields: {
    project: { key: "PROJ" },
    summary: "New bug found",
    description: "Details about the bug",
    issuetype: { name: "Bug" },
    priority: { name: "High" },
  },
});

console.log(`Created issue: ${newIssue.key}`);
```

### Update an Issue

```typescript
async function updateIssue(
  issueKey: string,
  updates: Partial<CreateIssueRequest>
): Promise<void> {
  await client.put(`/rest/api/2/issue/{issueIdOrKey}`, updates, {
    pathParams: { issueIdOrKey: issueKey },
  });
}

// Usage
await updateIssue("PROJ-123", {
  fields: {
    summary: "Updated summary",
    priority: { name: "Critical" },
  },
});
```

### Search Issues (JQL)

```typescript
interface SearchResponse {
  startAt: number;
  maxResults: number;
  total: number;
  issues: Issue[];
}

async function searchIssues(jql: string, maxResults = 50): Promise<Issue[]> {
  const response = await client.get<SearchResponse>("/rest/api/2/search", {
    queryParams: {
      jql,
      maxResults,
      fields: ["summary", "status", "assignee"],
    },
  });

  return response.issues;
}

// Usage
const issues = await searchIssues("project = PROJ AND status = Open");
console.log(`Found ${issues.length} issues`);
```

---

## Projects API

### Get All Projects

```typescript
interface Project {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  lead: { displayName: string };
}

async function getProjects(): Promise<Project[]> {
  return client.get<Project[]>("/rest/api/2/project");
}

// Usage
const projects = await getProjects();
projects.forEach((p) => console.log(`${p.key}: ${p.name}`));
```

### Get Project Details

```typescript
async function getProject(projectKey: string): Promise<Project> {
  return client.get<Project>(`/rest/api/2/project/{projectIdOrKey}`, {
    pathParams: { projectIdOrKey: projectKey },
  });
}

// Usage
const project = await getProject("PROJ");
console.log(project.name);
```

---

## Boards API (Agile)

### Get All Boards

```typescript
interface Board {
  id: number;
  name: string;
  type: string;
}

interface BoardsResponse {
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: Board[];
}

async function getBoards(): Promise<Board[]> {
  const response = await client.get<BoardsResponse>("/rest/agile/1.0/board");
  return response.values;
}

// Usage
const boards = await getBoards();
boards.forEach((b) => console.log(`${b.id}: ${b.name}`));
```

### Get Board Issues

```typescript
async function getBoardIssues(boardId: number): Promise<Issue[]> {
  const response = await client.get<SearchResponse>(
    "/rest/agile/1.0/board/{boardId}/issue",
    {
      pathParams: { boardId },
      queryParams: {
        maxResults: 100,
      },
    }
  );

  return response.issues;
}

// Usage
const issues = await getBoardIssues(123);
```

---

## Sprints API (Agile)

### Get Active Sprint

```typescript
interface Sprint {
  id: number;
  name: string;
  state: "active" | "closed" | "future";
  startDate: string;
  endDate: string;
}

interface SprintsResponse {
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: Sprint[];
}

async function getActiveSprint(boardId: number): Promise<Sprint | null> {
  const response = await client.get<SprintsResponse>(
    "/rest/agile/1.0/board/{boardId}/sprint",
    {
      pathParams: { boardId },
      queryParams: {
        state: "active",
      },
    }
  );

  return response.values[0] || null;
}

// Usage
const sprint = await getActiveSprint(123);
if (sprint) {
  console.log(`Active sprint: ${sprint.name}`);
}
```

---

## Comments API

### Add Comment

```typescript
interface Comment {
  id: string;
  body: string;
  author: { displayName: string };
  created: string;
}

async function addComment(issueKey: string, body: string): Promise<Comment> {
  return client.post<Comment>(
    "/rest/api/2/issue/{issueIdOrKey}/comment",
    { body },
    { pathParams: { issueIdOrKey: issueKey } }
  );
}

// Usage
const comment = await addComment("PROJ-123", "This is a comment");
```

### Get Comments

```typescript
interface CommentsResponse {
  startAt: number;
  maxResults: number;
  total: number;
  comments: Comment[];
}

async function getComments(issueKey: string): Promise<Comment[]> {
  const response = await client.get<CommentsResponse>(
    "/rest/api/2/issue/{issueIdOrKey}/comment",
    {
      pathParams: { issueIdOrKey: issueKey },
    }
  );

  return response.comments;
}

// Usage
const comments = await getComments("PROJ-123");
```

---

## Attachments API

### Upload Attachment

```typescript
import { FormData, File } from "undici";

async function uploadAttachment(
  issueKey: string,
  filePath: string
): Promise<void> {
  // Note: For file uploads, you may need to use a custom fetch adapter
  // that handles multipart/form-data

  const formData = new FormData();
  const fileContent = await fs.readFile(filePath);
  formData.append("file", new File([fileContent], path.basename(filePath)));

  await client.post(`/rest/api/2/issue/{issueIdOrKey}/attachments`, formData, {
    pathParams: { issueIdOrKey: issueKey },
    headers: {
      "X-Atlassian-Token": "no-check", // Required for file uploads
    },
  });
}
```

---

## Error Handling

### Handling Different Error Types

```typescript
import { JiraFetchError, ErrorCode } from "@thinkeloquent/jira-fetcher-core";

async function safeGetIssue(issueKey: string): Promise<Issue | null> {
  try {
    return await getIssue(issueKey);
  } catch (error) {
    if (error instanceof JiraFetchError) {
      switch (error.code) {
        case ErrorCode.RESPONSE:
          if (error.status === 404) {
            console.log(`Issue ${issueKey} not found`);
            return null;
          }
          if (error.status === 401) {
            console.error("Authentication failed");
            throw error;
          }
          if (error.status === 403) {
            console.error("Permission denied");
            throw error;
          }
          break;

        case ErrorCode.TIMEOUT:
          console.error("Request timed out");
          throw error;

        case ErrorCode.NETWORK:
          console.error("Network error");
          throw error;

        case ErrorCode.CONFIGURATION:
          console.error("Configuration error");
          throw error;
      }
    }

    throw error;
  }
}
```

---

## Pagination

### Paginate Through All Results

```typescript
async function* paginateIssues(jql: string): AsyncGenerator<Issue> {
  let startAt = 0;
  const maxResults = 50;

  while (true) {
    const response = await client.get<SearchResponse>("/rest/api/2/search", {
      queryParams: {
        jql,
        startAt,
        maxResults,
      },
    });

    for (const issue of response.issues) {
      yield issue;
    }

    if (startAt + maxResults >= response.total) {
      break;
    }

    startAt += maxResults;
  }
}

// Usage
for await (const issue of paginateIssues("project = PROJ")) {
  console.log(issue.key);
}
```

### Get All Pages at Once

```typescript
async function getAllIssues(jql: string): Promise<Issue[]> {
  const allIssues: Issue[] = [];
  let startAt = 0;
  const maxResults = 50;

  while (true) {
    const response = await client.get<SearchResponse>("/rest/api/2/search", {
      queryParams: {
        jql,
        startAt,
        maxResults,
      },
    });

    allIssues.push(...response.issues);

    if (startAt + maxResults >= response.total) {
      break;
    }

    startAt += maxResults;
  }

  return allIssues;
}

// Usage
const allIssues = await getAllIssues("project = PROJ");
```

---

## Batch Operations

### Create Multiple Issues

```typescript
async function createIssuesBatch(
  issues: CreateIssueRequest[]
): Promise<CreateIssueResponse[]> {
  const results: CreateIssueResponse[] = [];

  for (const issue of issues) {
    try {
      const result = await createIssue(issue);
      results.push(result);
    } catch (error) {
      console.error(`Failed to create issue:`, error);
    }
  }

  return results;
}

// Usage
const issues = [
  {
    fields: {
      project: { key: "PROJ" },
      summary: "Task 1",
      issuetype: { name: "Task" },
    },
  },
  {
    fields: {
      project: { key: "PROJ" },
      summary: "Task 2",
      issuetype: { name: "Task" },
    },
  },
];

const created = await createIssuesBatch(issues);
```

---

## Building Custom Endpoint Methods

### Create a Type-Safe JIRA Client Wrapper

```typescript
class MyJiraClient {
  constructor(private readonly client: JiraFetchClient) {}

  // Issues
  async getIssue(issueKey: string): Promise<Issue> {
    return this.client.get<Issue>(`/rest/api/2/issue/{issueIdOrKey}`, {
      pathParams: { issueIdOrKey: issueKey },
    });
  }

  async createIssue(data: CreateIssueRequest): Promise<CreateIssueResponse> {
    return this.client.post<CreateIssueResponse>("/rest/api/2/issue", data);
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.client.get<Project[]>("/rest/api/2/project");
  }

  // Boards
  async getBoards(): Promise<Board[]> {
    const response = await this.client.get<BoardsResponse>(
      "/rest/agile/1.0/board"
    );
    return response.values;
  }
}

// Usage
const myClient = new MyJiraClient(client);
const issue = await myClient.getIssue("PROJ-123");
```
