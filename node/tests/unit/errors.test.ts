/**
 * Unit tests for error classes
 */

import { describe, it, expect } from 'vitest';
import {
  JiraAPIError,
  JiraAuthenticationError,
  JiraPermissionError,
  JiraNotFoundError,
  JiraValidationError,
  JiraRateLimitError,
  JiraServerError,
  SDKError,
  mapHttpError,
  isJiraError,
  isAuthError,
  isRateLimitError,
} from '../../src/errors/index.js';

describe('Error Classes', () => {
  describe('JiraAPIError', () => {
    it('should create error with message and status code', () => {
      const error = new JiraAPIError('Test error', 400);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('JiraAPIError');
      expect(error instanceof Error).toBe(true);
    });

    it('should include response data', () => {
      const response = { foo: 'bar' };
      const error = new JiraAPIError('Test error', 400, response);
      expect(error.response).toEqual(response);
    });
  });

  describe('JiraAuthenticationError', () => {
    it('should create 401 error with default message', () => {
      const error = new JiraAuthenticationError();
      expect(error.message).toBe('Authentication failed');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('JiraAuthenticationError');
    });

    it('should accept custom message', () => {
      const error = new JiraAuthenticationError('Invalid credentials');
      expect(error.message).toBe('Invalid credentials');
    });
  });

  describe('JiraPermissionError', () => {
    it('should create 403 error', () => {
      const error = new JiraPermissionError();
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('JiraPermissionError');
    });
  });

  describe('JiraNotFoundError', () => {
    it('should create 404 error with resource name', () => {
      const error = new JiraNotFoundError('Issue TEST-123');
      expect(error.message).toBe('Resource not found: Issue TEST-123');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('JiraNotFoundError');
    });
  });

  describe('JiraValidationError', () => {
    it('should create 400 error with validation errors', () => {
      const validationErrors = [{ field: 'summary', message: 'Required' }];
      const error = new JiraValidationError('Validation failed', validationErrors);
      expect(error.statusCode).toBe(400);
      expect(error.errors).toEqual(validationErrors);
      expect(error.name).toBe('JiraValidationError');
    });
  });

  describe('JiraRateLimitError', () => {
    it('should create 429 error with retry after', () => {
      const error = new JiraRateLimitError('Rate limit exceeded', 60);
      expect(error.statusCode).toBe(429);
      expect(error.retryAfter).toBe(60);
      expect(error.name).toBe('JiraRateLimitError');
    });

    it('should have default message', () => {
      const error = new JiraRateLimitError();
      expect(error.message).toBe('Rate limit exceeded');
    });
  });

  describe('JiraServerError', () => {
    it('should create 500 error by default', () => {
      const error = new JiraServerError();
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('JiraServerError');
    });

    it('should accept custom status code', () => {
      const error = new JiraServerError('Service unavailable', 503);
      expect(error.statusCode).toBe(503);
    });
  });

  describe('SDKError', () => {
    it('should create SDK error', () => {
      const error = new SDKError('SDK failed');
      expect(error.message).toBe('SDK failed');
      expect(error.name).toBe('SDKError');
    });

    it('should include cause', () => {
      const cause = new Error('Original error');
      const error = new SDKError('SDK failed', cause);
      expect(error.cause).toBe(cause);
      expect(error.stack).toContain('Caused by:');
    });
  });

  describe('mapHttpError', () => {
    it('should map 401 to JiraAuthenticationError', () => {
      const error = mapHttpError(401, { message: 'Unauthorized' });
      expect(error instanceof JiraAuthenticationError).toBe(true);
      expect(error.message).toBe('Unauthorized');
    });

    it('should map 403 to JiraPermissionError', () => {
      const error = mapHttpError(403, { message: 'Forbidden' });
      expect(error instanceof JiraPermissionError).toBe(true);
    });

    it('should map 404 to JiraNotFoundError', () => {
      const error = mapHttpError(404, { resource: 'Issue' });
      expect(error instanceof JiraNotFoundError).toBe(true);
    });

    it('should map 400 to JiraValidationError', () => {
      const error = mapHttpError(400, { message: 'Invalid', errors: [] });
      expect(error instanceof JiraValidationError).toBe(true);
    });

    it('should map 429 to JiraRateLimitError', () => {
      const error = mapHttpError(429, { message: 'Rate limited', retryAfter: 30 });
      expect(error instanceof JiraRateLimitError).toBe(true);
      expect((error as JiraRateLimitError).retryAfter).toBe(30);
    });

    it('should map 500-504 to JiraServerError', () => {
      [500, 502, 503, 504].forEach((status) => {
        const error = mapHttpError(status, { message: 'Server error' });
        expect(error instanceof JiraServerError).toBe(true);
        expect(error.statusCode).toBe(status);
      });
    });

    it('should handle errorMessages array format', () => {
      const error = mapHttpError(400, { errorMessages: ['Error 1', 'Error 2'] });
      expect(error.message).toBe('Error 1');
    });

    it('should use Unknown error for missing message', () => {
      const error = mapHttpError(500, {});
      expect(error.message).toBe('Unknown error');
    });
  });

  describe('Type Guards', () => {
    it('isJiraError should identify JIRA errors', () => {
      const jiraError = new JiraAPIError('Test');
      const authError = new JiraAuthenticationError();
      const normalError = new Error('Test');

      expect(isJiraError(jiraError)).toBe(true);
      expect(isJiraError(authError)).toBe(true);
      expect(isJiraError(normalError)).toBe(false);
      expect(isJiraError('string')).toBe(false);
    });

    it('isAuthError should identify authentication errors', () => {
      const authError = new JiraAuthenticationError();
      const otherError = new JiraNotFoundError('Test');

      expect(isAuthError(authError)).toBe(true);
      expect(isAuthError(otherError)).toBe(false);
    });

    it('isRateLimitError should identify rate limit errors', () => {
      const rateLimitError = new JiraRateLimitError();
      const otherError = new JiraAPIError('Test');

      expect(isRateLimitError(rateLimitError)).toBe(true);
      expect(isRateLimitError(otherError)).toBe(false);
    });
  });
});
