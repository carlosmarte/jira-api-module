/**
 * Batch Operations tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BatchProcessor, createBatchProcessor, chunk } from '../../../src/utils/batch.js';
import type { IssueService } from '../../../src/services/issue.service.js';
import type { Issue, IssueCreateInput } from '../../../src/models/issue.js';

describe('BatchProcessor', () => {
  let mockIssueService: IssueService;
  let batchProcessor: BatchProcessor;

  beforeEach(() => {
    // Create mock issue service
    mockIssueService = {
      createIssueByTypeName: vi.fn(),
      updateIssueSummary: vi.fn(),
      updateIssueDescription: vi.fn(),
      assignIssueByEmail: vi.fn(),
      unassignIssue: vi.fn(),
      addLabelsToIssue: vi.fn(),
      transitionIssueByName: vi.fn(),
    } as any;

    batchProcessor = createBatchProcessor(mockIssueService);
  });

  describe('Create Issues', () => {
    it('should create multiple issues successfully', async () => {
      const issues: IssueCreateInput[] = [
        { projectKey: 'PROJ', issueTypeName: 'Bug', summary: 'Bug 1' },
        { projectKey: 'PROJ', issueTypeName: 'Task', summary: 'Task 1' },
      ];

      (mockIssueService.createIssueByTypeName as any).mockImplementation(async (input: IssueCreateInput) => ({
        key: `PROJ-${input.summary}`,
        fields: { summary: input.summary },
      } as Issue));

      const result = await batchProcessor.createIssues(issues);

      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(result.success).toHaveLength(2);
      expect(mockIssueService.createIssueByTypeName).toHaveBeenCalledTimes(2);
    });

    it('should handle create failures with continueOnError', async () => {
      const issues: IssueCreateInput[] = [
        { projectKey: 'PROJ', issueTypeName: 'Bug', summary: 'Bug 1' },
        { projectKey: 'PROJ', issueTypeName: 'Task', summary: 'Task 1' },
        { projectKey: 'PROJ', issueTypeName: 'Bug', summary: 'Bug 2' },
      ];

      (mockIssueService.createIssueByTypeName as any).mockImplementation(async (input: IssueCreateInput) => {
        if (input.summary === 'Task 1') {
          throw new Error('Failed to create task');
        }
        return { key: `PROJ-${input.summary}`, fields: { summary: input.summary } } as Issue;
      });

      const result = await batchProcessor.createIssues(issues, { continueOnError: true });

      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(1);
      expect(result.failures[0].index).toBe(1);
      expect(result.failures[0].error.message).toBe('Failed to create task');
    });

    it('should respect concurrency limit', async () => {
      const issues: IssueCreateInput[] = Array.from({ length: 10 }, (_, i) => ({
        projectKey: 'PROJ',
        issueTypeName: 'Bug',
        summary: `Bug ${i}`,
      }));

      let concurrentCalls = 0;
      let maxConcurrentCalls = 0;

      (mockIssueService.createIssueByTypeName as any).mockImplementation(async (input: IssueCreateInput) => {
        concurrentCalls++;
        maxConcurrentCalls = Math.max(maxConcurrentCalls, concurrentCalls);

        await new Promise((resolve) => setTimeout(resolve, 10));

        concurrentCalls--;
        return { key: `PROJ-${input.summary}`, fields: { summary: input.summary } } as Issue;
      });

      await batchProcessor.createIssues(issues, { concurrency: 3 });

      expect(maxConcurrentCalls).toBeLessThanOrEqual(3);
    });

    it('should retry failed operations', async () => {
      const issues: IssueCreateInput[] = [
        { projectKey: 'PROJ', issueTypeName: 'Bug', summary: 'Bug 1' },
      ];

      let attempts = 0;
      (mockIssueService.createIssueByTypeName as any).mockImplementation(async (input: IssueCreateInput) => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return { key: `PROJ-${input.summary}`, fields: { summary: input.summary } } as Issue;
      });

      const result = await batchProcessor.createIssues(issues, { retries: 2 });

      expect(result.successCount).toBe(1);
      expect(attempts).toBe(3); // Initial attempt + 2 retries
    });

    it('should throw error if continueOnError is false', async () => {
      const issues: IssueCreateInput[] = [
        { projectKey: 'PROJ', issueTypeName: 'Bug', summary: 'Bug 1' },
        { projectKey: 'PROJ', issueTypeName: 'Task', summary: 'Task 1' },
      ];

      (mockIssueService.createIssueByTypeName as any).mockImplementation(async (input: IssueCreateInput) => {
        if (input.summary === 'Task 1') {
          throw new Error('Failed to create task');
        }
        return { key: `PROJ-${input.summary}`, fields: { summary: input.summary } } as Issue;
      });

      await expect(
        batchProcessor.createIssues(issues, { continueOnError: false })
      ).rejects.toThrow('Failed to create task');
    });
  });

  describe('Update Issues', () => {
    it('should update multiple issues successfully', async () => {
      const updates = [
        { key: 'PROJ-1', summary: 'Updated summary 1' },
        { key: 'PROJ-2', description: 'Updated description 2' },
      ];

      (mockIssueService.updateIssueSummary as any).mockResolvedValue(undefined);
      (mockIssueService.updateIssueDescription as any).mockResolvedValue(undefined);

      const result = await batchProcessor.updateIssues(updates);

      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(mockIssueService.updateIssueSummary).toHaveBeenCalledTimes(1);
      expect(mockIssueService.updateIssueDescription).toHaveBeenCalledTimes(1);
    });

    it('should handle update failures', async () => {
      const updates = [
        { key: 'PROJ-1', summary: 'Updated summary 1' },
        { key: 'PROJ-2', summary: 'Updated summary 2' },
      ];

      (mockIssueService.updateIssueSummary as any).mockImplementation(async (key: string) => {
        if (key === 'PROJ-2') {
          throw new Error('Update failed');
        }
      });

      const result = await batchProcessor.updateIssues(updates, { continueOnError: true });

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
    });
  });

  describe('Assign Issues', () => {
    it('should assign multiple issues successfully', async () => {
      const assignments = [
        { key: 'PROJ-1', email: 'dev1@company.com' },
        { key: 'PROJ-2', email: 'dev2@company.com' },
      ];

      (mockIssueService.assignIssueByEmail as any).mockResolvedValue(undefined);

      const result = await batchProcessor.assignIssues(assignments);

      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(mockIssueService.assignIssueByEmail).toHaveBeenCalledTimes(2);
      expect(mockIssueService.assignIssueByEmail).toHaveBeenCalledWith('PROJ-1', 'dev1@company.com');
      expect(mockIssueService.assignIssueByEmail).toHaveBeenCalledWith('PROJ-2', 'dev2@company.com');
    });

    it('should handle assignment failures', async () => {
      const assignments = [
        { key: 'PROJ-1', email: 'dev1@company.com' },
        { key: 'PROJ-2', email: 'invalid@company.com' },
      ];

      (mockIssueService.assignIssueByEmail as any).mockImplementation(async (key: string, email: string) => {
        if (email === 'invalid@company.com') {
          throw new Error('User not found');
        }
      });

      const result = await batchProcessor.assignIssues(assignments, { continueOnError: true });

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.failures[0].error.message).toBe('User not found');
    });
  });

  describe('Unassign Issues', () => {
    it('should unassign multiple issues successfully', async () => {
      const keys = ['PROJ-1', 'PROJ-2', 'PROJ-3'];

      (mockIssueService.unassignIssue as any).mockResolvedValue(undefined);

      const result = await batchProcessor.unassignIssues(keys);

      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(0);
      expect(mockIssueService.unassignIssue).toHaveBeenCalledTimes(3);
    });
  });

  describe('Add Labels', () => {
    it('should add labels to multiple issues successfully', async () => {
      const operations = [
        { key: 'PROJ-1', labels: ['urgent', 'bug'] },
        { key: 'PROJ-2', labels: ['enhancement'] },
      ];

      (mockIssueService.addLabelsToIssue as any).mockResolvedValue(undefined);

      const result = await batchProcessor.addLabelsToIssues(operations);

      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(mockIssueService.addLabelsToIssue).toHaveBeenCalledTimes(2);
      expect(mockIssueService.addLabelsToIssue).toHaveBeenCalledWith('PROJ-1', ['urgent', 'bug']);
      expect(mockIssueService.addLabelsToIssue).toHaveBeenCalledWith('PROJ-2', ['enhancement']);
    });
  });

  describe('Transition Issues', () => {
    it('should transition multiple issues successfully', async () => {
      const transitions = [
        { key: 'PROJ-1', transitionName: 'In Progress', comment: 'Starting work' },
        { key: 'PROJ-2', transitionName: 'Done' },
      ];

      (mockIssueService.transitionIssueByName as any).mockResolvedValue(undefined);

      const result = await batchProcessor.transitionIssues(transitions);

      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(mockIssueService.transitionIssueByName).toHaveBeenCalledTimes(2);
      expect(mockIssueService.transitionIssueByName).toHaveBeenCalledWith(
        'PROJ-1',
        'In Progress',
        'Starting work'
      );
      expect(mockIssueService.transitionIssueByName).toHaveBeenCalledWith('PROJ-2', 'Done', undefined);
    });

    it('should handle transition failures', async () => {
      const transitions = [
        { key: 'PROJ-1', transitionName: 'In Progress' },
        { key: 'PROJ-2', transitionName: 'Invalid Status' },
      ];

      (mockIssueService.transitionIssueByName as any).mockImplementation(
        async (key: string, transitionName: string) => {
          if (transitionName === 'Invalid Status') {
            throw new Error('Transition not found');
          }
        }
      );

      const result = await batchProcessor.transitionIssues(transitions, { continueOnError: true });

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.failures[0].error.message).toBe('Transition not found');
    });
  });

  describe('Batch Options', () => {
    it('should use default options if not provided', async () => {
      const issues: IssueCreateInput[] = [
        { projectKey: 'PROJ', issueTypeName: 'Bug', summary: 'Bug 1' },
      ];

      (mockIssueService.createIssueByTypeName as any).mockResolvedValue({
        key: 'PROJ-1',
      } as Issue);

      const result = await batchProcessor.createIssues(issues);

      expect(result.successCount).toBe(1);
    });

    it('should merge custom options with defaults', async () => {
      const issues: IssueCreateInput[] = [
        { projectKey: 'PROJ', issueTypeName: 'Bug', summary: 'Bug 1' },
      ];

      (mockIssueService.createIssueByTypeName as any).mockResolvedValue({
        key: 'PROJ-1',
      } as Issue);

      const result = await batchProcessor.createIssues(issues, {
        concurrency: 10,
        // Other options should use defaults
      });

      expect(result.successCount).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty array', async () => {
      const result = await batchProcessor.createIssues([]);

      expect(result.total).toBe(0);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(0);
      expect(result.success).toHaveLength(0);
      expect(result.failures).toHaveLength(0);
    });

    it('should handle single item', async () => {
      const issues: IssueCreateInput[] = [
        { projectKey: 'PROJ', issueTypeName: 'Bug', summary: 'Bug 1' },
      ];

      (mockIssueService.createIssueByTypeName as any).mockResolvedValue({
        key: 'PROJ-1',
      } as Issue);

      const result = await batchProcessor.createIssues(issues);

      expect(result.total).toBe(1);
      expect(result.successCount).toBe(1);
    });

    it('should handle large batches', async () => {
      const issues: IssueCreateInput[] = Array.from({ length: 100 }, (_, i) => ({
        projectKey: 'PROJ',
        issueTypeName: 'Bug',
        summary: `Bug ${i}`,
      }));

      (mockIssueService.createIssueByTypeName as any).mockImplementation(async (input: IssueCreateInput) => ({
        key: `PROJ-${input.summary}`,
      } as Issue));

      const result = await batchProcessor.createIssues(issues, { concurrency: 10 });

      expect(result.total).toBe(100);
      expect(result.successCount).toBe(100);
      expect(result.failureCount).toBe(0);
    });
  });
});

describe('Chunk Utility', () => {
  it('should chunk array into equal parts', () => {
    const array = [1, 2, 3, 4, 5, 6];
    const chunks = chunk(array, 2);

    expect(chunks).toEqual([[1, 2], [3, 4], [5, 6]]);
  });

  it('should handle uneven chunks', () => {
    const array = [1, 2, 3, 4, 5];
    const chunks = chunk(array, 2);

    expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('should handle chunk size larger than array', () => {
    const array = [1, 2, 3];
    const chunks = chunk(array, 10);

    expect(chunks).toEqual([[1, 2, 3]]);
  });

  it('should handle empty array', () => {
    const array: number[] = [];
    const chunks = chunk(array, 2);

    expect(chunks).toEqual([]);
  });

  it('should handle chunk size of 1', () => {
    const array = [1, 2, 3];
    const chunks = chunk(array, 1);

    expect(chunks).toEqual([[1], [2], [3]]);
  });
});
