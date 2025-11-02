/**
 * Unit tests for configuration management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadConfig,
  validatePartialConfig,
  getRequiredEnvVars,
} from '../../src/utils/config.js';
import { JiraValidationError } from '../../src/errors/index.js';

describe('Configuration Management', () => {
  describe('loadConfig', () => {
    beforeEach(() => {
      // Ensure required env vars are set (from setup.ts)
      process.env.JIRA_BASE_URL = 'https://test.atlassian.net';
      process.env.JIRA_EMAIL = 'test@example.com';
      process.env.JIRA_API_TOKEN = 'test-token';
    });

    it('should load configuration from environment variables', async () => {
      const config = await loadConfig();

      expect(config.baseUrl).toBe('https://test.atlassian.net');
      expect(config.email).toBe('test@example.com');
      expect(config.apiToken).toBe('test-token');
    });

    it('should apply default values', async () => {
      const config = await loadConfig();

      expect(config.timeout).toBe(30000);
      expect(config.maxRetries).toBe(3);
      expect(config.retryDelay).toBe(1000);
      expect(config.maxConnections).toBe(10);
      expect(config.rateLimit).toBe(100);
    });

    it('should load server configuration from env', async () => {
      process.env.SERVER_HOST = '127.0.0.1';
      process.env.SERVER_PORT = '3000';
      process.env.SERVER_API_KEY = 'server-key';

      const config = await loadConfig();

      expect(config.server.host).toBe('127.0.0.1');
      expect(config.server.port).toBe(3000);
      expect(config.server.apiKey).toBe('server-key');
    });

    it('should load cache configuration from env', async () => {
      process.env.JIRA_CACHE_ENABLED = 'true';
      process.env.JIRA_CACHE_TTL = '600';
      process.env.REDIS_URL = 'redis://localhost:6379';

      const config = await loadConfig();

      expect(config.cache.enabled).toBe(true);
      expect(config.cache.ttl).toBe(600);
      expect(config.cache.redisUrl).toBe('redis://localhost:6379');
    });

    it('should load logging configuration from env', async () => {
      process.env.LOG_LEVEL = 'debug';
      process.env.LOG_PRETTY = 'true';

      const config = await loadConfig();

      expect(config.logging.level).toBe('debug');
      expect(config.logging.pretty).toBe(true);
    });

    it('should throw validation error for missing required fields', async () => {
      delete process.env.JIRA_BASE_URL;

      await expect(loadConfig()).rejects.toThrow(JiraValidationError);
    });

    it('should throw validation error for invalid URL', async () => {
      process.env.JIRA_BASE_URL = 'not-a-url';

      await expect(loadConfig()).rejects.toThrow(JiraValidationError);
    });

    it('should throw validation error for invalid email', async () => {
      process.env.JIRA_EMAIL = 'not-an-email';

      await expect(loadConfig()).rejects.toThrow(JiraValidationError);
    });
  });

  describe('validatePartialConfig', () => {
    it('should validate valid partial config', () => {
      expect(() => {
        validatePartialConfig({
          baseUrl: 'https://test.atlassian.net',
          email: 'test@example.com',
        });
      }).not.toThrow();
    });

    it('should throw for invalid partial config', () => {
      expect(() => {
        validatePartialConfig({
          baseUrl: 'not-a-url',
        });
      }).toThrow(JiraValidationError);
    });

    it('should allow empty partial config', () => {
      expect(() => {
        validatePartialConfig({});
      }).not.toThrow();
    });
  });

  describe('getRequiredEnvVars', () => {
    beforeEach(() => {
      process.env.JIRA_BASE_URL = 'https://test.atlassian.net';
      process.env.JIRA_EMAIL = 'test@example.com';
      process.env.JIRA_API_TOKEN = 'test-token';
    });

    it('should return required env vars when all are set', () => {
      const vars = getRequiredEnvVars();

      expect(vars.baseUrl).toBe('https://test.atlassian.net');
      expect(vars.email).toBe('test@example.com');
      expect(vars.apiToken).toBe('test-token');
    });

    it('should throw when JIRA_BASE_URL is missing', () => {
      delete process.env.JIRA_BASE_URL;

      expect(() => getRequiredEnvVars()).toThrow(JiraValidationError);
      expect(() => getRequiredEnvVars()).toThrow(/JIRA_BASE_URL/);
    });

    it('should throw when JIRA_EMAIL is missing', () => {
      delete process.env.JIRA_EMAIL;

      expect(() => getRequiredEnvVars()).toThrow(JiraValidationError);
      expect(() => getRequiredEnvVars()).toThrow(/JIRA_EMAIL/);
    });

    it('should throw when JIRA_API_TOKEN is missing', () => {
      delete process.env.JIRA_API_TOKEN;

      expect(() => getRequiredEnvVars()).toThrow(JiraValidationError);
      expect(() => getRequiredEnvVars()).toThrow(/JIRA_API_TOKEN/);
    });

    it('should throw with all missing vars in message', () => {
      delete process.env.JIRA_BASE_URL;
      delete process.env.JIRA_EMAIL;
      delete process.env.JIRA_API_TOKEN;

      expect(() => getRequiredEnvVars()).toThrow(/JIRA_BASE_URL.*JIRA_EMAIL.*JIRA_API_TOKEN/);
    });
  });
});
