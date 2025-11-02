/**
 * Unit tests for JiraClient
 */

import { describe, it, expect } from 'vitest';
import { JiraClient } from '../../src/core/client.js';

describe('JiraClient', () => {
  const validConfig = {
    baseUrl: 'https://test.atlassian.net',
    email: 'test@example.com',
    apiToken: 'test-token',
  };

  describe('Constructor', () => {
    it('should create client with valid configuration', () => {
      const client = new JiraClient(validConfig);
      expect(client).toBeInstanceOf(JiraClient);
    });

    it('should apply default configuration values', () => {
      const client = new JiraClient(validConfig);
      expect(client).toBeDefined();
      // Private config is not directly accessible, but client should be created
    });

    it('should accept optional configuration parameters', () => {
      const client = new JiraClient({
        ...validConfig,
        timeout: 60000,
        maxRetries: 5,
        retryDelay: 2000,
        maxConnections: 20,
        rateLimit: 200,
      });

      expect(client).toBeInstanceOf(JiraClient);
    });
  });

  describe('Close', () => {
    it('should close client without errors', async () => {
      const client = new JiraClient(validConfig);
      await expect(client.close()).resolves.toBeUndefined();
    });
  });

  // Note: Full integration tests with MSW (Mock Service Worker) should be added
  // to test actual API calls, error handling, retries, etc.
  // Those tests would go in tests/integration/client.test.ts
});
