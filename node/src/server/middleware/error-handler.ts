/**
 * Error handler middleware
 * Handles errors and maps them to appropriate HTTP responses
 */

import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import {
  JiraAPIError,
  JiraAuthenticationError,
  JiraPermissionError,
  JiraNotFoundError,
  JiraValidationError,
  JiraRateLimitError,
  JiraServerError,
} from '../../errors/index.js';

/**
 * Error handler
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error({ err: error }, 'Request error');

  // Handle JIRA API errors
  if (error instanceof JiraAuthenticationError) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: error.message,
    });
  }

  if (error instanceof JiraPermissionError) {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: error.message,
    });
  }

  if (error instanceof JiraNotFoundError) {
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: error.message,
    });
  }

  if (error instanceof JiraValidationError) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: error.message,
    });
  }

  if (error instanceof JiraRateLimitError) {
    return reply.status(429).send({
      statusCode: 429,
      error: 'Too Many Requests',
      message: error.message,
      retryAfter: error.retryAfter,
    });
  }

  if (error instanceof JiraServerError) {
    return reply.status(502).send({
      statusCode: 502,
      error: 'Bad Gateway',
      message: 'JIRA server error',
    });
  }

  if (error instanceof JiraAPIError) {
    return reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: 'JIRA API Error',
      message: error.message,
    });
  }

  // Handle Fastify validation errors
  if (error.validation) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Validation Error',
      message: 'Request validation failed',
      details: error.validation,
    });
  }

  // Handle generic errors
  return reply.status(error.statusCode || 500).send({
    statusCode: error.statusCode || 500,
    error: error.name || 'Internal Server Error',
    message: error.message || 'An unexpected error occurred',
  });
}
