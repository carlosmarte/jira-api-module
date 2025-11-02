# JIRA API - cURL Examples

This document provides curl command examples for authenticating with JIRA Cloud API and checking JIRA status, including proxy configuration.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Authentication](#authentication)
- [Basic Examples](#basic-examples)
- [Proxy Configuration](#proxy-configuration)
- [Advanced Examples](#advanced-examples)
- [Common Operations](#common-operations)

## Prerequisites

### Generate JIRA API Token

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a name and save the generated token

### Required Information

- **Base URL**: Your JIRA instance URL (e.g., `https://your-domain.atlassian.net`)
- **Email**: Your JIRA account email
- **API Token**: The token you generated above

### Environment Variables

Set these for easier command execution:

```bash
export JIRA_BASE_URL="https://your-domain.atlassian.net"
export JIRA_EMAIL="your-email@example.com"
export JIRA_API_TOKEN="your-api-token-here"
```

## Authentication

JIRA Cloud API v3 uses Basic Authentication with email and API token.

### Create Base64 Encoded Credentials

```bash
# Manual encoding
echo -n "your-email@example.com:your-api-token" | base64

# Using environment variables
echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64
```

### Test Authentication

```bash
# Basic authentication test - get current user
curl -X GET \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "$JIRA_BASE_URL/rest/api/3/myself"
```

## Basic Examples

### 1. Check JIRA Server Info (Status Check)

Get server information to verify JIRA is accessible:

```bash
curl -X GET \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "$JIRA_BASE_URL/rest/api/3/serverInfo"
```

**Expected Response:**
```json
{
  "baseUrl": "https://your-domain.atlassian.net",
  "version": "1001.0.0-SNAPSHOT",
  "versionNumbers": [1001, 0, 0],
  "deploymentType": "Cloud",
  "buildNumber": 100XXX,
  "buildDate": "2025-01-01T00:00:00.000+0000",
  "serverTime": "2025-11-02T12:00:00.000+0000",
  "scmInfo": "abc123...",
  "serverTitle": "Your JIRA Instance"
}
```

### 2. Get Current User (Authentication Verification)

```bash
curl -X GET \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "$JIRA_BASE_URL/rest/api/3/myself"
```

**Expected Response:**
```json
{
  "self": "https://your-domain.atlassian.net/rest/api/3/user?accountId=...",
  "accountId": "5b10ac8d82e05b22cc7d4ef5",
  "accountType": "atlassian",
  "emailAddress": "your-email@example.com",
  "displayName": "John Doe",
  "active": true,
  "timeZone": "America/New_York"
}
```

### 3. Simple User Lookup

```bash
curl -X GET \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/3/user?accountId=5b10ac8d82e05b22cc7d4ef5"
```

### 4. Pretty Print JSON Response

```bash
curl -X GET \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/3/myself" | jq '.'
```

## Proxy Configuration

### Using HTTP/HTTPS Proxy

#### Environment Variable Method

```bash
# Set proxy environment variables
export http_proxy="http://proxy.company.com:8080"
export https_proxy="http://proxy.company.com:8080"
export HTTP_PROXY="http://proxy.company.com:8080"
export HTTPS_PROXY="http://proxy.company.com:8080"

# Optional: no proxy for certain domains
export no_proxy="localhost,127.0.0.1,.local"

# Make request (will automatically use proxy)
curl -X GET \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/3/myself"
```

#### Command-Line Proxy Method

```bash
# Using -x or --proxy flag
curl -X GET \
  -x http://proxy.company.com:8080 \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/3/myself"
```

### Proxy with Authentication

```bash
# Proxy with username and password
curl -X GET \
  -x http://proxy.company.com:8080 \
  -U proxyuser:proxypass \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/3/myself"

# Alternative: include credentials in proxy URL
curl -X GET \
  -x http://proxyuser:proxypass@proxy.company.com:8080 \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/3/myself"
```

### SOCKS Proxy

```bash
# SOCKS4 proxy
curl -X GET \
  --socks4 socks-proxy.company.com:1080 \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/3/myself"

# SOCKS5 proxy
curl -X GET \
  --socks5 socks-proxy.company.com:1080 \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/3/myself"
```

### Proxy with SSL/TLS Options

```bash
# Proxy with SSL verification disabled (not recommended for production)
curl -X GET \
  -x http://proxy.company.com:8080 \
  -k \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/3/myself"

# Proxy with custom CA certificate
curl -X GET \
  -x http://proxy.company.com:8080 \
  --cacert /path/to/ca-bundle.crt \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/3/myself"
```

### Complete Proxy Example with Status Check

```bash
# Full example: Check JIRA status through corporate proxy
curl -X GET \
  -x http://proxy.company.com:8080 \
  -U proxyuser:proxypass \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -v \
  "$JIRA_BASE_URL/rest/api/3/serverInfo" | jq '.'
```

## Advanced Examples

### Verbose Mode (Debug Connection Issues)

```bash
# Show detailed connection information
curl -v \
  -x http://proxy.company.com:8080 \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/3/myself"

# Even more verbose (trace)
curl -v --trace-ascii - \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/3/myself"
```

### Timeout Configuration

```bash
# Set connection and max timeout
curl -X GET \
  --connect-timeout 10 \
  --max-time 30 \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/3/myself"
```

### Retry Logic

```bash
# Retry on connection failures (max 3 retries)
curl -X GET \
  --retry 3 \
  --retry-delay 2 \
  --retry-max-time 60 \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/3/myself"
```

### Save Response to File

```bash
# Save response body to file
curl -X GET \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  -o jira-status.json \
  "$JIRA_BASE_URL/rest/api/3/serverInfo"

# Include response headers in output
curl -X GET \
  -i \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/3/myself"
```

## Common Operations

### Search Users

```bash
curl -X GET \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/3/user/search?query=john&maxResults=50"
```

### Get Project

```bash
curl -X GET \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/3/project/PROJ"
```

### Get Issue

```bash
curl -X GET \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/3/issue/PROJ-123"
```

### Search Issues (JQL)

```bash
# URL encode the JQL query
JQL_QUERY="project = PROJ AND status = 'In Progress'"
ENCODED_JQL=$(echo "$JQL_QUERY" | jq -sRr @uri)

curl -X GET \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/3/search?jql=$ENCODED_JQL&maxResults=50"
```

### Create Issue

```bash
curl -X POST \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "fields": {
      "project": {
        "key": "PROJ"
      },
      "issuetype": {
        "id": "10001"
      },
      "summary": "Bug in production",
      "description": {
        "type": "doc",
        "version": 1,
        "content": [
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "System crashes on startup"
              }
            ]
          }
        ]
      }
    }
  }' \
  "$JIRA_BASE_URL/rest/api/3/issue"
```

## Testing Authentication & Connection

### Complete Health Check Script

```bash
#!/bin/bash

# JIRA Health Check with Proxy Support

JIRA_BASE_URL="${JIRA_BASE_URL:-https://your-domain.atlassian.net}"
JIRA_EMAIL="${JIRA_EMAIL:-your-email@example.com}"
JIRA_API_TOKEN="${JIRA_API_TOKEN:-your-api-token}"
PROXY="${HTTP_PROXY:-}"

# Create auth header
AUTH_HEADER="Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)"

# Function to make JIRA request
jira_request() {
  local endpoint=$1
  local proxy_flag=""

  if [ -n "$PROXY" ]; then
    proxy_flag="-x $PROXY"
  fi

  curl -s -w "\n%{http_code}" \
    $proxy_flag \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    "$JIRA_BASE_URL/rest/api/3/$endpoint"
}

echo "=== JIRA Health Check ==="
echo "Base URL: $JIRA_BASE_URL"
echo "Email: $JIRA_EMAIL"
[ -n "$PROXY" ] && echo "Proxy: $PROXY"
echo ""

# Test 1: Server Info
echo "1. Checking server info..."
RESPONSE=$(jira_request "serverInfo")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Server is reachable"
  echo "$BODY" | jq -r '"  Version: \(.version)\n  Deployment: \(.deploymentType)"'
else
  echo "✗ Server check failed (HTTP $HTTP_CODE)"
  echo "$BODY" | jq '.'
  exit 1
fi
echo ""

# Test 2: Authentication
echo "2. Verifying authentication..."
RESPONSE=$(jira_request "myself")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Authentication successful"
  echo "$BODY" | jq -r '"  User: \(.displayName)\n  Email: \(.emailAddress)\n  Account ID: \(.accountId)"'
else
  echo "✗ Authentication failed (HTTP $HTTP_CODE)"
  echo "$BODY" | jq '.'
  exit 1
fi
echo ""

echo "=== All checks passed! ==="
```

### Save and Run the Script

```bash
# Save the script
chmod +x jira-health-check.sh

# Run with environment variables
./jira-health-check.sh

# Or run with inline variables
JIRA_BASE_URL="https://your-domain.atlassian.net" \
JIRA_EMAIL="your-email@example.com" \
JIRA_API_TOKEN="your-token" \
HTTP_PROXY="http://proxy.company.com:8080" \
./jira-health-check.sh
```

## Troubleshooting

### Common Error Codes

- **401 Unauthorized**: Invalid credentials or API token
- **403 Forbidden**: Valid credentials but insufficient permissions
- **404 Not Found**: Resource doesn't exist
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: JIRA server error
- **502/503/504**: Gateway/proxy errors

### Debug Connection Issues

```bash
# Test proxy connectivity
curl -v -x http://proxy.company.com:8080 https://www.google.com

# Test JIRA connectivity without auth
curl -I "$JIRA_BASE_URL"

# Test with verbose output
curl -v \
  -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
  "$JIRA_BASE_URL/rest/api/3/myself"
```

## References

- [JIRA Cloud REST API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/)
- [JIRA Cloud Authentication](https://developer.atlassian.com/cloud/jira/platform/basic-auth-for-rest-apis/)
- [curl Manual](https://curl.se/docs/manual.html)
