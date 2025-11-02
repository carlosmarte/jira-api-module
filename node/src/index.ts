/**
 * JIRA API Module - Main Entry Point
 * NodeJS/TypeScript JIRA API integration with CLI, REST server, and SDK interfaces
 *
 * @packageDocumentation
 */

// Core exports
export { JiraClient, type JiraClientConfig } from './core/client.js';
export type * from './core/types.js';

// Service exports
export { UserService } from './services/user.service.js';
export { IssueService, type BulkCreateResult, type BulkUpdateResult } from './services/issue.service.js';
export { ProjectService } from './services/project.service.js';

// Models and types
export type * from './models/common.js';
export type * from './models/user.js';
export type * from './models/issue.js';
export type * from './models/project.js';

// Validation schemas
export {
  UserSchema,
  UserReferenceSchema,
} from './models/user.js';

export {
  ProjectSchema,
  IssueTypeSchema,
  ProjectVersionSchema,
  VersionCreateInputSchema,
} from './models/project.js';

export {
  IssueSchema,
  IssueCreateInputSchema,
  IssueUpdateInputSchema,
} from './models/issue.js';

// Error classes
export {
  JiraAPIError,
  JiraAuthenticationError,
  JiraPermissionError,
  JiraNotFoundError,
  JiraValidationError,
  JiraRateLimitError,
  JiraServerError,
  SDKError,
  mapHttpError,
  isJiraError,
  isAuthError,
  isRateLimitError,
} from './errors/index.js';

// Configuration
export {
  loadConfig,
  saveConfig,
  validatePartialConfig,
  getRequiredEnvVars,
  type Config,
} from './utils/config.js';

// Logger
export {
  createLogger,
  getLogger,
  createContextLogger,
  logRequest,
  logResponse,
  logError,
  logWarning,
  logDebug,
  setLogLevel,
  type Logger,
  type LogContext,
} from './utils/logger.js';

// ADF utilities
export {
  textToADF,
  markdownToADF,
  adfToText,
  emptyADF,
  isEmptyADF,
} from './utils/adf.js';

// Enhanced features - Caching
export {
  Cache,
  initializeCache,
  getCache,
  type CacheConfig,
  type CacheProvider,
} from './utils/cache.js';

// Enhanced features - Query Builder
export {
  JQLQueryBuilder,
  jql,
  type JQLOperator,
  type JQLOrder,
} from './utils/query-builder.js';

// Enhanced features - Webhooks
export {
  WebhookManager,
  WebhookEventType,
  initializeWebhookManager,
  getWebhookManager,
  WebhookEventSchema,
  WebhookUserSchema,
  WebhookIssueSchema,
  WebhookCommentSchema,
  WebhookChangelogSchema,
  type WebhookEvent,
  type WebhookUser,
  type WebhookIssue,
  type WebhookComment,
  type WebhookChangelog,
  type WebhookHandler,
} from './utils/webhook.js';

// Enhanced features - Batch Operations
export {
  BatchProcessor,
  createBatchProcessor,
  chunk,
  type BatchResult,
  type BatchOptions,
} from './utils/batch.js';
