/**
 * REST Server entry point
 * Fastify-based REST API for JIRA operations
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { loadConfig } from '../utils/config.js';
import { JiraClient } from '../core/client.js';
import { UserService } from '../services/user.service.js';
import { IssueService } from '../services/issue.service.js';
import { ProjectService } from '../services/project.service.js';
import { errorHandler } from './middleware/error-handler.js';
import { authMiddleware } from './middleware/auth.js';
import { userRoutes } from './routes/user.routes.js';
import { issueRoutes } from './routes/issue.routes.js';
import { projectRoutes } from './routes/project.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import { webhookRoutes } from './routes/webhook.routes.js';
import { batchRoutes } from './routes/batch.routes.js';

export interface ServerConfig {
  host?: string;
  port?: number;
  apiKey?: string;
  corsOrigins?: string[];
  rateLimitMax?: number;
  rateLimitWindow?: string;
}

/**
 * Create and configure Fastify server
 */
export async function createServer(config?: ServerConfig) {
  const serverConfig = {
    host: config?.host || process.env.SERVER_HOST || '0.0.0.0',
    port: config?.port || parseInt(process.env.SERVER_PORT || '3000', 10),
    apiKey: config?.apiKey || process.env.API_KEY || 'dev-key-change-me',
    corsOrigins: config?.corsOrigins || ['*'],
    rateLimitMax: config?.rateLimitMax || 100,
    rateLimitWindow: config?.rateLimitWindow || '1 minute',
  };

  // Create Fastify instance
  const fastify = Fastify({
    logger: true,
    trustProxy: true,
    disableRequestLogging: false,
  });

  // Register CORS
  await fastify.register(cors, {
    origin: serverConfig.corsOrigins,
    credentials: true,
  });

  // Register rate limiting
  await fastify.register(rateLimit, {
    max: serverConfig.rateLimitMax,
    timeWindow: serverConfig.rateLimitWindow,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
    }),
  });

  // Register Swagger
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'JIRA API Module',
        description: 'REST API for JIRA Cloud operations',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://${serverConfig.host}:${serverConfig.port}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
          },
        },
      },
      security: [{ apiKey: [] }],
    },
  });

  // Register Swagger UI
  await fastify.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Initialize JIRA client and services
  const jiraConfig = await loadConfig();
  const client = new JiraClient(jiraConfig);
  const userService = new UserService(client);
  const issueService = new IssueService(client, userService);
  const projectService = new ProjectService(client);

  // Decorate fastify instance with services
  fastify.decorate('jiraClient', client);
  fastify.decorate('userService', userService);
  fastify.decorate('issueService', issueService);
  fastify.decorate('projectService', projectService);

  // Register authentication middleware
  fastify.decorate('authenticate', authMiddleware(serverConfig.apiKey));

  // Register error handler
  fastify.setErrorHandler(errorHandler);

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(userRoutes, { prefix: '/api/v1' });
  await fastify.register(issueRoutes, { prefix: '/api/v1' });
  await fastify.register(projectRoutes, { prefix: '/api/v1' });
  await fastify.register(webhookRoutes);
  await fastify.register(batchRoutes);

  return fastify;
}

/**
 * Start server
 */
export async function startServer(config?: ServerConfig) {
  const fastify = await createServer(config);
  const host = config?.host || process.env.SERVER_HOST || '0.0.0.0';
  const port = config?.port || parseInt(process.env.SERVER_PORT || '3000', 10);

  try {
    await fastify.listen({ host, port });
    fastify.log.info(`Server listening on ${host}:${port}`);
    fastify.log.info(`API documentation available at http://${host}:${port}/docs`);
    return fastify;
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
