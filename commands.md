# JIRA API Module - Usage Commands

This document provides comprehensive usage examples for all four interfaces of the JIRA API module.

## 🔧 Installation

```bash
pip install jira-api
```

## 1. 🐍 Direct Import Interface

Use the JIRA API directly in your Python code.

### Basic Setup

```python
from jira_api import JiraClient
from jira_api.models.issue import IssueCreate
from jira_api.exceptions import JiraAPIError

# Initialize client
client = JiraClient(
    base_url="https://company.atlassian.net",
    email="your-email@company.com",
    api_token="your-api-token"
)

# Or use as context manager (recommended)
with JiraClient("https://company.atlassian.net", "email@company.com", "token") as client:
    # Your operations here
    pass
```

### User Operations

```python
# Get user by account ID
user = client.get_user("5b10ac8d82e05b22cc7d4ef5")
print(f"User: {user.display_name} ({user.email_address})")

# Search users
users = client.search_users("john", max_results=10)
for user in users:
    print(f"Found: {user.display_name}")

# Find assignable users for projects
assignable = client.find_assignable_users(["PROJ", "TEST"], query="developer")
```

### Issue Operations

#### Creating Issues - Two Ways

```python
# Method 1: Using issue type ID (traditional way)
issue_data = IssueCreate(
    project_id="10000",
    summary="Critical bug in login system",
    description="Users cannot log in after the latest update",
    issue_type_id="10001",  # Bug ID - requires knowing the specific ID
    priority_id="2",        # High
    assignee_account_id="5b10ac8d82e05b22cc7d4ef5",
    labels=["bug", "urgent", "login"]
)
issue = client.create_issue(issue_data)
print(f"Created issue: {issue.key}")

# Method 2: Using issue type name (new way - recommended)
from jira_api.services import IssueService

issue_service = IssueService(client)
issue = issue_service.create_issue_by_type_name(
    project_key="PROJ",
    summary="Critical bug in login system",
    issue_type_name="Bug",  # Human-readable name
    description="Users cannot log in after the latest update",
    assignee_email="developer@company.com",  # Can use email instead of account ID
    labels=["bug", "urgent", "login"]
)
print(f"Created issue: {issue.key}")

# List available issue types for a project
issue_types = client.get_project_issue_types("PROJ")
for issue_type in issue_types:
    print(f"ID: {issue_type['id']}, Name: {issue_type['name']}")

# Get issue type ID by name
issue_type_id = client.get_issue_type_id_by_name("PROJ", "Bug")
print(f"Bug issue type ID: {issue_type_id}")

# Get issue details
issue = client.get_issue("KAN-123")
print(f"Issue: {issue.fields.summary}")
print(f"Status: {issue.fields.status.name}")
print(f"Assignee: {issue.fields.assignee.display_name if issue.fields.assignee else 'Unassigned'}")

# Update issue
from jira_api.models.issue import IssueUpdate

update_data = IssueUpdate(
    summary="Updated: Critical bug in login system",
    labels_add=["reviewed"],
    labels_remove=["urgent"]
)
client.update_issue("KAN-123", update_data)

# Assign issue
from jira_api.models.issue import IssueAssignment

assignment = IssueAssignment(account_id="5b10ac8d82e05b22cc7d4ef5")
client.assign_issue("KAN-123", assignment)

# Get available transitions
transitions = client.get_issue_transitions("KAN-123")
for transition in transitions:
    print(f"Transition: {transition.name} -> {transition.to.name}")

# Transition issue
from jira_api.models.issue import IssueTransitionRequest

transition_request = IssueTransitionRequest(
    transition_id="31",
    comment="Moving to In Progress as development starts",
    resolution_name=None
)
client.transition_issue("KAN-123", transition_request)
```

### Project Operations

```python
# Get project details
project = client.get_project("PROJ")
print(f"Project: {project.name} ({project.key})")
print(f"Lead: {project.lead.get('displayName', 'No lead') if project.lead else 'No lead'}")

# Get project versions
versions = client.get_project_versions("PROJ")
for version in versions:
    status = "Released" if version.released else "Unreleased"
    print(f"Version: {version.name} ({status})")

# Create project version
from jira_api.models.project import ProjectVersionCreate

version_data = ProjectVersionCreate(
    name="Version 2.1.0",
    description="Minor feature release",
    project_id=10000,
    start_date="2025-01-01",
    release_date="2025-03-01"
)
version = client.create_project_version(version_data)
print(f"Created version: {version.name}")

# Get issue types
issue_types = client.get_issue_types()
for issue_type in issue_types:
    print(f"Issue Type: {issue_type['name']} (ID: {issue_type['id']})")
```

## 2. 💻 Command Line Interface (CLI)

Use the powerful CLI for interactive operations.

### Initial Configuration

```bash
# Configure JIRA credentials (interactive)
jira-api configure

# This will prompt for:
# - JIRA base URL (e.g., https://company.atlassian.net)
# - Your email address
# - API token
```

### User Commands

```bash
# Search for users
jira-api user search "rob"
jira-api user search "developer" --max 20

# Get specific user details
jira-api user get "robmarte@gmail.com"
jira-api user get "5b10ac8d82e05b22cc7d4ef5"
```

### Issue Commands

```bash
# Get issue details
jira-api issue get KAN-123
jira-api issue get KAN-123 --json  # JSON output

# List available issue types for a project
jira-api issue list-types KAN

# Create new issue using issue type name (recommended)
jira-api issue create-by-name \
  --project KAN \
  --summary "Fix critical database connection bug" \
  --type-name "Bug" \
  --description "Database connections are timing out under load" \
  --assignee "developer@company.com" \
  --labels "bug,database,critical"

# Create new issue using issue type ID (traditional way)
jira-api issue create \
  --project KAN \
  --summary "Fix critical database connection bug" \
  --type 10001 \
  --description "Database connections are timing out under load" \
  --assignee "developer@company.com" \
  --labels "bug,database,critical"

# Update issue
jira-api issue update KAN-123 --summary "Updated: Database connection issue resolved"
jira-api issue update KAN-123 --add-labels "reviewed,tested"
jira-api issue update KAN-123 --remove-labels "critical"

# Assign issue
jira-api issue assign KAN-123 "john@company.com"

# List available transitions
jira-api issue transitions KAN-123

# Transition issue
jira-api issue transition KAN-123 "In Progress" --comment "Starting development work"
jira-api issue transition KAN-123 "Done" --comment "Issue resolved" --resolution "Fixed"
```

### Project Commands

```bash
# Get project details
jira-api project get PROJ
jira-api project get KAN --versions  # Include versions

# Create project version
jira-api project create-version KAN "v2.1.0" --description "Minor feature release"
```

### Server Management

```bash
# Start the FastAPI server
jira-api server
jira-api server --host 0.0.0.0 --port 8080 --reload

# Alternative server start
jira-server  # Uses default settings from environment
```

## 3. 🌐 REST API Server

Start and interact with the FastAPI server.

### Start Server

```bash
# Using environment variables
export JIRA_BASE_URL="https://company.atlassian.net"
export JIRA_EMAIL="your-email@company.com"
export JIRA_API_TOKEN="your-api-token"
export SERVER_API_KEY="your-server-api-key"  # Optional

# Start server
jira-api server --host 0.0.0.0 --port 8000

# Or use uvicorn directly
uvicorn jira_api.server:app --host 0.0.0.0 --port 8000 --reload
```

### API Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Search users
curl "http://localhost:8000/users/search?query=john&max_results=10" \
  -u "your-api-key:"

# Get user
curl "http://localhost:8000/users/john@company.com" \
  -u "your-api-key:"

# Create issue
curl -X POST "http://localhost:8000/issues" \
  -H "Content-Type: application/json" \
  -u "your-api-key:" \
  -d '{
    "project_id": "10000",
    "summary": "API created issue",
    "issue_type_id": "10001",
    "description": "This issue was created via REST API",
    "labels": ["api", "automation"]
  }'

# Get issue
curl "http://localhost:8000/issues/KAN-123" \
  -u "your-api-key:"

# Update issue
curl -X PATCH "http://localhost:8000/issues/KAN-123" \
  -H "Content-Type: application/json" \
  -u "your-api-key:" \
  -d '{
    "summary": "Updated via API",
    "labels_add": ["updated"]
  }'

# Assign issue
curl -X PUT "http://localhost:8000/issues/KAN-123/assign/john@company.com" \
  -u "your-api-key:"

# Get issue transitions
curl "http://localhost:8000/issues/KAN-123/transitions" \
  -u "your-api-key:"

# Transition issue
curl -X POST "http://localhost:8000/issues/KAN-123/transitions" \
  -H "Content-Type: application/json" \
  -u "your-api-key:" \
  -d '{
    "transition_name": "In Progress",
    "comment": "Moving to development"
  }'

# Get project
curl "http://localhost:8000/projects/PROJ" \
  -u "your-api-key:"

# Get project versions
curl "http://localhost:8000/projects/PROJ/versions" \
  -u "your-api-key:"
curl "http://localhost:8000/projects/PROJ/versions?released=true" \
  -u "your-api-key:"

# Create project version
curl -X POST "http://localhost:8000/projects/PROJ/versions" \
  -H "Content-Type: application/json" \
  -u "your-api-key:" \
  -d '{
    "name": "v2.2.0",
    "description": "New API features"
  }'
```

### Interactive API Documentation

Visit `http://localhost:8000/docs` for interactive Swagger documentation where you can test all endpoints.

## 4. 📦 SDK Client

Use the SDK to interact with your REST API server.

### Basic Setup

```python
from jira_api.sdk import JiraSDKClient
from jira_api.models.issue import IssueCreate

# Initialize SDK client
sdk = JiraSDKClient(
    base_url="http://localhost:8000",
    api_key="your-server-api-key"  # Optional
)

# Or use as context manager (recommended)
with JiraSDKClient("http://localhost:8000", api_key="your-key") as sdk:
    # Your operations here
    pass
```

### SDK Operations

```python
# Health check
health = sdk.health_check()
print(f"Server status: {health['status']}")

# User operations
users = sdk.search_users("john", max_results=10)
user = sdk.get_user("john@company.com")

# Issue operations
issue_data = IssueCreate(
    project_id="10000",
    summary="SDK created issue",
    issue_type_id="10001",
    description="Created via SDK client",
    labels=["sdk", "automation"]
)
issue = sdk.create_issue(issue_data)
print(f"Created: {issue.key}")

# Get and update issue
issue = sdk.get_issue("KAN-123")
from jira_api.models.issue import IssueUpdate

update_data = IssueUpdate(summary="Updated via SDK")
result = sdk.update_issue("KAN-123", update_data)

# Assign issue
result = sdk.assign_issue("KAN-123", "john@company.com")

# Transitions
transitions = sdk.get_issue_transitions("KAN-123")
result = sdk.transition_issue("KAN-123", "In Progress", comment="SDK transition")

# Project operations
project = sdk.get_project("PROJ")
versions = sdk.get_project_versions("PROJ", released=False)
version = sdk.create_project_version("PROJ", "v2.3.0", "SDK created version")

# Convenience methods
bug_issue = sdk.create_bug(
    project_id="10000",
    summary="Bug found via SDK",
    description="Automated bug reporting",
    assignee_account_id="5b10ac8d82e05b22cc7d4ef5",
    labels=["automated", "bug"]
)

task_issue = sdk.create_task(
    project_id="10000",
    summary="Automated task creation",
    description="Task created by automation system"
)
```

## 🚀 Environment Variables

For server and automation usage:

```bash
# JIRA Configuration
export JIRA_BASE_URL="https://company.atlassian.net"
export JIRA_EMAIL="your-email@company.com"
export JIRA_API_TOKEN="your-api-token"

# Server Configuration
export SERVER_HOST="0.0.0.0"
export SERVER_PORT="8000"
export SERVER_RELOAD="false"
export SERVER_API_KEY="your-server-api-key"  # Optional security
```

## 🔧 Advanced Usage

### Error Handling

```python
from jira_api.exceptions import JiraAPIError, JiraNotFoundError, SDKError

try:
    issue = client.get_issue("NONEXISTENT-123")
except JiraNotFoundError:
    print("Issue not found")
except JiraAPIError as e:
    print(f"JIRA API error: {e}")
    print(f"Status code: {e.status_code}")
```

### Batch Operations

```python
# Create multiple issues
issues_to_create = [
    IssueCreate(project_id="10000", summary=f"Task {i}", issue_type_id="10001")
    for i in range(1, 6)
]

created_issues = []
for issue_data in issues_to_create:
    try:
        issue = client.create_issue(issue_data)
        created_issues.append(issue)
        print(f"Created: {issue.key}")
    except JiraAPIError as e:
        print(f"Failed to create issue: {e}")
```

### Configuration Management

```python
from jira_api.config import get_config, save_config, JiraConfig

# Load existing config
config = get_config()
if config:
    print(f"Current config: {config.base_url}")

# Save new config
new_config = JiraConfig(
    base_url="https://newcompany.atlassian.net",
    email="new-email@company.com",
    api_token="new-token"
)
save_config(new_config)
```

This comprehensive command reference covers all four interfaces and common usage patterns. Choose the interface that best fits your use case:

- **Direct Import**: For Python applications and scripts
- **CLI**: For interactive use and shell scripting
- **REST Server**: For web applications and microservices
- **SDK Client**: For applications that interact with your API server
