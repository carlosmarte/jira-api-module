/**
 * Issue API routes
 * Endpoints for issue operations
 */

import type { FastifyInstance } from 'fastify';
import type { IssueService } from '../../services/issue.service.js';

// Extend Fastify types
declare module 'fastify' {
  interface FastifyInstance {
    issueService: IssueService;
  }
}

export async function issueRoutes(fastify: FastifyInstance) {
  /**
   * Get issue by key
   */
  fastify.get(
    '/issues/:key',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Get issue by key',
        tags: ['Issues'],
        security: [{ apiKey: [] }],
        params: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Issue key (e.g., PROJ-123)' },
          },
          required: ['key'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              id: { type: 'string' },
              self: { type: 'string' },
              fields: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { key } = request.params as { key: string };
      const issue = await fastify.issueService.getIssue(key);
      return issue;
    }
  );

  /**
   * Search issues with JQL
   */
  fastify.post(
    '/issues/search',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Search issues with JQL query',
        tags: ['Issues'],
        security: [{ apiKey: [] }],
        body: {
          type: 'object',
          properties: {
            jql: { type: 'string', description: 'JQL query string' },
            maxResults: { type: 'integer', default: 50, minimum: 1, maximum: 100 },
          },
          required: ['jql'],
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                key: { type: 'string' },
                id: { type: 'string' },
                fields: { type: 'object' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { jql, maxResults } = request.body as { jql: string; maxResults?: number };
      const issues = await fastify.issueService.searchIssues(jql, maxResults);
      return issues;
    }
  );

  /**
   * Create issue
   */
  fastify.post(
    '/issues',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Create a new issue',
        tags: ['Issues'],
        security: [{ apiKey: [] }],
        body: {
          type: 'object',
          properties: {
            projectKey: { type: 'string', description: 'Project key' },
            issueTypeName: { type: 'string', description: 'Issue type name (e.g., Bug, Task)' },
            summary: { type: 'string', description: 'Issue summary' },
            description: { type: 'string', description: 'Issue description' },
            assigneeEmail: { type: 'string', description: 'Assignee email address' },
            priority: { type: 'string', description: 'Priority name' },
            labels: { type: 'array', items: { type: 'string' }, description: 'Labels' },
            parentKey: { type: 'string', description: 'Parent issue key (for subtasks)' },
          },
          required: ['projectKey', 'issueTypeName', 'summary'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              id: { type: 'string' },
              self: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as any;
      const issue = await fastify.issueService.createIssueByTypeName(body);
      reply.status(201);
      return issue;
    }
  );

  /**
   * Update issue
   */
  fastify.patch(
    '/issues/:key',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Update issue fields',
        tags: ['Issues'],
        security: [{ apiKey: [] }],
        params: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Issue key' },
          },
          required: ['key'],
        },
        body: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            description: { type: 'string' },
          },
        },
        response: {
          204: {
            type: 'null',
            description: 'No content',
          },
        },
      },
    },
    async (request, reply) => {
      const { key } = request.params as { key: string };
      const { summary, description } = request.body as { summary?: string; description?: string };

      if (summary) {
        await fastify.issueService.updateIssueSummary(key, summary);
      }
      if (description) {
        await fastify.issueService.updateIssueDescription(key, description);
      }

      reply.status(204);
      return;
    }
  );

  /**
   * Assign issue
   */
  fastify.post(
    '/issues/:key/assign',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Assign issue to user',
        tags: ['Issues'],
        security: [{ apiKey: [] }],
        params: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Issue key' },
          },
          required: ['key'],
        },
        body: {
          type: 'object',
          properties: {
            email: { type: 'string', description: 'Assignee email address' },
          },
          required: ['email'],
        },
        response: {
          204: {
            type: 'null',
            description: 'No content',
          },
        },
      },
    },
    async (request, reply) => {
      const { key } = request.params as { key: string };
      const { email } = request.body as { email: string };
      await fastify.issueService.assignIssueByEmail(key, email);
      reply.status(204);
      return;
    }
  );

  /**
   * Unassign issue
   */
  fastify.post(
    '/issues/:key/unassign',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Unassign issue',
        tags: ['Issues'],
        security: [{ apiKey: [] }],
        params: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Issue key' },
          },
          required: ['key'],
        },
        response: {
          204: {
            type: 'null',
            description: 'No content',
          },
        },
      },
    },
    async (request, reply) => {
      const { key } = request.params as { key: string };
      await fastify.issueService.unassignIssue(key);
      reply.status(204);
      return;
    }
  );

  /**
   * Add labels to issue
   */
  fastify.post(
    '/issues/:key/labels',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Add labels to issue',
        tags: ['Issues'],
        security: [{ apiKey: [] }],
        params: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Issue key' },
          },
          required: ['key'],
        },
        body: {
          type: 'object',
          properties: {
            labels: { type: 'array', items: { type: 'string' } },
          },
          required: ['labels'],
        },
        response: {
          204: {
            type: 'null',
            description: 'No content',
          },
        },
      },
    },
    async (request, reply) => {
      const { key } = request.params as { key: string };
      const { labels } = request.body as { labels: string[] };
      await fastify.issueService.addLabelsToIssue(key, labels);
      reply.status(204);
      return;
    }
  );

  /**
   * Get available transitions
   */
  fastify.get(
    '/issues/:key/transitions',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Get available transitions for issue',
        tags: ['Issues'],
        security: [{ apiKey: [] }],
        params: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Issue key' },
          },
          required: ['key'],
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { key } = request.params as { key: string };
      const transitions = await fastify.issueService.getAvailableTransitions(key);
      return transitions;
    }
  );

  /**
   * Transition issue
   */
  fastify.post(
    '/issues/:key/transition',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Transition issue to new status',
        tags: ['Issues'],
        security: [{ apiKey: [] }],
        params: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Issue key' },
          },
          required: ['key'],
        },
        body: {
          type: 'object',
          properties: {
            transitionName: { type: 'string', description: 'Transition name' },
            comment: { type: 'string', description: 'Optional comment' },
          },
          required: ['transitionName'],
        },
        response: {
          204: {
            type: 'null',
            description: 'No content',
          },
        },
      },
    },
    async (request, reply) => {
      const { key } = request.params as { key: string };
      const { transitionName, comment } = request.body as {
        transitionName: string;
        comment?: string;
      };
      await fastify.issueService.transitionIssueByName(key, transitionName, comment);
      reply.status(204);
      return;
    }
  );
}
