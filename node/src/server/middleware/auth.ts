/**
 * Authentication middleware
 * Validates API key from request headers
 */

import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Create authentication middleware
 */
export function authMiddleware(apiKey: string) {
  return async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    const requestApiKey = request.headers['x-api-key'];

    if (!requestApiKey) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Missing API key. Provide X-API-Key header.',
      });
    }

    if (requestApiKey !== apiKey) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid API key.',
      });
    }
  };
}
