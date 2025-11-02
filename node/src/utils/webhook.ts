/**
 * Webhook Handler
 * Processes incoming JIRA webhook events
 */

import { EventEmitter } from 'eventemitter3';
import { z } from 'zod';
import { getLogger } from './logger.js';

/**
 * Supported JIRA webhook event types
 */
export enum WebhookEventType {
  ISSUE_CREATED = 'jira:issue_created',
  ISSUE_UPDATED = 'jira:issue_updated',
  ISSUE_DELETED = 'jira:issue_deleted',
  ISSUE_ASSIGNED = 'jira:issue_assigned',
  ISSUE_COMMENTED = 'jira:issue_commented',
  SPRINT_CREATED = 'jira:sprint_created',
  SPRINT_STARTED = 'jira:sprint_started',
  SPRINT_CLOSED = 'jira:sprint_closed',
  VERSION_CREATED = 'jira:version_created',
  VERSION_RELEASED = 'jira:version_released',
  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
}

/**
 * Webhook event schemas
 */
export const WebhookUserSchema = z.object({
  accountId: z.string(),
  emailAddress: z.string().email().optional(),
  displayName: z.string(),
});

export const WebhookIssueSchema = z.object({
  id: z.string(),
  key: z.string(),
  self: z.string().url(),
  fields: z.object({
    summary: z.string(),
    status: z.object({
      name: z.string(),
    }),
    assignee: WebhookUserSchema.nullable(),
    reporter: WebhookUserSchema,
    priority: z.object({
      name: z.string(),
    }).optional(),
    issuetype: z.object({
      name: z.string(),
    }),
    created: z.string(),
    updated: z.string(),
  }),
});

export const WebhookCommentSchema = z.object({
  id: z.string(),
  author: WebhookUserSchema,
  body: z.string(),
  created: z.string(),
  updated: z.string(),
});

export const WebhookChangelogSchema = z.object({
  id: z.string(),
  items: z.array(
    z.object({
      field: z.string(),
      fieldtype: z.string(),
      from: z.string().nullable(),
      fromString: z.string().nullable(),
      to: z.string().nullable(),
      toString: z.string().nullable(),
    })
  ),
});

export const WebhookEventSchema = z.object({
  timestamp: z.number(),
  webhookEvent: z.string(),
  user: WebhookUserSchema.optional(),
  issue: WebhookIssueSchema.optional(),
  comment: WebhookCommentSchema.optional(),
  changelog: WebhookChangelogSchema.optional(),
});

export type WebhookEvent = z.infer<typeof WebhookEventSchema>;
export type WebhookUser = z.infer<typeof WebhookUserSchema>;
export type WebhookIssue = z.infer<typeof WebhookIssueSchema>;
export type WebhookComment = z.infer<typeof WebhookCommentSchema>;
export type WebhookChangelog = z.infer<typeof WebhookChangelogSchema>;

/**
 * Webhook handler callback function
 */
export type WebhookHandler = (event: WebhookEvent) => void | Promise<void>;

/**
 * Webhook manager
 */
export class WebhookManager extends EventEmitter {
  private logger = getLogger();
  private secret?: string;

  constructor(secret?: string) {
    super();
    this.secret = secret;
  }

  /**
   * Process incoming webhook event
   */
  async processEvent(payload: unknown, signature?: string): Promise<void> {
    try {
      // Validate signature if secret is configured
      if (this.secret && signature) {
        const isValid = await this.verifySignature(payload, signature);
        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
      }

      // Validate payload
      const event = WebhookEventSchema.parse(payload);

      this.logger.info(
        {
          eventType: event.webhookEvent,
          issueKey: event.issue?.key,
        },
        'Processing webhook event'
      );

      // Emit event to registered handlers
      this.emit(event.webhookEvent, event);
      this.emit('*', event); // Emit wildcard event for all events

      this.logger.debug({ event }, 'Webhook event processed');
    } catch (error) {
      this.logger.error({ error, payload }, 'Failed to process webhook event');
      throw error;
    }
  }

  /**
   * Register handler for specific event type
   * Use the inherited EventEmitter methods directly
   */

  /**
   * Verify webhook signature (HMAC SHA256)
   */
  private async verifySignature(payload: unknown, signature: string): Promise<boolean> {
    if (!this.secret) {
      return true;
    }

    try {
      const crypto = await import('crypto');
      const hmac = crypto.createHmac('sha256', this.secret);
      const body = JSON.stringify(payload);
      hmac.update(body);
      const expectedSignature = `sha256=${hmac.digest('hex')}`;

      return signature === expectedSignature;
    } catch (error) {
      this.logger.error({ error }, 'Failed to verify webhook signature');
      return false;
    }
  }

  /**
   * Get change summary from changelog
   */
  static getChangeSummary(changelog?: WebhookChangelog): Record<string, { from: string | null; to: string | null }> {
    if (!changelog) {
      return {};
    }

    const changes: Record<string, { from: string | null; to: string | null }> = {};

    for (const item of changelog.items) {
      changes[item.field] = {
        from: item.fromString || item.from,
        to: item.toString || item.to,
      };
    }

    return changes;
  }

  /**
   * Check if issue was assigned
   */
  static wasAssigned(changelog?: WebhookChangelog): boolean {
    if (!changelog) {
      return false;
    }

    return changelog.items.some(
      (item) => item.field === 'assignee' && item.to !== null
    );
  }

  /**
   * Check if status changed
   */
  static statusChanged(changelog?: WebhookChangelog): boolean {
    if (!changelog) {
      return false;
    }

    return changelog.items.some((item) => item.field === 'status');
  }

  /**
   * Get new status from changelog
   */
  static getNewStatus(changelog?: WebhookChangelog): string | null {
    if (!changelog) {
      return null;
    }

    const statusChange = changelog.items.find((item) => item.field === 'status');
    return statusChange?.toString || null;
  }
}

/**
 * Global webhook manager instance
 */
let globalWebhookManager: WebhookManager | null = null;

/**
 * Initialize global webhook manager
 */
export function initializeWebhookManager(secret?: string): WebhookManager {
  globalWebhookManager = new WebhookManager(secret);
  return globalWebhookManager;
}

/**
 * Get global webhook manager instance
 */
export function getWebhookManager(): WebhookManager {
  if (!globalWebhookManager) {
    globalWebhookManager = new WebhookManager();
  }
  return globalWebhookManager;
}
