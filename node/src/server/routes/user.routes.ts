/**
 * User API routes
 * Endpoints for user operations
 */

import type { FastifyInstance } from 'fastify';
import type { UserService } from '../../services/user.service.js';

// Extend Fastify types
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
    userService: UserService;
  }
}

export async function userRoutes(fastify: FastifyInstance) {
  /**
   * Get user by identifier (email or account ID)
   */
  fastify.get(
    '/users/:identifier',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Get user by email or account ID',
        tags: ['Users'],
        security: [{ apiKey: [] }],
        params: {
          type: 'object',
          properties: {
            identifier: { type: 'string', description: 'Email or account ID' },
          },
          required: ['identifier'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              accountId: { type: 'string' },
              displayName: { type: 'string' },
              emailAddress: { type: 'string' },
              accountType: { type: 'string' },
              active: { type: 'boolean' },
              timeZone: { type: 'string' },
              locale: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { identifier } = request.params as { identifier: string };
      const user = await fastify.userService.getUserByIdentifier(identifier);
      return user;
    }
  );

  /**
   * Search users
   */
  fastify.get(
    '/users/search/:query',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Search users by name or email',
        tags: ['Users'],
        security: [{ apiKey: [] }],
        params: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
          },
          required: ['query'],
        },
        querystring: {
          type: 'object',
          properties: {
            maxResults: { type: 'integer', default: 50, minimum: 1, maximum: 100 },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                accountId: { type: 'string' },
                displayName: { type: 'string' },
                emailAddress: { type: 'string' },
                active: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { query } = request.params as { query: string };
      const { maxResults } = request.query as { maxResults?: number };
      const users = await fastify.userService.searchUsers(query, maxResults);
      return users;
    }
  );

  /**
   * Find assignable users for projects
   */
  fastify.post(
    '/users/assignable',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Find users assignable to projects',
        tags: ['Users'],
        security: [{ apiKey: [] }],
        body: {
          type: 'object',
          properties: {
            projectKeys: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
            },
          },
          required: ['projectKeys'],
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                accountId: { type: 'string' },
                displayName: { type: 'string' },
                emailAddress: { type: 'string' },
                active: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { projectKeys } = request.body as { projectKeys: string[] };
      const users = await fastify.userService.findAssignableUsersForProjects(projectKeys);
      return users;
    }
  );

  /**
   * Resolve email to account ID
   */
  fastify.get(
    '/users/resolve/:identifier',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Resolve email or identifier to account ID',
        tags: ['Users'],
        security: [{ apiKey: [] }],
        params: {
          type: 'object',
          properties: {
            identifier: { type: 'string', description: 'Email or account ID' },
          },
          required: ['identifier'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              accountId: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { identifier } = request.params as { identifier: string };
      const accountId = await fastify.userService.resolveToAccountId(identifier);
      return { accountId };
    }
  );
}
