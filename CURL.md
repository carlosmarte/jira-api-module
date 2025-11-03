# JIRA On-Premises API - cURL Examples

This document provides curl command examples for authenticating with JIRA On-Premises API (v10.3.8) and checking JIRA status, including proxy configuration.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Authentication](#authentication)
- [Basic Examples](#basic-examples)
- [Proxy Configuration](#proxy-configuration)
- [Advanced Examples](#advanced-examples)
- [Common Operations](#common-operations)
- [On-Premises Specific Operations](#on-premises-specific-operations)

## Prerequisites

### Required Information

- **Base URL**: Your JIRA on-premises instance URL (e.g., `https://jira.company.com`)
- **Username**: Your JIRA username (not email)
- **Authentication**: Either a Personal Access Token (PAT) or password

### Authentication Methods

JIRA on-premises supports two authentication methods:

1. **Personal Access Tokens (PAT)** - Recommended for security
2. **Basic Authentication** - Username and password

### Generate Personal Access Token (Recommended)

Personal Access Tokens are available in JIRA 8.14+ and are the recommended authentication method.

1. Log into your JIRA instance
2. Go to your profile (click your avatar → Profile)
3. Navigate to **Personal Access Tokens** (or go to `https://jira.company.com/secure/ViewProfile.jspa#personal-access-tokens`)
4. Click **Create token**
5. Give it a name and optionally set an expiration date
6. Click **Create** and save the generated token securely

**Note**: The token will only be displayed once. Store it securely.

### Environment Variables

Set these for easier command execution:

#### Using Personal Access Token (Recommended)

```bash
export JIRA_BASE_URL="https://jira.company.com"
export JIRA_PAT="your-personal-access-token-here"
```

#### Using Basic Authentication

```bash
export JIRA_BASE_URL="https://jira.company.com"
export JIRA_USERNAME="your-username"
export JIRA_PASSWORD="your-password"
```

## Authentication

### Personal Access Token (PAT) Authentication

Personal Access Tokens use Bearer authentication:

```bash
# Test authentication with PAT - get current user
curl -X GET \
  -k \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "$JIRA_BASE_URL/rest/api/2/myself"
```

### Basic Authentication

Basic Authentication uses username and password:

#### Create Base64 Encoded Credentials

```bash
# Manual encoding
echo -n "username:password" | base64

# Using environment variables
echo -n "$JIRA_USERNAME:$JIRA_PASSWORD" | base64
```

#### Test Basic Authentication

```bash
# Basic authentication test - get current user
curl -X GET \
  -H "Authorization: Basic $(echo -n "$JIRA_USERNAME:$JIRA_PASSWORD" | base64)" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "$JIRA_BASE_URL/rest/api/2/myself"

# Alternative: using -u flag (curl handles base64 encoding)
curl -X GET \
  -u "$JIRA_USERNAME:$JIRA_PASSWORD" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "$JIRA_BASE_URL/rest/api/2/myself"
```

## Basic Examples

All examples below show both PAT and Basic Auth methods. Choose the one appropriate for your setup.

### 1. Check JIRA Server Info (Status Check)

Get server information to verify JIRA is accessible:

#### Using Personal Access Token

```bash
curl -X GET \
  -k \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "$JIRA_BASE_URL/rest/api/2/serverInfo"
```

#### Using Basic Authentication

```bash
curl -X GET \
  -u "$JIRA_USERNAME:$JIRA_PASSWORD" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "$JIRA_BASE_URL/rest/api/2/serverInfo"
```

**Expected Response:**

```json
{
  "baseUrl": "https://jira.company.com",
  "version": "10.3.8",
  "versionNumbers": [10, 3, 8],
  "deploymentType": "Server",
  "buildNumber": 103008,
  "buildDate": "2024-10-15T00:00:00.000+0000",
  "serverTime": "2025-11-02T12:00:00.000+0000",
  "scmInfo": "abc123...",
  "serverTitle": "Company JIRA"
}
```

### 2. Get Current User (Authentication Verification)

#### Using Personal Access Token

```bash
curl -X GET \
  -k \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "$JIRA_BASE_URL/rest/api/2/myself"
```

#### Using Basic Authentication

```bash
curl -X GET \
  -u "$JIRA_USERNAME:$JIRA_PASSWORD" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "$JIRA_BASE_URL/rest/api/2/myself"
```

**Expected Response:**

```json
{
  "self": "https://jira.company.com/rest/api/2/user?username=jdoe",
  "key": "jdoe",
  "name": "jdoe",
  "emailAddress": "john.doe@company.com",
  "displayName": "John Doe",
  "active": true,
  "timeZone": "America/New_York"
}
```

### 3. Simple User Lookup

#### Using Personal Access Token

```bash
curl -X GET \
  -k \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/user?username=jdoe"
```

#### Using Basic Authentication

```bash
curl -X GET \
  -u "$JIRA_USERNAME:$JIRA_PASSWORD" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/user?username=jdoe"
```

### 4. Pretty Print JSON Response

```bash
# With PAT
curl -X GET \
  -k \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/myself" | jq '.'

# With Basic Auth
curl -X GET \
  -u "$JIRA_USERNAME:$JIRA_PASSWORD" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/myself" | jq '.'
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
export no_proxy="localhost,127.0.0.1,.local,.company.com"

# Make request with PAT (will automatically use proxy)
curl -X GET \
  -k \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/myself"
```

#### Command-Line Proxy Method

```bash
# Using -x or --proxy flag with PAT
curl -X GET \
  -k \
  -x http://proxy.company.com:8080 \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/myself"

# With Basic Auth
curl -X GET \
  -x http://proxy.company.com:8080 \
  -u "$JIRA_USERNAME:$JIRA_PASSWORD" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/myself"
```

### Proxy with Authentication

```bash
# Proxy with username and password + JIRA PAT
curl -X GET \
  -k \
  -x http://proxy.company.com:8080 \
  -U proxyuser:proxypass \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/myself"

# Alternative: include credentials in proxy URL
curl -X GET \
  -k \
  -x http://proxyuser:proxypass@proxy.company.com:8080 \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/myself"
```

### SOCKS Proxy

```bash
# SOCKS4 proxy with PAT
curl -X GET \
  -k \
  --socks4 socks-proxy.company.com:1080 \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/myself"

# SOCKS5 proxy with Basic Auth
curl -X GET \
  --socks5 socks-proxy.company.com:1080 \
  -u "$JIRA_USERNAME:$JIRA_PASSWORD" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/myself"
```

### Proxy with SSL/TLS Options

```bash
# Proxy with SSL verification disabled (not recommended for production)
curl -X GET \
  -x http://proxy.company.com:8080 \
  -k \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/myself"

# Proxy with custom CA certificate
curl -X GET \
  -x http://proxy.company.com:8080 \
  --cacert /path/to/ca-bundle.crt \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/myself"
```

### Complete Proxy Example with Status Check

```bash
# Full example: Check JIRA status through corporate proxy with PAT
curl -X GET \
  -x http://proxy.company.com:8080 \
  -U proxyuser:proxypass \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -v \
  "$JIRA_BASE_URL/rest/api/2/serverInfo" | jq '.'
```

## Advanced Examples

### Verbose Mode (Debug Connection Issues)

```bash
# Show detailed connection information with PAT
curl -v \
  -k \
  -x http://proxy.company.com:8080 \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/myself"

# Even more verbose (trace) with Basic Auth
curl -v --trace-ascii - \
  -u "$JIRA_USERNAME:$JIRA_PASSWORD" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/myself"
```

### Timeout Configuration

```bash
# Set connection and max timeout
curl -X GET \
  -k \
  --connect-timeout 10 \
  --max-time 30 \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/myself"
```

### Retry Logic

```bash
# Retry on connection failures (max 3 retries)
curl -X GET \
  -k \
  --retry 3 \
  --retry-delay 2 \
  --retry-max-time 60 \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/myself"
```

### Save Response to File

```bash
# Save response body to file with PAT
curl -X GET \
  -k \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  -o jira-status.json \
  "$JIRA_BASE_URL/rest/api/2/serverInfo"

# Include response headers in output
curl -X GET \
  -i \
  -u "$JIRA_USERNAME:$JIRA_PASSWORD" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/myself"
```

## Common Operations

### Search Users

```bash
# With PAT
curl -X GET \
  -k \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/user/search?username=john&maxResults=50"

# With Basic Auth
curl -X GET \
  -u "$JIRA_USERNAME:$JIRA_PASSWORD" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/user/search?username=john&maxResults=50"
```

### Get Project

```bash
# With PAT
curl -X GET \
  -k \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/project/PROJ"

# With Basic Auth
curl -X GET \
  -u "$JIRA_USERNAME:$JIRA_PASSWORD" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/project/PROJ"
```

### Get Issue

```bash
# With PAT
curl -X GET \
  -k \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/issue/PROJ-123"

# With Basic Auth
curl -X GET \
  -u "$JIRA_USERNAME:$JIRA_PASSWORD" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/issue/PROJ-123"
```

### Search Issues (JQL)

```bash
# URL encode the JQL query
JQL_QUERY="project = PROJ AND status = 'In Progress'"
ENCODED_JQL=$(echo "$JQL_QUERY" | jq -sRr @uri)

# With PAT
curl -X GET \
  -k \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/search?jql=$ENCODED_JQL&maxResults=50"

# With Basic Auth
curl -X GET \
  -u "$JIRA_USERNAME:$JIRA_PASSWORD" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/search?jql=$ENCODED_JQL&maxResults=50"
```

### Create Issue

```bash
# With PAT
curl -X POST \
  -k \
  -H "Authorization: Bearer $JIRA_PAT" \
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
      "description": "System crashes on startup"
    }
  }' \
  "$JIRA_BASE_URL/rest/api/2/issue"

# With Basic Auth
curl -X POST \
  -u "$JIRA_USERNAME:$JIRA_PASSWORD" \
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
      "description": "System crashes on startup"
    }
  }' \
  "$JIRA_BASE_URL/rest/api/2/issue"
```

## On-Premises Specific Operations

### Get Application Properties

Get system-level configuration information:

```bash
# With PAT
curl -X GET \
  -k \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/application-properties"
```

### Get All Projects (Visible to User)

```bash
# With PAT
curl -X GET \
  -k \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/project"

# With Basic Auth
curl -X GET \
  -u "$JIRA_USERNAME:$JIRA_PASSWORD" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/project"
```

### Get System Configuration

Requires administrator permissions:

```bash
# With PAT (admin required)
curl -X GET \
  -k \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/configuration"
```

### Health Check Endpoint

Check system health status:

```bash
# Basic health check
curl -X GET \
  "$JIRA_BASE_URL/status"

# Detailed health check (may require authentication)
curl -X GET \
  -k \
  -H "Authorization: Bearer $JIRA_PAT" \
  "$JIRA_BASE_URL/rest/api/2/status"
```

## Testing Authentication & Connection

### Complete Health Check Script

```bash
#!/bin/bash

# JIRA On-Premises Health Check with Proxy Support

JIRA_BASE_URL="${JIRA_BASE_URL:-https://jira.company.com}"
JIRA_PAT="${JIRA_PAT:-}"
JIRA_USERNAME="${JIRA_USERNAME:-}"
JIRA_PASSWORD="${JIRA_PASSWORD:-}"
PROXY="${HTTP_PROXY:-}"

# Determine authentication method
if [ -n "$JIRA_PAT" ]; then
  AUTH_METHOD="PAT"
  AUTH_HEADER="Authorization: Bearer $JIRA_PAT"
elif [ -n "$JIRA_USERNAME" ] && [ -n "$JIRA_PASSWORD" ]; then
  AUTH_METHOD="Basic"
  AUTH_HEADER="Authorization: Basic $(echo -n "$JIRA_USERNAME:$JIRA_PASSWORD" | base64)"
else
  echo "Error: No authentication credentials provided"
  echo "Set either JIRA_PAT or both JIRA_USERNAME and JIRA_PASSWORD"
  exit 1
fi

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
    "$JIRA_BASE_URL/rest/api/2/$endpoint"
}

echo "=== JIRA On-Premises Health Check ==="
echo "Base URL: $JIRA_BASE_URL"
echo "Auth Method: $AUTH_METHOD"
[ -n "$PROXY" ] && echo "Proxy: $PROXY"
echo ""

# Test 1: Server Info
echo "1. Checking server info..."
RESPONSE=$(jira_request "serverInfo")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Server is reachable"
  echo "$BODY" | jq -r '"  Version: \(.version)\n  Build: \(.buildNumber)\n  Deployment: \(.deploymentType)"'
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
  echo "$BODY" | jq -r '"  User: \(.displayName)\n  Email: \(.emailAddress)\n  Username: \(.name)"'
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

# Run with PAT
JIRA_BASE_URL="https://jira.company.com" \
JIRA_PAT="your-personal-access-token" \
./jira-health-check.sh

# Run with Basic Auth
JIRA_BASE_URL="https://jira.company.com" \
JIRA_USERNAME="your-username" \
JIRA_PASSWORD="your-password" \
./jira-health-check.sh

# Run with proxy
JIRA_BASE_URL="https://jira.company.com" \
JIRA_PAT="your-token" \
HTTP_PROXY="http://proxy.company.com:8080" \
./jira-health-check.sh
```

## Troubleshooting

### Common Error Codes

- **401 Unauthorized**: Invalid credentials, expired PAT, or incorrect password
- **403 Forbidden**: Valid credentials but insufficient permissions
- **404 Not Found**: Resource doesn't exist or endpoint not available
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: JIRA server error
- **502/503/504**: Gateway/proxy errors or server unavailable

### Debug Connection Issues

```bash
# Test proxy connectivity
curl -v -x http://proxy.company.com:8080 https://www.google.com

# Test JIRA connectivity without auth
curl -I "$JIRA_BASE_URL"

# Test with verbose output (PAT)
curl -v \
  -k \
  -H "Authorization: Bearer $JIRA_PAT" \
  "$JIRA_BASE_URL/rest/api/2/myself"

# Test with verbose output (Basic Auth)
curl -v \
  -u "$JIRA_USERNAME:$JIRA_PASSWORD" \
  "$JIRA_BASE_URL/rest/api/2/myself"
```

### Check PAT Status

```bash
# If your PAT isn't working, check server info first (no auth required on some instances)
curl -X GET \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/2/serverInfo"

# Then try with PAT to see exact error
curl -v -X GET \
  -k \
  -H "Authorization: Bearer $JIRA_PAT" \
  "$JIRA_BASE_URL/rest/api/2/myself"
```

### API Version Compatibility

```bash
# JIRA v10.3.8 supports both API v2 and v3
# Check which API versions are available
curl -X GET \
  -k \
  -H "Authorization: Bearer $JIRA_PAT" \
  "$JIRA_BASE_URL/rest/api/2/serverInfo"

# Some endpoints may require v2 instead of v3 on on-premises
# If you get 404, try switching between /rest/api/2/ and /rest/api/3/
```

## API Version Notes

JIRA v10.3.8 on-premises supports:
- **REST API v2**: Fully supported, recommended for on-premises
- **REST API v3**: Supported with some limitations compared to Cloud

This documentation uses v2 endpoints as they have better compatibility with JIRA on-premises installations.

## References

- [JIRA Server REST API v2 Documentation](https://docs.atlassian.com/software/jira/docs/api/REST/latest/)
- [JIRA Personal Access Tokens](https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html)
- [curl Manual](https://curl.se/docs/manual.html)

## Security Best Practices

1. **Use Personal Access Tokens** instead of passwords when possible
2. **Set token expiration dates** to limit exposure if compromised
3. **Never commit tokens or passwords** to version control
4. **Use environment variables** for credentials
5. **Rotate tokens regularly** according to your security policy
6. **Use HTTPS** for all API calls
7. **Limit token permissions** to only what's needed
8. **Revoke unused tokens** immediately
