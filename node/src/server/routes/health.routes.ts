/**
 * Health check routes
 * Provides health status and metrics endpoints
 */

import type { FastifyInstance } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance) {
  /**
   * Health check endpoint
   */
  fastify.get(
    '/health',
    {
      schema: {
        description: 'Health check endpoint',
        tags: ['Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              uptime: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    }
  );

  /**
   * Readiness check endpoint
   */
  fastify.get(
    '/ready',
    {
      schema: {
        description: 'Readiness check endpoint',
        tags: ['Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              ready: { type: 'boolean' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      // Could add checks for JIRA connectivity, database, etc.
      return {
        ready: true,
        timestamp: new Date().toISOString(),
      };
    }
  );

  /**
   * Metrics endpoint
   */
  fastify.get(
    '/metrics',
    {
      schema: {
        description: 'Metrics endpoint',
        tags: ['Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              memory: { type: 'object' },
              cpu: { type: 'object' },
              uptime: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      return {
        memory: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        uptime: process.uptime(),
      };
    }
  );
}
