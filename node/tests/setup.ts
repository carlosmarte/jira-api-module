/**
 * Test setup and global configuration for Vitest
 */

import { beforeAll, afterEach, afterAll } from 'vitest';

// Set test environment variables
process.env.JIRA_BASE_URL = 'https://test.atlassian.net';
process.env.JIRA_EMAIL = 'test@example.com';
process.env.JIRA_API_TOKEN = 'test-token-12345';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'fatal';

// Global test setup
beforeAll(() => {
  // Setup code that runs once before all tests
});

// Clean up after each test
afterEach(() => {
  // Reset any test state if needed
});

// Global teardown
afterAll(() => {
  // Cleanup code that runs once after all tests
});
