/**
 * Webhook tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  WebhookManager,
  WebhookEventType,
  initializeWebhookManager,
  getWebhookManager,
  type WebhookEvent,
} from '../../../src/utils/webhook.js';

describe('WebhookManager', () => {
  describe('Event Processing', () => {
    let webhookManager: WebhookManager;

    beforeEach(() => {
      webhookManager = new WebhookManager();
    });

    it('should process valid webhook event', async () => {
      const event: WebhookEvent = {
        timestamp: Date.now(),
        webhookEvent: WebhookEventType.ISSUE_CREATED,
        user: {
          accountId: '123',
          displayName: 'John Doe',
          emailAddress: 'john@example.com',
        },
        issue: {
          id: 'issue-123',
          key: 'PROJ-1',
          self: 'https://example.atlassian.net/rest/api/3/issue/issue-123',
          fields: {
            summary: 'Test issue',
            status: { name: 'Open' },
            assignee: null,
            reporter: {
              accountId: '123',
              displayName: 'John Doe',
            },
            issuetype: { name: 'Bug' },
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          },
        },
      };

      await expect(webhookManager.processEvent(event)).resolves.toBeUndefined();
    });

    it('should reject invalid webhook event', async () => {
      const invalidEvent = {
        timestamp: Date.now(),
        // Missing webhookEvent field
      };

      await expect(webhookManager.processEvent(invalidEvent)).rejects.toThrow();
    });

    it('should emit event to registered handlers', async () => {
      const handler = vi.fn();
      webhookManager.on(WebhookEventType.ISSUE_CREATED, handler);

      const event: WebhookEvent = {
        timestamp: Date.now(),
        webhookEvent: WebhookEventType.ISSUE_CREATED,
        issue: {
          id: 'issue-123',
          key: 'PROJ-1',
          self: 'https://example.atlassian.net/rest/api/3/issue/issue-123',
          fields: {
            summary: 'Test issue',
            status: { name: 'Open' },
            assignee: null,
            reporter: {
              accountId: '123',
              displayName: 'Reporter',
            },
            issuetype: { name: 'Bug' },
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          },
        },
      };

      await webhookManager.processEvent(event);

      expect(handler).toHaveBeenCalledWith(event);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should emit to wildcard handler', async () => {
      const wildcardHandler = vi.fn();
      webhookManager.on('*', wildcardHandler);

      const event: WebhookEvent = {
        timestamp: Date.now(),
        webhookEvent: WebhookEventType.ISSUE_UPDATED,
        issue: {
          id: 'issue-123',
          key: 'PROJ-1',
          self: 'https://example.atlassian.net/rest/api/3/issue/issue-123',
          fields: {
            summary: 'Updated issue',
            status: { name: 'In Progress' },
            assignee: null,
            reporter: {
              accountId: '123',
              displayName: 'Reporter',
            },
            issuetype: { name: 'Bug' },
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          },
        },
      };

      await webhookManager.processEvent(event);

      expect(wildcardHandler).toHaveBeenCalledWith(event);
    });

    it('should call multiple handlers for same event', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      webhookManager.on(WebhookEventType.ISSUE_CREATED, handler1);
      webhookManager.on(WebhookEventType.ISSUE_CREATED, handler2);

      const event: WebhookEvent = {
        timestamp: Date.now(),
        webhookEvent: WebhookEventType.ISSUE_CREATED,
        issue: {
          id: 'issue-123',
          key: 'PROJ-1',
          self: 'https://example.atlassian.net/rest/api/3/issue/issue-123',
          fields: {
            summary: 'Test issue',
            status: { name: 'Open' },
            assignee: null,
            reporter: {
              accountId: '123',
              displayName: 'Reporter',
            },
            issuetype: { name: 'Bug' },
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          },
        },
      };

      await webhookManager.processEvent(event);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should remove handler with off', async () => {
      const handler = vi.fn();
      webhookManager.on(WebhookEventType.ISSUE_CREATED, handler);

      const event: WebhookEvent = {
        timestamp: Date.now(),
        webhookEvent: WebhookEventType.ISSUE_CREATED,
        issue: {
          id: 'issue-123',
          key: 'PROJ-1',
          self: 'https://example.atlassian.net/rest/api/3/issue/issue-123',
          fields: {
            summary: 'Test issue',
            status: { name: 'Open' },
            assignee: null,
            reporter: {
              accountId: '123',
              displayName: 'Reporter',
            },
            issuetype: { name: 'Bug' },
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          },
        },
      };

      await webhookManager.processEvent(event);
      expect(handler).toHaveBeenCalledTimes(1);

      webhookManager.off(WebhookEventType.ISSUE_CREATED, handler);

      await webhookManager.processEvent(event);
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should call once handler only once', async () => {
      const handler = vi.fn();
      webhookManager.once(WebhookEventType.ISSUE_CREATED, handler);

      const event: WebhookEvent = {
        timestamp: Date.now(),
        webhookEvent: WebhookEventType.ISSUE_CREATED,
        issue: {
          id: 'issue-123',
          key: 'PROJ-1',
          self: 'https://example.atlassian.net/rest/api/3/issue/issue-123',
          fields: {
            summary: 'Test issue',
            status: { name: 'Open' },
            assignee: null,
            reporter: {
              accountId: '123',
              displayName: 'Reporter',
            },
            issuetype: { name: 'Bug' },
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          },
        },
      };

      await webhookManager.processEvent(event);
      expect(handler).toHaveBeenCalledTimes(1);

      await webhookManager.processEvent(event);
      expect(handler).toHaveBeenCalledTimes(1); // Still 1
    });
  });

  describe('Changelog Helpers', () => {
    it('should get change summary', () => {
      const changelog = {
        id: 'changelog-123',
        items: [
          {
            field: 'status',
            fieldtype: 'jira',
            from: '10000',
            fromString: 'Open',
            to: '10001',
            toString: 'In Progress',
          },
          {
            field: 'assignee',
            fieldtype: 'jira',
            from: null,
            fromString: null,
            to: '123',
            toString: 'John Doe',
          },
        ],
      };

      const changes = WebhookManager.getChangeSummary(changelog);
      expect(changes).toEqual({
        status: { from: 'Open', to: 'In Progress' },
        assignee: { from: null, to: 'John Doe' },
      });
    });

    it('should detect if issue was assigned', () => {
      const changelog = {
        id: 'changelog-123',
        items: [
          {
            field: 'assignee',
            fieldtype: 'jira',
            from: null,
            fromString: null,
            to: '123',
            toString: 'John Doe',
          },
        ],
      };

      expect(WebhookManager.wasAssigned(changelog)).toBe(true);
    });

    it('should return false if not assigned', () => {
      const changelog = {
        id: 'changelog-123',
        items: [
          {
            field: 'status',
            fieldtype: 'jira',
            from: '10000',
            fromString: 'Open',
            to: '10001',
            toString: 'In Progress',
          },
        ],
      };

      expect(WebhookManager.wasAssigned(changelog)).toBe(false);
    });

    it('should detect status change', () => {
      const changelog = {
        id: 'changelog-123',
        items: [
          {
            field: 'status',
            fieldtype: 'jira',
            from: '10000',
            fromString: 'Open',
            to: '10001',
            toString: 'In Progress',
          },
        ],
      };

      expect(WebhookManager.statusChanged(changelog)).toBe(true);
    });

    it('should get new status', () => {
      const changelog = {
        id: 'changelog-123',
        items: [
          {
            field: 'status',
            fieldtype: 'jira',
            from: '10000',
            fromString: 'Open',
            to: '10001',
            toString: 'In Progress',
          },
        ],
      };

      expect(WebhookManager.getNewStatus(changelog)).toBe('In Progress');
    });

    it('should return null for no status change', () => {
      const changelog = {
        id: 'changelog-123',
        items: [
          {
            field: 'assignee',
            fieldtype: 'jira',
            from: null,
            fromString: null,
            to: '123',
            toString: 'John Doe',
          },
        ],
      };

      expect(WebhookManager.getNewStatus(changelog)).toBeNull();
    });

    it('should handle undefined changelog', () => {
      expect(WebhookManager.getChangeSummary(undefined)).toEqual({});
      expect(WebhookManager.wasAssigned(undefined)).toBe(false);
      expect(WebhookManager.statusChanged(undefined)).toBe(false);
      expect(WebhookManager.getNewStatus(undefined)).toBeNull();
    });
  });

  describe('Signature Verification', () => {
    it('should verify valid signature', async () => {
      const secret = 'test-secret';
      const webhookManager = new WebhookManager(secret);

      const event = {
        timestamp: Date.now(),
        webhookEvent: WebhookEventType.ISSUE_CREATED,
      };

      const crypto = await import('crypto');
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(JSON.stringify(event));
      const signature = `sha256=${hmac.digest('hex')}`;

      await expect(webhookManager.processEvent(event, signature)).resolves.toBeUndefined();
    });

    it('should reject invalid signature', async () => {
      const secret = 'test-secret';
      const webhookManager = new WebhookManager(secret);

      const event = {
        timestamp: Date.now(),
        webhookEvent: WebhookEventType.ISSUE_CREATED,
      };

      const invalidSignature = 'sha256=invalid-signature';

      await expect(webhookManager.processEvent(event, invalidSignature)).rejects.toThrow(
        'Invalid webhook signature'
      );
    });

    it('should allow events without signature if no secret configured', async () => {
      const webhookManager = new WebhookManager();

      const event = {
        timestamp: Date.now(),
        webhookEvent: WebhookEventType.ISSUE_CREATED,
      };

      await expect(webhookManager.processEvent(event)).resolves.toBeUndefined();
    });
  });

  describe('Global Webhook Manager', () => {
    it('should initialize global webhook manager', () => {
      const manager = initializeWebhookManager('test-secret');
      expect(manager).toBeInstanceOf(WebhookManager);
    });

    it('should get global webhook manager instance', () => {
      initializeWebhookManager();
      const manager = getWebhookManager();
      expect(manager).toBeInstanceOf(WebhookManager);
    });

    it('should create manager if not initialized', () => {
      const manager = getWebhookManager();
      expect(manager).toBeInstanceOf(WebhookManager);
    });

    it('should share handlers across getInstance calls', async () => {
      const manager1 = getWebhookManager();
      const manager2 = getWebhookManager();

      const handler = vi.fn();
      manager1.on(WebhookEventType.ISSUE_CREATED, handler);

      const event: WebhookEvent = {
        timestamp: Date.now(),
        webhookEvent: WebhookEventType.ISSUE_CREATED,
        issue: {
          id: 'issue-123',
          key: 'PROJ-1',
          self: 'https://example.atlassian.net/rest/api/3/issue/issue-123',
          fields: {
            summary: 'Test issue',
            status: { name: 'Open' },
            assignee: null,
            reporter: {
              accountId: '123',
              displayName: 'Reporter',
            },
            issuetype: { name: 'Bug' },
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          },
        },
      };

      await manager2.processEvent(event);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Event Types', () => {
    let webhookManager: WebhookManager;

    beforeEach(() => {
      webhookManager = new WebhookManager();
    });

    const eventTypes = [
      WebhookEventType.ISSUE_CREATED,
      WebhookEventType.ISSUE_UPDATED,
      WebhookEventType.ISSUE_DELETED,
      WebhookEventType.ISSUE_ASSIGNED,
      WebhookEventType.ISSUE_COMMENTED,
      WebhookEventType.SPRINT_CREATED,
      WebhookEventType.SPRINT_STARTED,
      WebhookEventType.SPRINT_CLOSED,
      WebhookEventType.VERSION_CREATED,
      WebhookEventType.VERSION_RELEASED,
      WebhookEventType.PROJECT_CREATED,
      WebhookEventType.PROJECT_UPDATED,
    ];

    eventTypes.forEach((eventType) => {
      it(`should handle ${eventType} event`, async () => {
        const handler = vi.fn();
        webhookManager.on(eventType, handler);

        const event: WebhookEvent = {
          timestamp: Date.now(),
          webhookEvent: eventType,
        };

        await webhookManager.processEvent(event);
        expect(handler).toHaveBeenCalledWith(event);
      });
    });
  });
});
