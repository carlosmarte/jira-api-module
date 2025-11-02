/**
 * IssueService - High-level issue operations
 * Provides human-readable type names, email-based assignment, and bulk operations
 */

import type { JiraClient } from '../core/client.js';
import type { UserService } from './user.service.js';
import type {
  Issue,
  IssueCreateInput,
  IssueCreate,
  IssueUpdateInput,
  IssueUpdate,
  IssueTransition,
  IssueFields,
} from '../models/issue.js';
import { JiraNotFoundError, JiraValidationError } from '../errors/index.js';
import { getLogger } from '../utils/logger.js';
import { textToADF } from '../utils/adf.js';

/**
 * Bulk create result
 */
export interface BulkCreateResult {
  successful: Issue[];
  failed: Array<{ input: IssueCreateInput; error: Error }>;
}

/**
 * Bulk update result
 */
export interface BulkUpdateResult {
  successful: string[];
  failed: Array<{ key: string; error: Error }>;
}

/**
 * IssueService class
 * Provides business logic layer for issue operations
 */
export class IssueService {
  private logger = getLogger();

  constructor(
    private client: JiraClient,
    private userService: UserService
  ) {}

  // ======================
  // CREATION METHODS
  // ======================

  /**
   * Create issue with human-readable type name
   * Automatically resolves issue type name to ID
   */
  async createIssueByTypeName(data: IssueCreateInput): Promise<Issue> {
    this.logger.debug({ data }, 'Creating issue by type name');

    // Validate required fields
    if (!data.projectKey || !data.issueTypeName || !data.summary) {
      throw new JiraValidationError(
        'projectKey, issueTypeName, and summary are required'
      );
    }

    // Resolve issue type name to ID
    const issueTypeId = await this.client.getIssueTypeIdByName(
      data.projectKey,
      data.issueTypeName
    );

    // Resolve assignee email to account ID if provided
    let assigneeId: string | undefined;
    if (data.assigneeEmail) {
      assigneeId = await this.userService.resolveToAccountId(data.assigneeEmail);
    }

    // Build API request
    const createRequest: IssueCreate = {
      fields: {
        project: { key: data.projectKey },
        issuetype: { id: issueTypeId },
        summary: data.summary,
        description: data.description ? textToADF(data.description) : undefined,
        assignee: assigneeId ? { accountId: assigneeId } : undefined,
        priority: data.priority ? { name: data.priority } : undefined,
        labels: data.labels || [],
        parent: data.parentKey ? { key: data.parentKey } : undefined,
      },
    };

    return this.client.createIssue(createRequest);
  }

  /**
   * Create issue with type ID (low-level)
   */
  async createIssue(data: IssueCreate): Promise<Issue> {
    this.logger.debug('Creating issue with type ID');
    return this.client.createIssue(data);
  }

  /**
   * Create bug (convenience method)
   */
  async createBug(
    projectKey: string,
    summary: string,
    description?: string,
    assigneeEmail?: string
  ): Promise<Issue> {
    return this.createIssueByTypeName({
      projectKey,
      issueTypeName: 'Bug',
      summary,
      description,
      assigneeEmail,
    });
  }

  /**
   * Create task (convenience method)
   */
  async createTask(
    projectKey: string,
    summary: string,
    description?: string,
    assigneeEmail?: string
  ): Promise<Issue> {
    return this.createIssueByTypeName({
      projectKey,
      issueTypeName: 'Task',
      summary,
      description,
      assigneeEmail,
    });
  }

  /**
   * Create story (convenience method)
   */
  async createStory(
    projectKey: string,
    summary: string,
    description?: string,
    assigneeEmail?: string
  ): Promise<Issue> {
    return this.createIssueByTypeName({
      projectKey,
      issueTypeName: 'Story',
      summary,
      description,
      assigneeEmail,
    });
  }

  // ======================
  // RETRIEVAL METHODS
  // ======================

  /**
   * Get issue by key
   */
  async getIssue(key: string, fields?: string[]): Promise<Issue> {
    this.logger.debug({ key, fields }, 'Getting issue');
    return this.client.getIssue(key, fields);
  }

  /**
   * Search issues with JQL
   */
  async searchIssues(jql: string, maxResults: number = 50): Promise<Issue[]> {
    this.logger.debug({ jql, maxResults }, 'Searching issues');
    const result = await this.client.searchIssues(jql, maxResults);
    return result.issues || [];
  }

  // ======================
  // UPDATE METHODS
  // ======================

  /**
   * Update issue summary
   */
  async updateIssueSummary(key: string, summary: string): Promise<void> {
    this.logger.debug({ key, summary }, 'Updating issue summary');
    await this.client.updateIssue(key, {
      fields: { summary },
    });
  }

  /**
   * Update issue description
   */
  async updateIssueDescription(key: string, description: string): Promise<void> {
    this.logger.debug({ key }, 'Updating issue description');
    await this.client.updateIssue(key, {
      fields: { description: textToADF(description) },
    });
  }

  /**
   * Update issue fields
   */
  async updateIssue(key: string, fields: Partial<IssueFields>): Promise<void> {
    this.logger.debug({ key, fields }, 'Updating issue');
    await this.client.updateIssue(key, { fields });
  }

  /**
   * Update issue with input format
   */
  async updateIssueWithInput(key: string, input: IssueUpdateInput): Promise<void> {
    this.logger.debug({ key, input }, 'Updating issue with input');

    const update: IssueUpdate = {
      fields: {},
      update: {},
    };

    // Handle field updates
    if (input.summary) {
      update.fields!.summary = input.summary;
    }

    if (input.description) {
      update.fields!.description = textToADF(input.description);
    }

    // Handle label additions
    if (input.labelsAdd && input.labelsAdd.length > 0) {
      update.update!.labels = input.labelsAdd.map((label) => ({ add: label }));
    }

    // Handle label removals
    if (input.labelsRemove && input.labelsRemove.length > 0) {
      update.update!.labels = update.update!.labels || [];
      update.update!.labels.push(...input.labelsRemove.map((label) => ({ remove: label })));
    }

    await this.client.updateIssue(key, update);
  }

  // ======================
  // LABEL MANAGEMENT
  // ======================

  /**
   * Add labels to issue
   */
  async addLabelsToIssue(key: string, labels: string[]): Promise<void> {
    this.logger.debug({ key, labels }, 'Adding labels to issue');
    await this.client.updateIssue(key, {
      update: {
        labels: labels.map((label) => ({ add: label })),
      },
    });
  }

  /**
   * Remove labels from issue
   */
  async removeLabelsFromIssue(key: string, labels: string[]): Promise<void> {
    this.logger.debug({ key, labels }, 'Removing labels from issue');
    await this.client.updateIssue(key, {
      update: {
        labels: labels.map((label) => ({ remove: label })),
      },
    });
  }

  // ======================
  // ASSIGNMENT METHODS
  // ======================

  /**
   * Assign issue by email
   */
  async assignIssueByEmail(key: string, email: string): Promise<void> {
    this.logger.debug({ key, email }, 'Assigning issue by email');
    const accountId = await this.userService.resolveToAccountId(email);
    await this.client.assignIssue(key, accountId);
  }

  /**
   * Assign issue by account ID
   */
  async assignIssueById(key: string, accountId: string): Promise<void> {
    this.logger.debug({ key, accountId }, 'Assigning issue by ID');
    await this.client.assignIssue(key, accountId);
  }

  /**
   * Unassign issue
   */
  async unassignIssue(key: string): Promise<void> {
    this.logger.debug({ key }, 'Unassigning issue');
    await this.client.assignIssue(key, null);
  }

  // ======================
  // TRANSITION METHODS
  // ======================

  /**
   * Get available transitions for issue
   */
  async getAvailableTransitions(key: string): Promise<IssueTransition[]> {
    this.logger.debug({ key }, 'Getting available transitions');
    return this.client.getIssueTransitions(key);
  }

  /**
   * Transition issue by name
   */
  async transitionIssueByName(
    key: string,
    transitionName: string,
    comment?: string
  ): Promise<void> {
    this.logger.debug({ key, transitionName }, 'Transitioning issue by name');

    // Get available transitions
    const transitions = await this.client.getIssueTransitions(key);

    // Find transition by name (case-insensitive)
    const transition = transitions.find(
      (t) => t.name.toLowerCase() === transitionName.toLowerCase()
    );

    if (!transition) {
      const availableNames = transitions.map((t) => t.name).join(', ');
      throw new JiraNotFoundError(
        `Transition '${transitionName}' not found for issue ${key}. Available: ${availableNames}`
      );
    }

    // Execute transition
    await this.client.transitionIssue(key, {
      transition: { id: transition.id },
      update: comment
        ? {
            comment: [{ add: { body: textToADF(comment) } }],
          }
        : undefined,
    });
  }

  /**
   * Transition issue by ID
   */
  async transitionIssueById(
    key: string,
    transitionId: string,
    comment?: string
  ): Promise<void> {
    this.logger.debug({ key, transitionId }, 'Transitioning issue by ID');

    await this.client.transitionIssue(key, {
      transition: { id: transitionId },
      update: comment
        ? {
            comment: [{ add: { body: textToADF(comment) } }],
          }
        : undefined,
    });
  }

  // ======================
  // BULK OPERATIONS
  // ======================

  /**
   * Bulk create issues
   * Creates multiple issues with concurrency control
   */
  async bulkCreateIssues(
    issues: IssueCreateInput[],
    concurrency: number = 5
  ): Promise<BulkCreateResult> {
    this.logger.info({ count: issues.length, concurrency }, 'Bulk creating issues');

    const successful: Issue[] = [];
    const failed: Array<{ input: IssueCreateInput; error: Error }> = [];

    // Process in batches
    for (let i = 0; i < issues.length; i += concurrency) {
      const batch = issues.slice(i, i + concurrency);
      const results = await Promise.allSettled(
        batch.map((issue) => this.createIssueByTypeName(issue))
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value);
        } else {
          failed.push({
            input: batch[index]!,
            error: result.reason as Error,
          });
        }
      });

      this.logger.debug({ processed: i + batch.length, total: issues.length }, 'Batch complete');
    }

    this.logger.info(
      { successful: successful.length, failed: failed.length },
      'Bulk create complete'
    );

    return { successful, failed };
  }

  /**
   * Bulk update issues
   */
  async bulkUpdateIssues(
    updates: Array<{ key: string; fields: Partial<IssueFields> }>,
    concurrency: number = 5
  ): Promise<BulkUpdateResult> {
    this.logger.info({ count: updates.length, concurrency }, 'Bulk updating issues');

    const successful: string[] = [];
    const failed: Array<{ key: string; error: Error }> = [];

    // Process in batches
    for (let i = 0; i < updates.length; i += concurrency) {
      const batch = updates.slice(i, i + concurrency);
      const results = await Promise.allSettled(
        batch.map((update) => this.updateIssue(update.key, update.fields))
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(batch[index]!.key);
        } else {
          failed.push({
            key: batch[index]!.key,
            error: result.reason as Error,
          });
        }
      });

      this.logger.debug({ processed: i + batch.length, total: updates.length }, 'Batch complete');
    }

    this.logger.info(
      { successful: successful.length, failed: failed.length },
      'Bulk update complete'
    );

    return { successful, failed };
  }
}
