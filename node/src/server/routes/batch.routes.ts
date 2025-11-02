/**
 * Batch operation routes
 */

import type { FastifyInstance } from 'fastify';
import { createBatchProcessor } from '../../utils/batch.js';
import type { IssueCreateInput } from '../../models/issue.js';

interface BatchCreateRequest {
  Body: {
    issues: IssueCreateInput[];
    options?: {
      concurrency?: number;
      continueOnError?: boolean;
      retries?: number;
      retryDelay?: number;
    };
  };
}

interface BatchUpdateRequest {
  Body: {
    updates: Array<{ key: string; summary?: string; description?: string }>;
    options?: {
      concurrency?: number;
      continueOnError?: boolean;
      retries?: number;
      retryDelay?: number;
    };
  };
}

interface BatchAssignRequest {
  Body: {
    assignments: Array<{ key: string; email: string }>;
    options?: {
      concurrency?: number;
      continueOnError?: boolean;
      retries?: number;
      retryDelay?: number;
    };
  };
}

interface BatchUnassignRequest {
  Body: {
    keys: string[];
    options?: {
      concurrency?: number;
      continueOnError?: boolean;
      retries?: number;
      retryDelay?: number;
    };
  };
}

interface BatchAddLabelsRequest {
  Body: {
    operations: Array<{ key: string; labels: string[] }>;
    options?: {
      concurrency?: number;
      continueOnError?: boolean;
      retries?: number;
      retryDelay?: number;
    };
  };
}

interface BatchTransitionRequest {
  Body: {
    transitions: Array<{ key: string; transitionName: string; comment?: string }>;
    options?: {
      concurrency?: number;
      continueOnError?: boolean;
      retries?: number;
      retryDelay?: number;
    };
  };
}

/**
 * Register batch operation routes
 */
export async function batchRoutes(fastify: FastifyInstance): Promise<void> {
  const batchProcessor = createBatchProcessor(fastify.issueService);

  /**
   * Create multiple issues in batch
   */
  fastify.post<BatchCreateRequest>(
    '/api/v1/batch/issues/create',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Create multiple issues in batch',
        tags: ['batch'],
        body: {
          type: 'object',
          required: ['issues'],
          properties: {
            issues: {
              type: 'array',
              items: {
                type: 'object',
                required: ['projectKey', 'summary', 'issueType'],
                properties: {
                  projectKey: { type: 'string' },
                  summary: { type: 'string' },
                  description: { type: 'string' },
                  issueType: { type: 'string' },
                  assignee: { type: 'string' },
                  priority: { type: 'string' },
                  labels: { type: 'array', items: { type: 'string' } },
                },
              },
            },
            options: {
              type: 'object',
              properties: {
                concurrency: { type: 'number' },
                continueOnError: { type: 'boolean' },
                retries: { type: 'number' },
                retryDelay: { type: 'number' },
              },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'array', items: { type: 'string' } },
              failures: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    index: { type: 'number' },
                    error: { type: 'string' },
                  },
                },
              },
              total: { type: 'number' },
              successCount: { type: 'number' },
              failureCount: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const result = await batchProcessor.createIssues(request.body.issues, request.body.options);

      return reply.code(200).send({
        ...result,
        failures: result.failures.map((f) => ({
          index: f.index,
          error: f.error.message,
        })),
      });
    }
  );

  /**
   * Update multiple issues in batch
   */
  fastify.post<BatchUpdateRequest>(
    '/api/v1/batch/issues/update',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Update multiple issues in batch',
        tags: ['batch'],
        body: {
          type: 'object',
          required: ['updates'],
          properties: {
            updates: {
              type: 'array',
              items: {
                type: 'object',
                required: ['key'],
                properties: {
                  key: { type: 'string' },
                  summary: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
            options: {
              type: 'object',
              properties: {
                concurrency: { type: 'number' },
                continueOnError: { type: 'boolean' },
                retries: { type: 'number' },
                retryDelay: { type: 'number' },
              },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'array', items: { type: 'string' } },
              failures: { type: 'array' },
              total: { type: 'number' },
              successCount: { type: 'number' },
              failureCount: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const result = await batchProcessor.updateIssues(request.body.updates, request.body.options);

      return reply.code(200).send({
        ...result,
        failures: result.failures.map((f) => ({
          index: f.index,
          error: f.error.message,
        })),
      });
    }
  );

  /**
   * Assign multiple issues in batch
   */
  fastify.post<BatchAssignRequest>(
    '/api/v1/batch/issues/assign',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Assign multiple issues in batch',
        tags: ['batch'],
        body: {
          type: 'object',
          required: ['assignments'],
          properties: {
            assignments: {
              type: 'array',
              items: {
                type: 'object',
                required: ['key', 'email'],
                properties: {
                  key: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
            options: {
              type: 'object',
              properties: {
                concurrency: { type: 'number' },
                continueOnError: { type: 'boolean' },
                retries: { type: 'number' },
                retryDelay: { type: 'number' },
              },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'array', items: { type: 'string' } },
              failures: { type: 'array' },
              total: { type: 'number' },
              successCount: { type: 'number' },
              failureCount: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const result = await batchProcessor.assignIssues(
        request.body.assignments,
        request.body.options
      );

      return reply.code(200).send({
        ...result,
        failures: result.failures.map((f) => ({
          index: f.index,
          error: f.error.message,
        })),
      });
    }
  );

  /**
   * Unassign multiple issues in batch
   */
  fastify.post<BatchUnassignRequest>(
    '/api/v1/batch/issues/unassign',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Unassign multiple issues in batch',
        tags: ['batch'],
        body: {
          type: 'object',
          required: ['keys'],
          properties: {
            keys: {
              type: 'array',
              items: { type: 'string' },
            },
            options: {
              type: 'object',
              properties: {
                concurrency: { type: 'number' },
                continueOnError: { type: 'boolean' },
                retries: { type: 'number' },
                retryDelay: { type: 'number' },
              },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'array', items: { type: 'string' } },
              failures: { type: 'array' },
              total: { type: 'number' },
              successCount: { type: 'number' },
              failureCount: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const result = await batchProcessor.unassignIssues(request.body.keys, request.body.options);

      return reply.code(200).send({
        ...result,
        failures: result.failures.map((f) => ({
          index: f.index,
          error: f.error.message,
        })),
      });
    }
  );

  /**
   * Add labels to multiple issues in batch
   */
  fastify.post<BatchAddLabelsRequest>(
    '/api/v1/batch/issues/labels',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Add labels to multiple issues in batch',
        tags: ['batch'],
        body: {
          type: 'object',
          required: ['operations'],
          properties: {
            operations: {
              type: 'array',
              items: {
                type: 'object',
                required: ['key', 'labels'],
                properties: {
                  key: { type: 'string' },
                  labels: { type: 'array', items: { type: 'string' } },
                },
              },
            },
            options: {
              type: 'object',
              properties: {
                concurrency: { type: 'number' },
                continueOnError: { type: 'boolean' },
                retries: { type: 'number' },
                retryDelay: { type: 'number' },
              },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'array', items: { type: 'string' } },
              failures: { type: 'array' },
              total: { type: 'number' },
              successCount: { type: 'number' },
              failureCount: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const result = await batchProcessor.addLabelsToIssues(
        request.body.operations,
        request.body.options
      );

      return reply.code(200).send({
        ...result,
        failures: result.failures.map((f) => ({
          index: f.index,
          error: f.error.message,
        })),
      });
    }
  );

  /**
   * Transition multiple issues in batch
   */
  fastify.post<BatchTransitionRequest>(
    '/api/v1/batch/issues/transition',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Transition multiple issues in batch',
        tags: ['batch'],
        body: {
          type: 'object',
          required: ['transitions'],
          properties: {
            transitions: {
              type: 'array',
              items: {
                type: 'object',
                required: ['key', 'transitionName'],
                properties: {
                  key: { type: 'string' },
                  transitionName: { type: 'string' },
                  comment: { type: 'string' },
                },
              },
            },
            options: {
              type: 'object',
              properties: {
                concurrency: { type: 'number' },
                continueOnError: { type: 'boolean' },
                retries: { type: 'number' },
                retryDelay: { type: 'number' },
              },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'array', items: { type: 'string' } },
              failures: { type: 'array' },
              total: { type: 'number' },
              successCount: { type: 'number' },
              failureCount: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const result = await batchProcessor.transitionIssues(
        request.body.transitions,
        request.body.options
      );

      return reply.code(200).send({
        ...result,
        failures: result.failures.map((f) => ({
          index: f.index,
          error: f.error.message,
        })),
      });
    }
  );
}
