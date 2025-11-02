# JIRA API Module (Node.js/TypeScript)

Comprehensive NodeJS/TypeScript JIRA API integration module with CLI, REST server, and SDK interfaces.

[![CI](https://github.com/yourusername/jira-api-module/workflows/CI/badge.svg)](https://github.com/yourusername/jira-api-module/actions)
[![npm version](https://badge.fury.io/js/jira-api.svg)](https://www.npmjs.com/package/jira-api)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- ✅ **Four Interface Options**: Direct Import, CLI, REST Server, SDK Client
- ✅ **TypeScript Strict Mode**: Full type safety and IntelliSense support
- ✅ **JIRA Cloud API v3**: Complete coverage of user, issue, and project operations
- ✅ **Human-Readable Operations**: Use "Bug" instead of IDs, email-based user operations
- ✅ **Production Ready**: Comprehensive error handling, retry logic, and connection pooling
- ✅ **Security First**: No embedded credentials, environment variable configuration
- ✅ **Well Tested**: >80% test coverage with unit and integration tests
- ✅ **Modern Stack**: ESM modules, latest stable frameworks
- 🚀 **Enhanced Features**: JQL Query Builder, Caching, Webhooks, Batch Operations

## Installation

```bash
npm install jira-api
```

## Quick Start

### Prerequisites

1. Generate JIRA API token: https://id.atlassian.com/manage-profile/security/api-tokens
2. Set environment variables:

```bash
export JIRA_BASE_URL="https://your-domain.atlassian.net"
export JIRA_EMAIL="your-email@domain.com"
export JIRA_API_TOKEN="your-api-token-here"
```

### Direct Import (Library)

```typescript
import { JiraClient } from 'jira-api';

const client = new JiraClient({
  baseUrl: process.env.JIRA_BASE_URL!,
  email: process.env.JIRA_EMAIL!,
  apiToken: process.env.JIRA_API_TOKEN!,
});

// Get user
const user = await client.getUser('accountId');

// Create issue
const issue = await client.createIssue({
  fields: {
    project: { key: 'PROJ' },
    issuetype: { id: '10001' },
    summary: 'Issue summary',
  },
});

// Close connection
await client.close();
```

### CLI (Command-Line Interface)

The CLI provides an interactive command-line interface for common JIRA operations.

#### Installation & Setup

```bash
# Install globally
npm install -g jira-api

# Or use locally
npm install jira-api
npx jira-api --help

# Configure JIRA credentials
jira-api configure
```

The configure command will prompt you for:
- JIRA Base URL (e.g., https://your-domain.atlassian.net)
- Your email address
- API token (you'll need to set this as an environment variable)

After configuration, set your API token:
```bash
export JIRA_API_TOKEN="your-api-token-here"
```

#### CLI Commands

**Configuration:**
```bash
# Interactive configuration wizard
jira-api configure
```

**Issue Operations:**
```bash
# Get issue details
jira-api issue get PROJ-123
jira-api issue get PROJ-123 --json

# Search issues with JQL
jira-api issue search "project = PROJ AND status = 'In Progress'"
jira-api issue search "assignee = currentUser()" --max 100

# Create issue (interactive)
jira-api issue create PROJ Bug --interactive

# Create issue (with options)
jira-api issue create PROJ Bug \
  --summary "Critical bug in production" \
  --description "System crashes on startup" \
  --assignee "developer@company.com" \
  --labels "urgent,production"

# Create bug (convenience)
jira-api issue create-bug PROJ "Bug summary" \
  --description "Bug description" \
  --assignee "dev@company.com"

# Update issue
jira-api issue update PROJ-123 --summary "New summary"
jira-api issue update PROJ-123 --description "New description"

# Assign/unassign
jira-api issue assign PROJ-123 developer@company.com
jira-api issue unassign PROJ-123

# Manage labels
jira-api issue add-labels PROJ-123 reviewed tested
jira-api issue remove-labels PROJ-123 draft

# Transition issue
jira-api issue transitions PROJ-123  # List available transitions
jira-api issue transition PROJ-123 "In Progress"
jira-api issue transition PROJ-123 "Done" --comment "Completed"
```

**User Operations:**
```bash
# Get user by email or account ID
jira-api user get john.doe@example.com
jira-api user get 5b10ac8d82e05b22cc7d4ef5 --json

# Search users
jira-api user search "john"
jira-api user search "john" --max 10

# Find assignable users
jira-api user assignable PROJ
jira-api user assignable PROJ PROJ2 --json

# Resolve email to account ID
jira-api user resolve john@example.com
```

**Project Operations:**
```bash
# Get project details
jira-api project get PROJ
jira-api project get PROJ --json

# List versions
jira-api project versions PROJ
jira-api project versions PROJ --released
jira-api project versions PROJ --unreleased

# Create version (interactive)
jira-api project create-version PROJ "v1.0.0" --interactive

# Create version (with options)
jira-api project create-version PROJ "v1.0.0" \
  --description "First release" \
  --release-date "2025-12-31"

# List issue types
jira-api project issue-types PROJ

# Check if issue type exists
jira-api project has-issue-type PROJ Bug
```

**Global Options:**
```bash
# JSON output (available on most commands)
jira-api issue get PROJ-123 --json

# Debug mode
jira-api --debug issue get PROJ-123

# Help
jira-api --help
jira-api issue --help
jira-api issue create --help
```

### REST Server

The REST server provides a Fastify-based HTTP API with OpenAPI/Swagger documentation.

#### Starting the Server

```typescript
import { startServer } from 'jira-api/server';

// Start with default configuration
await startServer();

// Or with custom configuration
await startServer({
  host: '0.0.0.0',
  port: 3000,
  apiKey: 'your-secret-key',
  corsOrigins: ['http://localhost:3000'],
  rateLimitMax: 100,
  rateLimitWindow: '1 minute',
});
```

Or start from command line:
```bash
# Set environment variables
export JIRA_BASE_URL="https://your-domain.atlassian.net"
export JIRA_EMAIL="your-email@domain.com"
export JIRA_API_TOKEN="your-api-token"
export API_KEY="your-server-api-key"
export SERVER_PORT=3000

# Start server
npm run server
# or
node dist/server.js
```

#### API Documentation

Once the server is running, visit `http://localhost:3000/docs` for interactive Swagger UI documentation.

#### Authentication

All API endpoints (except health checks) require an API key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: your-secret-key" http://localhost:3000/api/v1/users/john@example.com
```

#### Available Endpoints

**Health & Metrics:**
- `GET /health` - Health check
- `GET /ready` - Readiness check
- `GET /metrics` - Server metrics

**User Endpoints:**
- `GET /api/v1/users/:identifier` - Get user by email or account ID
- `GET /api/v1/users/search/:query` - Search users
- `POST /api/v1/users/assignable` - Find assignable users for projects
- `GET /api/v1/users/resolve/:identifier` - Resolve email to account ID

**Issue Endpoints:**
- `GET /api/v1/issues/:key` - Get issue
- `POST /api/v1/issues/search` - Search issues with JQL
- `POST /api/v1/issues` - Create issue
- `PATCH /api/v1/issues/:key` - Update issue
- `POST /api/v1/issues/:key/assign` - Assign issue
- `POST /api/v1/issues/:key/unassign` - Unassign issue
- `POST /api/v1/issues/:key/labels` - Add labels
- `GET /api/v1/issues/:key/transitions` - Get available transitions
- `POST /api/v1/issues/:key/transition` - Transition issue

**Project Endpoints:**
- `GET /api/v1/projects/:key` - Get project
- `GET /api/v1/projects/:key/versions` - Get project versions
- `POST /api/v1/projects/:key/versions` - Create version
- `GET /api/v1/projects/:key/issue-types` - Get issue types
- `GET /api/v1/projects/:key/issue-type-names` - Get issue type names
- `GET /api/v1/projects/:key/issue-types/:typeName/exists` - Check if type exists

#### Example API Calls

**Create an issue:**
```bash
curl -X POST http://localhost:3000/api/v1/issues \
  -H "X-API-Key: your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "projectKey": "PROJ",
    "issueTypeName": "Bug",
    "summary": "Critical bug in production",
    "description": "System crashes on startup",
    "assigneeEmail": "developer@company.com",
    "labels": ["urgent", "production"]
  }'
```

**Search issues:**
```bash
curl -X POST http://localhost:3000/api/v1/issues/search \
  -H "X-API-Key: your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "jql": "project = PROJ AND status = \"In Progress\"",
    "maxResults": 50
  }'
```

**Get user:**
```bash
curl http://localhost:3000/api/v1/users/john@example.com \
  -H "X-API-Key: your-secret-key"
```

#### Server Configuration

Environment variables:
- `SERVER_HOST` - Host to bind (default: `0.0.0.0`)
- `SERVER_PORT` - Port to listen (default: `3000`)
- `API_KEY` - API key for authentication (default: `dev-key-change-me`)
- `JIRA_BASE_URL` - JIRA instance URL (required)
- `JIRA_EMAIL` - JIRA user email (required)
- `JIRA_API_TOKEN` - JIRA API token (required)

### SDK Client

The SDK client provides a typed HTTP client for programmatically accessing the REST server.

#### Installation & Setup

```typescript
import { SDKClient } from 'jira-api/sdk';

const sdk = new SDKClient({
  baseUrl: 'http://localhost:3000',
  apiKey: 'your-server-api-key',
  timeout: 30000,        // Optional: request timeout (default: 30s)
  maxRetries: 3,         // Optional: max retry attempts (default: 3)
  retryDelay: 1000,      // Optional: initial retry delay (default: 1s)
  maxConnections: 10,    // Optional: connection pool size (default: 10)
});
```

#### User Operations

```typescript
// Get user by email or account ID
const user = await sdk.getUser('john@example.com');
const user2 = await sdk.getUser('5b10ac8d82e05b22cc7d4ef5');

// Search users
const users = await sdk.searchUsers('john', 50);

// Find assignable users for projects
const assignable = await sdk.findAssignableUsers(['PROJ1', 'PROJ2']);

// Resolve email to account ID
const accountId = await sdk.resolveToAccountId('john@example.com');
```

#### Issue Operations

```typescript
// Get issue
const issue = await sdk.getIssue('PROJ-123');

// Search issues with JQL
const issues = await sdk.searchIssues('project = PROJ AND status = "In Progress"', 50);

// Create issue
const newIssue = await sdk.createIssue({
  projectKey: 'PROJ',
  issueTypeName: 'Bug',
  summary: 'Critical bug in production',
  description: 'System crashes on startup',
  assigneeEmail: 'developer@company.com',
  labels: ['urgent', 'production'],
});

// Update issue
await sdk.updateIssue('PROJ-123', {
  summary: 'Updated summary',
  description: 'Updated description',
});

// Assign/unassign issue
await sdk.assignIssue('PROJ-123', 'developer@company.com');
await sdk.unassignIssue('PROJ-123');

// Manage labels
await sdk.addLabels('PROJ-123', ['reviewed', 'tested']);

// Get available transitions
const transitions = await sdk.getTransitions('PROJ-123');

// Transition issue
await sdk.transitionIssue('PROJ-123', 'In Progress', 'Starting work');
```

#### Project Operations

```typescript
// Get project
const project = await sdk.getProject('PROJ');

// Get project versions
const allVersions = await sdk.getProjectVersions('PROJ');
const released = await sdk.getProjectVersions('PROJ', true);
const unreleased = await sdk.getProjectVersions('PROJ', false);

// Create version
const version = await sdk.createVersion('PROJ', {
  name: 'v1.0.0',
  description: 'First release',
  releaseDate: '2025-12-31',
});

// Get issue types
const issueTypes = await sdk.getIssueTypes('PROJ');
const typeNames = await sdk.getIssueTypeNames('PROJ');

// Check if issue type exists
const hasbugs = await sdk.issueTypeExists('PROJ', 'Bug');
```

#### Health & Metrics

```typescript
// Check server health
const health = await sdk.health();
console.log(health.status); // "ok"

// Check readiness
const ready = await sdk.ready();
console.log(ready.ready); // true

// Get server metrics
const metrics = await sdk.metrics();
console.log(metrics.memory, metrics.cpu, metrics.uptime);
```

#### Features

- **Connection Pooling**: Reuses HTTP connections for better performance
- **Automatic Retries**: Retries failed requests with exponential backoff
- **TypeScript Support**: Fully typed requests and responses
- **Error Handling**: Throws descriptive errors with HTTP status codes
- **Configurable**: Timeout, retry logic, and connection limits

#### Example: Complete Workflow

```typescript
import { SDKClient } from 'jira-api/sdk';

const sdk = new SDKClient({
  baseUrl: 'http://localhost:3000',
  apiKey: process.env.API_KEY!,
});

// Create an issue
const issue = await sdk.createIssue({
  projectKey: 'PROJ',
  issueTypeName: 'Bug',
  summary: 'Critical bug',
  description: 'Detailed description',
  assigneeEmail: 'dev@company.com',
  labels: ['urgent'],
});

console.log(`Created issue: ${issue.key}`);

// Update it
await sdk.updateIssue(issue.key, {
  summary: 'Critical bug - UPDATED',
});

// Transition it
await sdk.transitionIssue(issue.key, 'In Progress', 'Started working on this');

// Add labels
await sdk.addLabels(issue.key, ['reviewed']);

console.log('Issue workflow completed!');
```

## Enhanced Features

### JQL Query Builder

Build type-safe JIRA Query Language (JQL) queries with a fluent API:

```typescript
import { jql, JQLQueryBuilder } from 'jira-api';

// Build a query
const query = jql()
  .project('PROJ')
  .status(['In Progress', 'Open'])
  .assignee('currentUser()')
  .createdAfter('-7d')
  .orderBy('created', 'DESC')
  .build();

// Result: "project = PROJ AND status IN ("In Progress", "Open") AND assignee = currentUser() AND created >= -7d ORDER BY created DESC"

// OR conditions
const query2 = jql()
  .project('PROJ')
  .or((builder) => {
    builder
      .status('Open')
      .priority('High');
  })
  .build();

// Convenience methods
const myIssues = jql()
  .currentUser()  // assignee = currentUser()
  .status('In Progress')
  .build();

// Text search
const searchQuery = jql()
  .project('PROJ')
  .text('bug')  // Searches in summary and description
  .build();
```

### Caching Layer

Improve performance with in-memory or Redis caching:

```typescript
import { initializeCache, getCache } from 'jira-api';

// Initialize with memory cache (default)
const cache = initializeCache({
  type: 'memory',
  ttl: 300,  // 5 minutes
  maxMemoryItems: 1000,
});

// Or use Redis
const redisCache = initializeCache({
  type: 'redis',
  redisUrl: 'redis://localhost:6379',
  ttl: 300,
});

// Use cache
await cache.set('user:john@example.com', userData, 300);
const user = await cache.get('user:john@example.com');

// Wrap functions with automatic caching
const user = await cache.wrap(
  'user:john@example.com',
  () => userService.getUserByEmail('john@example.com'),
  300  // TTL in seconds
);

// Generate cache keys
const key = cache.key('project', 'PROJ', 'version', '1.0');
// Result: "project:PROJ:version:1.0"

// Clear cache
await cache.clear();
await cache.del('user:john@example.com');
```

### Webhook Support

Process JIRA webhook events with type-safe handlers:

```typescript
import { getWebhookManager, WebhookEventType } from 'jira-api';

// Initialize webhook manager
const webhookManager = getWebhookManager();

// Register event handlers
webhookManager.on(WebhookEventType.ISSUE_CREATED, (event) => {
  console.log(`Issue created: ${event.issue?.key}`);
  console.log(`By: ${event.user?.displayName}`);
});

webhookManager.on(WebhookEventType.ISSUE_UPDATED, (event) => {
  if (event.changelog) {
    const changes = WebhookManager.getChangeSummary(event.changelog);
    console.log('Changes:', changes);

    if (WebhookManager.statusChanged(event.changelog)) {
      const newStatus = WebhookManager.getNewStatus(event.changelog);
      console.log(`Status changed to: ${newStatus}`);
    }
  }
});

// Wildcard handler for all events
webhookManager.on('*', (event) => {
  console.log(`Event: ${event.webhookEvent}`);
});

// Process incoming webhook (in your REST server)
app.post('/webhooks', async (req, res) => {
  try {
    await webhookManager.processEvent(
      req.body,
      req.headers['x-hub-signature']  // Optional signature verification
    );
    res.send({ success: true });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});
```

#### Webhook REST Endpoints

The REST server provides webhook endpoints:

```bash
# Handle incoming webhook from JIRA
POST /api/v1/webhooks

# Register webhook configuration
POST /api/v1/webhooks/register

# Get supported event types
GET /api/v1/webhooks/events

# Test webhook handling
POST /api/v1/webhooks/test
```

### Batch Operations

Process multiple operations efficiently with concurrency control and automatic retries:

```typescript
import { createBatchProcessor } from 'jira-api';

const batchProcessor = createBatchProcessor(issueService);

// Create multiple issues
const createResult = await batchProcessor.createIssues(
  [
    {
      projectKey: 'PROJ',
      issueTypeName: 'Bug',
      summary: 'Bug 1',
    },
    {
      projectKey: 'PROJ',
      issueTypeName: 'Task',
      summary: 'Task 1',
    },
  ],
  {
    concurrency: 5,        // Process 5 at a time
    continueOnError: true, // Continue if one fails
    retries: 2,            // Retry failed operations
    retryDelay: 1000,      // 1 second between retries
  }
);

console.log(`Created ${createResult.successCount} issues`);
console.log(`Failed: ${createResult.failureCount}`);
createResult.failures.forEach(f => {
  console.log(`Issue ${f.index} failed: ${f.error.message}`);
});

// Update multiple issues
await batchProcessor.updateIssues([
  { key: 'PROJ-1', summary: 'Updated summary 1' },
  { key: 'PROJ-2', description: 'Updated description 2' },
]);

// Assign multiple issues
await batchProcessor.assignIssues([
  { key: 'PROJ-1', email: 'dev1@company.com' },
  { key: 'PROJ-2', email: 'dev2@company.com' },
]);

// Add labels to multiple issues
await batchProcessor.addLabelsToIssues([
  { key: 'PROJ-1', labels: ['urgent', 'reviewed'] },
  { key: 'PROJ-2', labels: ['tested'] },
]);

// Transition multiple issues
await batchProcessor.transitionIssues([
  { key: 'PROJ-1', transitionName: 'In Progress', comment: 'Starting work' },
  { key: 'PROJ-2', transitionName: 'Done', comment: 'Completed' },
]);

// Unassign multiple issues
await batchProcessor.unassignIssues(['PROJ-1', 'PROJ-2', 'PROJ-3']);
```

#### Batch REST Endpoints

The REST server provides batch operation endpoints:

```bash
# Create multiple issues
POST /api/v1/batch/issues/create

# Update multiple issues
POST /api/v1/batch/issues/update

# Assign multiple issues
POST /api/v1/batch/issues/assign

# Unassign multiple issues
POST /api/v1/batch/issues/unassign

# Add labels to multiple issues
POST /api/v1/batch/issues/labels

# Transition multiple issues
POST /api/v1/batch/issues/transition
```

Example batch create request:

```bash
curl -X POST http://localhost:3000/api/v1/batch/issues/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "issues": [
      {
        "projectKey": "PROJ",
        "issueTypeName": "Bug",
        "summary": "Bug 1",
        "description": "Description 1"
      },
      {
        "projectKey": "PROJ",
        "issueTypeName": "Task",
        "summary": "Task 1"
      }
    ],
    "options": {
      "concurrency": 5,
      "continueOnError": true,
      "retries": 2
    }
  }'
```

## Architecture

The module provides four distinct interfaces to the same core functionality:

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACES                          │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Direct Import│     CLI      │ REST Server  │   SDK Client   │
│  (Library)   │  (Commands)  │   (Fastify)  │  (HTTP Client) │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬───────┘
       │              │              │                │
       └──────────────┴──────────────┴────────────────┘
                              │
       ┌──────────────────────┴───────────────────────┐
       │           CORE LAYER                          │
       │            JiraClient (HTTP)                  │
       └──────────────────────┬───────────────────────┘
                              │
       ┌──────────────────────┴───────────────────────┐
       │            MODEL LAYER                        │
       │    User │ Issue │ Project │ Types (Zod)     │
       └──────────────────────────────────────────────┘
```

## API Documentation

### Service Layer (Recommended)

The service layer provides high-level, user-friendly operations with email-based lookups and human-readable type names.

#### UserService

```typescript
import { JiraClient, UserService } from 'jira-api';

const client = new JiraClient({
  baseUrl: process.env.JIRA_BASE_URL!,
  email: process.env.JIRA_EMAIL!,
  apiToken: process.env.JIRA_API_TOKEN!,
});

const userService = new UserService(client);

// Get user by email
const user = await userService.getUserByEmail('john.doe@example.com');

// Smart identifier lookup (works with email or account ID)
const user2 = await userService.getUserByIdentifier('john@example.com');

// Search users
const users = await userService.searchUsers('john', 50);

// Find assignable users for projects
const assignable = await userService.findAssignableUsersForProjects(['PROJ1', 'PROJ2']);

// Resolve email to account ID
const accountId = await userService.resolveToAccountId('john@example.com');
```

#### IssueService

```typescript
import { JiraClient, UserService, IssueService } from 'jira-api';

const client = new JiraClient({ /* config */ });
const userService = new UserService(client);
const issueService = new IssueService(client, userService);

// Create issue with human-readable type name
const issue = await issueService.createIssueByTypeName({
  projectKey: 'PROJ',
  issueTypeName: 'Bug',  // Use "Bug" instead of ID "10001"
  summary: 'Critical bug in production',
  description: 'System crashes on startup',
  assigneeEmail: 'developer@company.com',  // Use email instead of account ID
  labels: ['urgent', 'production'],
});

// Convenience methods
const bug = await issueService.createBug('PROJ', 'Bug summary', 'Description');
const task = await issueService.createTask('PROJ', 'Task summary');
const story = await issueService.createStory('PROJ', 'Story summary');

// Update issue
await issueService.updateIssueSummary('PROJ-123', 'New summary');
await issueService.updateIssueDescription('PROJ-123', 'New description');

// Label management
await issueService.addLabelsToIssue('PROJ-123', ['reviewed', 'tested']);
await issueService.removeLabelsFromIssue('PROJ-123', ['draft']);

// Assignment (email-based)
await issueService.assignIssueByEmail('PROJ-123', 'developer@company.com');
await issueService.unassignIssue('PROJ-123');

// Transitions (name-based)
const transitions = await issueService.getAvailableTransitions('PROJ-123');
await issueService.transitionIssueByName('PROJ-123', 'In Progress', 'Starting work');

// Search
const issues = await issueService.searchIssues('project = PROJ AND status = "In Progress"');

// Bulk operations
const result = await issueService.bulkCreateIssues([
  { projectKey: 'PROJ', issueTypeName: 'Bug', summary: 'Bug 1' },
  { projectKey: 'PROJ', issueTypeName: 'Bug', summary: 'Bug 2' },
], 5); // concurrency limit

console.log(`Created: ${result.successful.length}, Failed: ${result.failed.length}`);
```

#### ProjectService

```typescript
import { JiraClient, ProjectService } from 'jira-api';

const client = new JiraClient({ /* config */ });
const projectService = new ProjectService(client);

// Get project
const project = await projectService.getProject('PROJ');

// Version management
const versions = await projectService.getProjectVersions('PROJ');
const released = await projectService.getReleasedVersions('PROJ');
const unreleased = await projectService.getUnreleasedVersions('PROJ');

// Create version
const version = await projectService.createVersion('PROJ', {
  name: 'v1.0.0',
  description: 'First release',
  releaseDate: '2025-12-31',
});

// Get version by name
const v1 = await projectService.getVersionByName('PROJ', 'v1.0.0');

// Issue types
const issueTypes = await projectService.getIssueTypes('PROJ');
const typeNames = await projectService.getIssueTypeNames('PROJ');
const bugType = await projectService.getIssueTypeByName('PROJ', 'Bug');

// Check if type exists
const hasBugs = await projectService.issueTypeExists('PROJ', 'Bug');
```

### Core Client

The `JiraClient` class provides low-level access to JIRA Cloud API v3:

```typescript
import { JiraClient, type JiraClientConfig } from 'jira-api';

const config: JiraClientConfig = {
  baseUrl: 'https://your-domain.atlassian.net',
  email: 'your-email@domain.com',
  apiToken: 'your-api-token',
  timeout: 30000,          // Optional: request timeout (default: 30s)
  maxRetries: 3,           // Optional: max retry attempts (default: 3)
  retryDelay: 1000,        // Optional: initial retry delay (default: 1s)
  maxConnections: 10,      // Optional: connection pool size (default: 10)
  rateLimit: 100,          // Optional: requests per minute (default: 100)
};

const client = new JiraClient(config);
```

### User Operations

```typescript
// Get user by account ID
const user = await client.getUser('5b10ac8d82e05b22cc7d4ef5');

// Search users
const results = await client.searchUsers('john', 50);

// Find assignable users for project
const assignableUsers = await client.findAssignableUsers('PROJ');
```

### Issue Operations

```typescript
// Create issue
const issue = await client.createIssue({
  fields: {
    project: { key: 'PROJ' },
    issuetype: { id: '10001' },
    summary: 'Bug in production',
    description: textToADF('Detailed description'),
  },
});

// Get issue
const issue = await client.getIssue('PROJ-123');

// Update issue
await client.updateIssue('PROJ-123', {
  fields: { summary: 'Updated summary' },
});

// Assign issue
await client.assignIssue('PROJ-123', 'accountId');

// Get transitions
const transitions = await client.getIssueTransitions('PROJ-123');

// Transition issue
await client.transitionIssue('PROJ-123', {
  transition: { id: '21' },
});

// Search issues with JQL
const results = await client.searchIssues('project = PROJ AND status = "In Progress"');
```

### Project Operations

```typescript
// Get project
const project = await client.getProject('PROJ');

// Get project versions
const versions = await client.getProjectVersions('PROJ');

// Create version
const version = await client.createProjectVersion('PROJ', {
  name: 'v1.0.0',
  description: 'First release',
  releaseDate: '2025-12-31',
});

// Get issue types
const issueTypes = await client.getIssueTypes();

// Get issue type ID by name
const bugTypeId = await client.getIssueTypeIdByName('PROJ', 'Bug');
```

## Utilities

### ADF (Atlassian Document Format)

```typescript
import { textToADF, markdownToADF, adfToText } from 'jira-api';

// Convert plain text to ADF
const adf = textToADF('Simple text description');

// Convert markdown to ADF
const adf = markdownToADF('# Heading\n- List item 1\n- List item 2');

// Convert ADF to plain text
const text = adfToText(adf);
```

### Configuration

```typescript
import { loadConfig, saveConfig, getRequiredEnvVars } from 'jira-api';

// Load configuration from env vars and config file
const config = await loadConfig();

// Save configuration to file (non-sensitive data only)
await saveConfig({
  baseUrl: 'https://your-domain.atlassian.net',
  email: 'your-email@domain.com',
});

// Get required environment variables
const { baseUrl, email, apiToken } = getRequiredEnvVars();
```

### Logging

```typescript
import { createLogger, getLogger } from 'jira-api';

// Create logger with configuration
const logger = createLogger({ level: 'debug', pretty: true });

// Get global logger instance
const logger = getLogger();

// Log messages
logger.info('Operation successful');
logger.error({ err: error }, 'Operation failed');
```

## Error Handling

The module provides a comprehensive error hierarchy:

```typescript
import {
  JiraAPIError,
  JiraAuthenticationError,
  JiraPermissionError,
  JiraNotFoundError,
  JiraValidationError,
  JiraRateLimitError,
  JiraServerError,
  isJiraError,
  isAuthError,
  isRateLimitError,
} from 'jira-api';

try {
  await client.getIssue('PROJ-123');
} catch (error) {
  if (isAuthError(error)) {
    console.error('Authentication failed - check your API token');
  } else if (isRateLimitError(error)) {
    console.error(`Rate limited - retry after ${error.retryAfter}s`);
  } else if (isJiraError(error)) {
    console.error(`JIRA API error: ${error.message} (${error.statusCode})`);
  } else {
    throw error;
  }
}
```

## Development

### Setup

```bash
cd node
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Lint & Format

```bash
# Lint
npm run lint

# Lint and fix
npm run lint:fix

# Format
npm run format

# Type check
npm run typecheck
```

## Project Status: All Milestones Complete! 🎉

**Completed (M1 through M8):**
- ✅ **M1**: Project tooling (TypeScript, tsup, ESLint, Prettier, Vitest)
- ✅ **M1**: JiraClient core HTTP client with retry/rate limiting
- ✅ **M1**: Domain types (User, Issue, Project) with Zod validation
- ✅ **M1**: Configuration management with env var support
- ✅ **M1**: Error hierarchy with HTTP status mapping
- ✅ **M1**: Pino logger with structured logging
- ✅ **M1**: ADF utilities for rich text formatting
- ✅ **M2**: UserService with email-based user operations
- ✅ **M2**: IssueService with human-readable type names
- ✅ **M2**: Bulk operations (bulkCreateIssues, bulkUpdateIssues)
- ✅ **M2**: ProjectService with version management
- ✅ **M2**: Email-to-accountId resolution
- ✅ **M2**: Name-based transitions and type resolution
- ✅ **M2**: Unit tests with 88.84% service coverage
- ✅ **M3**: Commander.js-based CLI entry point
- ✅ **M3**: Interactive configuration wizard (inquirer)
- ✅ **M3**: Issue commands (create, get, update, assign, transition, search)
- ✅ **M3**: User commands (search, get, assignable, resolve)
- ✅ **M3**: Project commands (get, versions, issue-types)
- ✅ **M3**: Table/JSON output formatting (cli-table3, chalk)
- ✅ **M3**: Interactive prompts for create operations
- ✅ **M3**: Global options (--json, --debug, --help)
- ✅ **M4**: Fastify REST API server with CORS and rate limiting
- ✅ **M4**: OpenAPI/Swagger documentation at /docs
- ✅ **M4**: Authentication middleware (API key validation)
- ✅ **M4**: Health check and metrics endpoints
- ✅ **M4**: User, Issue, and Project REST endpoints
- ✅ **M4**: Request/response validation with JSON schemas
- ✅ **M4**: Comprehensive error handling middleware
- ✅ **M5**: SDKClient for programmatic REST API access
- ✅ **M5**: Fully typed user, issue, and project SDK methods
- ✅ **M5**: Connection pooling with HTTP keep-alive
- ✅ **M5**: Automatic retry logic with exponential backoff
- ✅ **M5**: Health and metrics SDK methods
- ✅ **M6**: JQL Query Builder with fluent API
- ✅ **M6**: Caching layer (in-memory and Redis support)
- ✅ **M6**: Webhook support for JIRA events (12 event types)
- ✅ **M6**: Webhook REST endpoints and signature verification
- ✅ **M6**: Batch operations with concurrency control
- ✅ **M6**: Batch REST endpoints for all operations
- ✅ **M6**: Automatic retry logic for batch operations
- ✅ **M6**: Comprehensive TypeScript types and exports
- ✅ **M7**: Comprehensive test suite for all enhanced features
- ✅ **M7**: 236 unit tests with 100% pass rate
- ✅ **M7**: Performance benchmarks for query builder and cache
- ✅ **M7**: TypeDoc configuration for API documentation
- ✅ **M8**: GitHub Actions CI/CD workflow
- ✅ **M8**: Docker and Docker Compose configuration
- ✅ **M8**: Production deployment ready
- ✅ **M8**: Environment configuration examples

**Test Results:**
- ✅ 236 tests passing (100% pass rate!)
- ✅ 11 test files (all passing)
- ✅ Service coverage: 88.84%
  - IssueService: 88.76%
  - ProjectService: 98.93%
  - UserService: 79.27%
- ✅ Enhanced features fully tested:
  - Query Builder: 37 tests
  - Cache: 29 tests
  - Webhooks: 33 tests
  - Batch Operations: 23 tests

**Project Complete - Ready for Production!** 🚀

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.3.0
- JIRA Cloud account with API access

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.

## Acknowledgments

- Based on Python implementation architecture
- Built with modern TypeScript best practices
- Follows JIRA Cloud API v3 specifications
