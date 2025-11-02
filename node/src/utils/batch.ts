/**
 * Batch Operations
 * Efficiently process multiple JIRA operations in parallel
 */

import type { IssueService } from '../services/issue.service.js';
import type { IssueCreateInput } from '../models/issue.js';
import { getLogger } from './logger.js';

const logger = getLogger();

/**
 * Batch operation result
 */
export interface BatchResult<T> {
  success: T[];
  failures: Array<{
    index: number;
    error: Error;
    input: any;
  }>;
  total: number;
  successCount: number;
  failureCount: number;
}

/**
 * Batch operation options
 */
export interface BatchOptions {
  concurrency?: number; // Max concurrent operations
  continueOnError?: boolean; // Continue processing if an operation fails
  retries?: number; // Number of retries for failed operations
  retryDelay?: number; // Delay between retries in ms
}

/**
 * Batch processor for JIRA operations
 */
export class BatchProcessor {
  private issueService: IssueService;
  private defaultOptions: Required<BatchOptions> = {
    concurrency: 5,
    continueOnError: true,
    retries: 2,
    retryDelay: 1000,
  };

  constructor(issueService: IssueService) {
    this.issueService = issueService;
  }

  /**
   * Create multiple issues in batch
   */
  async createIssues(
    issues: IssueCreateInput[],
    options?: BatchOptions
  ): Promise<BatchResult<string>> {
    const opts = { ...this.defaultOptions, ...options };

    logger.info({ count: issues.length, options: opts }, 'Creating issues in batch');

    const results = await this.processBatch(
      issues,
      async (issue) => {
        const created = await this.issueService.createIssueByTypeName(issue);
        return created.key;
      },
      opts
    );

    logger.info(
      { successCount: results.successCount, failureCount: results.failureCount },
      'Batch create completed'
    );

    return results;
  }

  /**
   * Update multiple issues in batch
   */
  async updateIssues(
    updates: Array<{ key: string; summary?: string; description?: string }>,
    options?: BatchOptions
  ): Promise<BatchResult<string>> {
    const opts = { ...this.defaultOptions, ...options };

    logger.info({ count: updates.length, options: opts }, 'Updating issues in batch');

    const results = await this.processBatch(
      updates,
      async (update) => {
        if (update.summary) {
          await this.issueService.updateIssueSummary(update.key, update.summary);
        }
        if (update.description) {
          await this.issueService.updateIssueDescription(update.key, update.description);
        }
        return update.key;
      },
      opts
    );

    logger.info(
      { successCount: results.successCount, failureCount: results.failureCount },
      'Batch update completed'
    );

    return results;
  }

  /**
   * Assign multiple issues in batch
   */
  async assignIssues(
    assignments: Array<{ key: string; email: string }>,
    options?: BatchOptions
  ): Promise<BatchResult<string>> {
    const opts = { ...this.defaultOptions, ...options };

    logger.info({ count: assignments.length, options: opts }, 'Assigning issues in batch');

    const results = await this.processBatch(
      assignments,
      async (assignment) => {
        await this.issueService.assignIssueByEmail(assignment.key, assignment.email);
        return assignment.key;
      },
      opts
    );

    logger.info(
      { successCount: results.successCount, failureCount: results.failureCount },
      'Batch assign completed'
    );

    return results;
  }

  /**
   * Unassign multiple issues in batch
   */
  async unassignIssues(keys: string[], options?: BatchOptions): Promise<BatchResult<string>> {
    const opts = { ...this.defaultOptions, ...options };

    logger.info({ count: keys.length, options: opts }, 'Unassigning issues in batch');

    const results = await this.processBatch(
      keys,
      async (key) => {
        await this.issueService.unassignIssue(key);
        return key;
      },
      opts
    );

    logger.info(
      { successCount: results.successCount, failureCount: results.failureCount },
      'Batch unassign completed'
    );

    return results;
  }

  /**
   * Add labels to multiple issues in batch
   */
  async addLabelsToIssues(
    operations: Array<{ key: string; labels: string[] }>,
    options?: BatchOptions
  ): Promise<BatchResult<string>> {
    const opts = { ...this.defaultOptions, ...options };

    logger.info({ count: operations.length, options: opts }, 'Adding labels in batch');

    const results = await this.processBatch(
      operations,
      async (operation) => {
        await this.issueService.addLabelsToIssue(operation.key, operation.labels);
        return operation.key;
      },
      opts
    );

    logger.info(
      { successCount: results.successCount, failureCount: results.failureCount },
      'Batch add labels completed'
    );

    return results;
  }

  /**
   * Transition multiple issues in batch
   */
  async transitionIssues(
    transitions: Array<{ key: string; transitionName: string; comment?: string }>,
    options?: BatchOptions
  ): Promise<BatchResult<string>> {
    const opts = { ...this.defaultOptions, ...options };

    logger.info({ count: transitions.length, options: opts }, 'Transitioning issues in batch');

    const results = await this.processBatch(
      transitions,
      async (transition) => {
        await this.issueService.transitionIssueByName(
          transition.key,
          transition.transitionName,
          transition.comment
        );
        return transition.key;
      },
      opts
    );

    logger.info(
      { successCount: results.successCount, failureCount: results.failureCount },
      'Batch transition completed'
    );

    return results;
  }

  /**
   * Generic batch processor with concurrency control
   */
  private async processBatch<TInput, TOutput>(
    items: TInput[],
    operation: (item: TInput) => Promise<TOutput>,
    options: Required<BatchOptions>
  ): Promise<BatchResult<TOutput>> {
    const results: TOutput[] = [];
    const failures: Array<{ index: number; error: Error; input: TInput }> = [];

    // Process items in chunks based on concurrency
    for (let i = 0; i < items.length; i += options.concurrency) {
      const chunk = items.slice(i, i + options.concurrency);
      const promises = chunk.map(async (item, chunkIndex) => {
        const itemIndex = i + chunkIndex;
        return this.processWithRetry(item, operation, itemIndex, options);
      });

      const chunkResults = await Promise.allSettled(promises);

      chunkResults.forEach((result, chunkIndex) => {
        const itemIndex = i + chunkIndex;
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          const error =
            result.reason instanceof Error ? result.reason : new Error(String(result.reason));
          const failedItem = chunk[chunkIndex];
          if (failedItem !== undefined) {
            failures.push({
              index: itemIndex,
              error,
              input: failedItem,
            });
          }

          logger.error(
            { index: itemIndex, error: error.message },
            'Batch operation failed for item'
          );

          if (!options.continueOnError) {
            throw error;
          }
        }
      });
    }

    return {
      success: results,
      failures,
      total: items.length,
      successCount: results.length,
      failureCount: failures.length,
    };
  }

  /**
   * Process single item with retry logic
   */
  private async processWithRetry<TInput, TOutput>(
    item: TInput,
    operation: (item: TInput) => Promise<TOutput>,
    index: number,
    options: Required<BatchOptions>
  ): Promise<TOutput> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= options.retries; attempt++) {
      try {
        return await operation(item);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < options.retries) {
          logger.warn(
            { index, attempt: attempt + 1, maxRetries: options.retries, error: lastError.message },
            'Retrying batch operation'
          );

          // Wait before retrying (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, options.retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }

    throw lastError || new Error('Operation failed');
  }
}

/**
 * Create a batch processor
 */
export function createBatchProcessor(issueService: IssueService): BatchProcessor {
  return new BatchProcessor(issueService);
}

/**
 * Helper function to chunk an array
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
