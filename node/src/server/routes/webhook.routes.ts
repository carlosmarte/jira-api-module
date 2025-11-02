/**
 * Webhook routes
 */

import type { FastifyInstance, FastifyRequest } from 'fastify';
import { getWebhookManager, WebhookEventType } from '../../utils/webhook.js';
import { getLogger } from '../../utils/logger.js';

const logger = getLogger();

interface WebhookHandleRequest {
  Body: unknown;
  Headers: {
    'x-hub-signature'?: string;
  };
}

interface WebhookRegisterRequest {
  Body: {
    url: string;
    events: string[];
    filters?: {
      projectKeys?: string[];
      issueTypes?: string[];
    };
  };
}

/**
 * Register webhook routes
 */
export async function webhookRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * Handle incoming webhook event
   */
  fastify.post<WebhookHandleRequest>(
    '/api/v1/webhooks',
    {
      schema: {
        description: 'Handle incoming JIRA webhook event',
        tags: ['webhooks'],
        body: {
          type: 'object',
          properties: {
            timestamp: { type: 'number' },
            webhookEvent: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                accountId: { type: 'string' },
                emailAddress: { type: 'string' },
                displayName: { type: 'string' },
              },
            },
            issue: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                key: { type: 'string' },
                self: { type: 'string' },
              },
            },
          },
          required: ['timestamp', 'webhookEvent'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const webhookManager = getWebhookManager();
        const signature = request.headers['x-hub-signature'];

        await webhookManager.processEvent(request.body, signature);

        return reply.code(200).send({
          success: true,
          message: 'Webhook event processed',
        });
      } catch (error) {
        logger.error({ error, body: request.body }, 'Webhook processing failed');
        return reply.code(400).send({
          error: error instanceof Error ? error.message : 'Failed to process webhook',
        });
      }
    }
  );

  /**
   * Register webhook with JIRA
   */
  fastify.post<WebhookRegisterRequest>(
    '/api/v1/webhooks/register',
    {
      schema: {
        description: 'Register webhook with JIRA (stores configuration)',
        tags: ['webhooks'],
        body: {
          type: 'object',
          required: ['url', 'events'],
          properties: {
            url: {
              type: 'string',
              format: 'uri',
              description: 'Webhook callback URL',
            },
            events: {
              type: 'array',
              items: { type: 'string' },
              description: 'Event types to listen for',
            },
            filters: {
              type: 'object',
              properties: {
                projectKeys: {
                  type: 'array',
                  items: { type: 'string' },
                },
                issueTypes: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              url: { type: 'string' },
              events: { type: 'array', items: { type: 'string' } },
              created: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      // In a real implementation, this would register with JIRA API
      // For now, we'll just acknowledge the registration
      const registration = {
        id: `webhook-${Date.now()}`,
        url: request.body.url,
        events: request.body.events,
        filters: request.body.filters,
        created: new Date().toISOString(),
      };

      logger.info({ registration }, 'Webhook registered');

      return reply.code(201).send(registration);
    }
  );

  /**
   * Get supported event types
   */
  fastify.get(
    '/api/v1/webhooks/events',
    {
      schema: {
        description: 'Get supported webhook event types',
        tags: ['webhooks'],
        response: {
          200: {
            type: 'object',
            properties: {
              events: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const events = [
        {
          type: WebhookEventType.ISSUE_CREATED,
          description: 'Fired when an issue is created',
        },
        {
          type: WebhookEventType.ISSUE_UPDATED,
          description: 'Fired when an issue is updated',
        },
        {
          type: WebhookEventType.ISSUE_DELETED,
          description: 'Fired when an issue is deleted',
        },
        {
          type: WebhookEventType.ISSUE_ASSIGNED,
          description: 'Fired when an issue is assigned',
        },
        {
          type: WebhookEventType.ISSUE_COMMENTED,
          description: 'Fired when a comment is added to an issue',
        },
        {
          type: WebhookEventType.SPRINT_CREATED,
          description: 'Fired when a sprint is created',
        },
        {
          type: WebhookEventType.SPRINT_STARTED,
          description: 'Fired when a sprint is started',
        },
        {
          type: WebhookEventType.SPRINT_CLOSED,
          description: 'Fired when a sprint is closed',
        },
        {
          type: WebhookEventType.VERSION_CREATED,
          description: 'Fired when a version is created',
        },
        {
          type: WebhookEventType.VERSION_RELEASED,
          description: 'Fired when a version is released',
        },
        {
          type: WebhookEventType.PROJECT_CREATED,
          description: 'Fired when a project is created',
        },
        {
          type: WebhookEventType.PROJECT_UPDATED,
          description: 'Fired when a project is updated',
        },
      ];

      return reply.code(200).send({ events });
    }
  );

  /**
   * Test webhook handler
   */
  fastify.post(
    '/api/v1/webhooks/test',
    {
      schema: {
        description: 'Test webhook handling with a sample event',
        tags: ['webhooks'],
        body: {
          type: 'object',
          properties: {
            eventType: { type: 'string' },
          },
          required: ['eventType'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { eventType } = request.body as { eventType: string };

      // Create a test event
      const testEvent = {
        timestamp: Date.now(),
        webhookEvent: eventType,
        user: {
          accountId: 'test-user-123',
          emailAddress: 'test@example.com',
          displayName: 'Test User',
        },
        issue: {
          id: 'test-issue-123',
          key: 'TEST-1',
          self: 'https://example.atlassian.net/rest/api/3/issue/test-issue-123',
          fields: {
            summary: 'Test issue for webhook',
            status: {
              name: 'Open',
            },
            assignee: null,
            reporter: {
              accountId: 'test-user-123',
              emailAddress: 'test@example.com',
              displayName: 'Test User',
            },
            issuetype: {
              name: 'Task',
            },
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          },
        },
      };

      const webhookManager = getWebhookManager();
      await webhookManager.processEvent(testEvent);

      return reply.code(200).send({
        success: true,
        message: `Test event ${eventType} processed`,
      });
    }
  );
}
