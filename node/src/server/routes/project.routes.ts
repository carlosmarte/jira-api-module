/**
 * Project API routes
 * Endpoints for project operations
 */

import type { FastifyInstance } from 'fastify';
import type { ProjectService } from '../../services/project.service.js';

// Extend Fastify types
declare module 'fastify' {
  interface FastifyInstance {
    projectService: ProjectService;
  }
}

export async function projectRoutes(fastify: FastifyInstance) {
  /**
   * Get project by key
   */
  fastify.get(
    '/projects/:key',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Get project by key',
        tags: ['Projects'],
        security: [{ apiKey: [] }],
        params: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Project key' },
          },
          required: ['key'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              projectTypeKey: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { key } = request.params as { key: string };
      const project = await fastify.projectService.getProject(key);
      return project;
    }
  );

  /**
   * Get project versions
   */
  fastify.get(
    '/projects/:key/versions',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Get project versions',
        tags: ['Projects'],
        security: [{ apiKey: [] }],
        params: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Project key' },
          },
          required: ['key'],
        },
        querystring: {
          type: 'object',
          properties: {
            released: { type: 'boolean', description: 'Filter by released status' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                released: { type: 'boolean' },
                archived: { type: 'boolean' },
                releaseDate: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { key } = request.params as { key: string };
      const { released } = request.query as { released?: boolean };

      let versions;
      if (released === true) {
        versions = await fastify.projectService.getReleasedVersions(key);
      } else if (released === false) {
        versions = await fastify.projectService.getUnreleasedVersions(key);
      } else {
        versions = await fastify.projectService.getProjectVersions(key);
      }

      return versions;
    }
  );

  /**
   * Create project version
   */
  fastify.post(
    '/projects/:key/versions',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Create a new project version',
        tags: ['Projects'],
        security: [{ apiKey: [] }],
        params: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Project key' },
          },
          required: ['key'],
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Version name' },
            description: { type: 'string', description: 'Version description' },
            releaseDate: { type: 'string', description: 'Release date (YYYY-MM-DD)' },
          },
          required: ['name'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              releaseDate: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { key } = request.params as { key: string };
      const body = request.body as {
        name: string;
        description?: string;
        releaseDate?: string;
      };

      const version = await fastify.projectService.createVersion(key, body);
      reply.status(201);
      return version;
    }
  );

  /**
   * Get issue types for project
   */
  fastify.get(
    '/projects/:key/issue-types',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Get issue types for project',
        tags: ['Projects'],
        security: [{ apiKey: [] }],
        params: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Project key' },
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
                description: { type: 'string' },
                subtask: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { key } = request.params as { key: string };
      const issueTypes = await fastify.projectService.getIssueTypes(key);
      return issueTypes;
    }
  );

  /**
   * Get issue type names
   */
  fastify.get(
    '/projects/:key/issue-type-names',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Get issue type names for project',
        tags: ['Projects'],
        security: [{ apiKey: [] }],
        params: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Project key' },
          },
          required: ['key'],
        },
        response: {
          200: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { key } = request.params as { key: string };
      const names = await fastify.projectService.getIssueTypeNames(key);
      return names;
    }
  );

  /**
   * Check if issue type exists
   */
  fastify.get(
    '/projects/:key/issue-types/:typeName/exists',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Check if issue type exists in project',
        tags: ['Projects'],
        security: [{ apiKey: [] }],
        params: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Project key' },
            typeName: { type: 'string', description: 'Issue type name' },
          },
          required: ['key', 'typeName'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              exists: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { key, typeName } = request.params as { key: string; typeName: string };
      const exists = await fastify.projectService.issueTypeExists(key, typeName);
      return { exists };
    }
  );
}
