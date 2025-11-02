/**
 * Unit tests for IssueService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IssueService } from '../../../src/services/issue.service.js';
import { UserService } from '../../../src/services/user.service.js';
import type { JiraClient } from '../../../src/core/client.js';
import { JiraNotFoundError, JiraValidationError } from '../../../src/errors/index.js';
import { mockIssue, mockUser, mockTransitions } from '../../fixtures/mock-responses.js';

describe('IssueService', () => {
  let service: IssueService;
  let mockClient: JiraClient;
  let mockUserService: UserService;

  beforeEach(() => {
    mockClient = {
      createIssue: vi.fn(),
      getIssue: vi.fn(),
      updateIssue: vi.fn(),
      assignIssue: vi.fn(),
      getIssueTransitions: vi.fn(),
      transitionIssue: vi.fn(),
      searchIssues: vi.fn(),
      getIssueTypeIdByName: vi.fn(),
    } as any;

    mockUserService = {
      resolveToAccountId: vi.fn(),
    } as any;

    service = new IssueService(mockClient, mockUserService);
  });

  describe('createIssueByTypeName', () => {
    it('should create issue with type name resolution', async () => {
      vi.mocked(mockClient.getIssueTypeIdByName).mockResolvedValue('10001');
      vi.mocked(mockClient.createIssue).mockResolvedValue(mockIssue);

      const result = await service.createIssueByTypeName({
        projectKey: 'PROJ',
        issueTypeName: 'Bug',
        summary: 'Test bug',
      });

      expect(result).toEqual(mockIssue);
      expect(mockClient.getIssueTypeIdByName).toHaveBeenCalledWith('PROJ', 'Bug');
    });

    it('should resolve assignee email to account ID', async () => {
      vi.mocked(mockClient.getIssueTypeIdByName).mockResolvedValue('10001');
      vi.mocked(mockUserService.resolveToAccountId).mockResolvedValue('account-id');
      vi.mocked(mockClient.createIssue).mockResolvedValue(mockIssue);

      await service.createIssueByTypeName({
        projectKey: 'PROJ',
        issueTypeName: 'Bug',
        summary: 'Test bug',
        assigneeEmail: 'test@example.com',
      });

      expect(mockUserService.resolveToAccountId).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw validation error for missing required fields', async () => {
      await expect(
        service.createIssueByTypeName({
          projectKey: '',
          issueTypeName: 'Bug',
          summary: 'Test',
        })
      ).rejects.toThrow(JiraValidationError);
    });
  });

  describe('Convenience Methods', () => {
    beforeEach(() => {
      vi.mocked(mockClient.getIssueTypeIdByName).mockResolvedValue('10001');
      vi.mocked(mockClient.createIssue).mockResolvedValue(mockIssue);
    });

    it('should create bug', async () => {
      const result = await service.createBug('PROJ', 'Bug summary');

      expect(result).toEqual(mockIssue);
      expect(mockClient.getIssueTypeIdByName).toHaveBeenCalledWith('PROJ', 'Bug');
    });

    it('should create task', async () => {
      const result = await service.createTask('PROJ', 'Task summary');

      expect(result).toEqual(mockIssue);
      expect(mockClient.getIssueTypeIdByName).toHaveBeenCalledWith('PROJ', 'Task');
    });

    it('should create story', async () => {
      const result = await service.createStory('PROJ', 'Story summary');

      expect(result).toEqual(mockIssue);
      expect(mockClient.getIssueTypeIdByName).toHaveBeenCalledWith('PROJ', 'Story');
    });
  });

  describe('getIssue', () => {
    it('should get issue by key', async () => {
      vi.mocked(mockClient.getIssue).mockResolvedValue(mockIssue);

      const result = await service.getIssue('PROJ-123');

      expect(result).toEqual(mockIssue);
      expect(mockClient.getIssue).toHaveBeenCalledWith('PROJ-123', undefined);
    });
  });

  describe('searchIssues', () => {
    it('should search issues with JQL', async () => {
      vi.mocked(mockClient.searchIssues).mockResolvedValue({
        issues: [mockIssue],
        total: 1,
        startAt: 0,
        maxResults: 50,
      });

      const result = await service.searchIssues('project = PROJ');

      expect(result).toEqual([mockIssue]);
      expect(mockClient.searchIssues).toHaveBeenCalledWith('project = PROJ', 50);
    });
  });

  describe('Update Methods', () => {
    it('should update issue summary', async () => {
      vi.mocked(mockClient.updateIssue).mockResolvedValue();

      await service.updateIssueSummary('PROJ-123', 'New summary');

      expect(mockClient.updateIssue).toHaveBeenCalledWith('PROJ-123', {
        fields: { summary: 'New summary' },
      });
    });

    it('should update issue description', async () => {
      vi.mocked(mockClient.updateIssue).mockResolvedValue();

      await service.updateIssueDescription('PROJ-123', 'New description');

      expect(mockClient.updateIssue).toHaveBeenCalled();
    });
  });

  describe('Label Management', () => {
    it('should add labels to issue', async () => {
      vi.mocked(mockClient.updateIssue).mockResolvedValue();

      await service.addLabelsToIssue('PROJ-123', ['label1', 'label2']);

      expect(mockClient.updateIssue).toHaveBeenCalledWith('PROJ-123', {
        update: {
          labels: [{ add: 'label1' }, { add: 'label2' }],
        },
      });
    });

    it('should remove labels from issue', async () => {
      vi.mocked(mockClient.updateIssue).mockResolvedValue();

      await service.removeLabelsFromIssue('PROJ-123', ['label1']);

      expect(mockClient.updateIssue).toHaveBeenCalledWith('PROJ-123', {
        update: {
          labels: [{ remove: 'label1' }],
        },
      });
    });
  });

  describe('Assignment Methods', () => {
    it('should assign issue by email', async () => {
      vi.mocked(mockUserService.resolveToAccountId).mockResolvedValue('account-id');
      vi.mocked(mockClient.assignIssue).mockResolvedValue();

      await service.assignIssueByEmail('PROJ-123', 'test@example.com');

      expect(mockUserService.resolveToAccountId).toHaveBeenCalledWith('test@example.com');
      expect(mockClient.assignIssue).toHaveBeenCalledWith('PROJ-123', 'account-id');
    });

    it('should assign issue by ID', async () => {
      vi.mocked(mockClient.assignIssue).mockResolvedValue();

      await service.assignIssueById('PROJ-123', 'account-id');

      expect(mockClient.assignIssue).toHaveBeenCalledWith('PROJ-123', 'account-id');
    });

    it('should unassign issue', async () => {
      vi.mocked(mockClient.assignIssue).mockResolvedValue();

      await service.unassignIssue('PROJ-123');

      expect(mockClient.assignIssue).toHaveBeenCalledWith('PROJ-123', null);
    });
  });

  describe('Transition Methods', () => {
    it('should get available transitions', async () => {
      vi.mocked(mockClient.getIssueTransitions).mockResolvedValue(mockTransitions);

      const result = await service.getAvailableTransitions('PROJ-123');

      expect(result).toEqual(mockTransitions);
    });

    it('should transition issue by name', async () => {
      vi.mocked(mockClient.getIssueTransitions).mockResolvedValue(mockTransitions);
      vi.mocked(mockClient.transitionIssue).mockResolvedValue();

      await service.transitionIssueByName('PROJ-123', 'In Progress');

      expect(mockClient.transitionIssue).toHaveBeenCalledWith('PROJ-123', {
        transition: { id: '21' },
        update: undefined,
      });
    });

    it('should throw error for invalid transition name', async () => {
      vi.mocked(mockClient.getIssueTransitions).mockResolvedValue(mockTransitions);

      await expect(
        service.transitionIssueByName('PROJ-123', 'Invalid')
      ).rejects.toThrow(JiraNotFoundError);
    });

    it('should transition issue with comment', async () => {
      vi.mocked(mockClient.getIssueTransitions).mockResolvedValue(mockTransitions);
      vi.mocked(mockClient.transitionIssue).mockResolvedValue();

      await service.transitionIssueByName('PROJ-123', 'Done', 'Completed');

      expect(mockClient.transitionIssue).toHaveBeenCalled();
      const call = vi.mocked(mockClient.transitionIssue).mock.calls[0];
      expect(call?.[1].update).toBeDefined();
    });
  });

  describe('Bulk Operations', () => {
    it('should bulk create issues', async () => {
      vi.mocked(mockClient.getIssueTypeIdByName).mockResolvedValue('10001');
      vi.mocked(mockClient.createIssue).mockResolvedValue(mockIssue);

      const result = await service.bulkCreateIssues([
        { projectKey: 'PROJ', issueTypeName: 'Bug', summary: 'Bug 1' },
        { projectKey: 'PROJ', issueTypeName: 'Bug', summary: 'Bug 2' },
      ]);

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    it('should handle bulk create failures', async () => {
      vi.mocked(mockClient.getIssueTypeIdByName).mockResolvedValue('10001');
      vi.mocked(mockClient.createIssue)
        .mockResolvedValueOnce(mockIssue)
        .mockRejectedValueOnce(new Error('Failed'));

      const result = await service.bulkCreateIssues([
        { projectKey: 'PROJ', issueTypeName: 'Bug', summary: 'Bug 1' },
        { projectKey: 'PROJ', issueTypeName: 'Bug', summary: 'Bug 2' },
      ]);

      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
    });

    it('should bulk update issues', async () => {
      vi.mocked(mockClient.updateIssue).mockResolvedValue();

      const result = await service.bulkUpdateIssues([
        { key: 'PROJ-1', fields: { summary: 'Updated 1' } },
        { key: 'PROJ-2', fields: { summary: 'Updated 2' } },
      ]);

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });
  });
});
