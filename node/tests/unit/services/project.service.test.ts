/**
 * Unit tests for ProjectService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectService } from '../../../src/services/project.service.js';
import type { JiraClient } from '../../../src/core/client.js';
import { JiraNotFoundError, JiraValidationError } from '../../../src/errors/index.js';
import { mockProject, mockVersion, mockIssueType } from '../../fixtures/mock-responses.js';

describe('ProjectService', () => {
  let service: ProjectService;
  let mockClient: JiraClient;

  beforeEach(() => {
    mockClient = {
      getProject: vi.fn(),
      getProjectVersions: vi.fn(),
      createProjectVersion: vi.fn(),
      getProjectIssueTypes: vi.fn(),
    } as any;

    service = new ProjectService(mockClient);
  });

  describe('getProject', () => {
    it('should get project by key', async () => {
      vi.mocked(mockClient.getProject).mockResolvedValue(mockProject);

      const result = await service.getProject('PROJ');

      expect(result).toEqual(mockProject);
      expect(mockClient.getProject).toHaveBeenCalledWith('PROJ');
    });
  });

  describe('Version Management', () => {
    it('should get all project versions', async () => {
      vi.mocked(mockClient.getProjectVersions).mockResolvedValue([mockVersion]);

      const result = await service.getProjectVersions('PROJ');

      expect(result).toEqual([mockVersion]);
      expect(mockClient.getProjectVersions).toHaveBeenCalledWith('PROJ', {});
    });

    it('should get released versions', async () => {
      vi.mocked(mockClient.getProjectVersions).mockResolvedValue([mockVersion]);

      const result = await service.getReleasedVersions('PROJ');

      expect(result).toEqual([mockVersion]);
      expect(mockClient.getProjectVersions).toHaveBeenCalledWith('PROJ', {
        released: true,
      });
    });

    it('should get unreleased versions', async () => {
      vi.mocked(mockClient.getProjectVersions).mockResolvedValue([mockVersion]);

      const result = await service.getUnreleasedVersions('PROJ');

      expect(mockClient.getProjectVersions).toHaveBeenCalledWith('PROJ', {
        released: false,
      });
    });

    it('should create version', async () => {
      vi.mocked(mockClient.getProject).mockResolvedValue(mockProject);
      vi.mocked(mockClient.createProjectVersion).mockResolvedValue(mockVersion);

      const result = await service.createVersion('PROJ', {
        name: 'v1.0.0',
        description: 'First release',
      });

      expect(result).toEqual(mockVersion);
      expect(mockClient.createProjectVersion).toHaveBeenCalled();
    });

    it('should throw validation error for missing version name', async () => {
      await expect(
        service.createVersion('PROJ', { name: '' })
      ).rejects.toThrow(JiraValidationError);
    });

    it('should get version by name', async () => {
      vi.mocked(mockClient.getProjectVersions).mockResolvedValue([mockVersion]);

      const result = await service.getVersionByName('PROJ', 'v1.0.0');

      expect(result).toEqual(mockVersion);
    });

    it('should throw error for non-existent version', async () => {
      vi.mocked(mockClient.getProjectVersions).mockResolvedValue([mockVersion]);

      await expect(
        service.getVersionByName('PROJ', 'v2.0.0')
      ).rejects.toThrow(JiraNotFoundError);
    });

    it('should match version name case-insensitively', async () => {
      vi.mocked(mockClient.getProjectVersions).mockResolvedValue([mockVersion]);

      const result = await service.getVersionByName('PROJ', 'V1.0.0');

      expect(result).toEqual(mockVersion);
    });
  });

  describe('Issue Type Management', () => {
    it('should get issue types for project', async () => {
      vi.mocked(mockClient.getProjectIssueTypes).mockResolvedValue([mockIssueType]);

      const result = await service.getIssueTypes('PROJ');

      expect(result).toEqual([mockIssueType]);
      expect(mockClient.getProjectIssueTypes).toHaveBeenCalledWith('PROJ');
    });

    it('should get issue type by name', async () => {
      vi.mocked(mockClient.getProjectIssueTypes).mockResolvedValue([mockIssueType]);

      const result = await service.getIssueTypeByName('PROJ', 'Bug');

      expect(result).toEqual(mockIssueType);
    });

    it('should throw error for non-existent issue type', async () => {
      vi.mocked(mockClient.getProjectIssueTypes).mockResolvedValue([mockIssueType]);

      await expect(
        service.getIssueTypeByName('PROJ', 'Epic')
      ).rejects.toThrow(JiraNotFoundError);
    });

    it('should match issue type name case-insensitively', async () => {
      vi.mocked(mockClient.getProjectIssueTypes).mockResolvedValue([mockIssueType]);

      const result = await service.getIssueTypeByName('PROJ', 'bug');

      expect(result).toEqual(mockIssueType);
    });

    it('should get issue type ID by name', async () => {
      vi.mocked(mockClient.getProjectIssueTypes).mockResolvedValue([mockIssueType]);

      const result = await service.getIssueTypeIdByName('PROJ', 'Bug');

      expect(result).toBe(mockIssueType.id);
    });

    it('should check if issue type exists', async () => {
      vi.mocked(mockClient.getProjectIssueTypes).mockResolvedValue([mockIssueType]);

      const exists = await service.issueTypeExists('PROJ', 'Bug');
      const notExists = await service.issueTypeExists('PROJ', 'Epic');

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });

    it('should get issue type names', async () => {
      vi.mocked(mockClient.getProjectIssueTypes).mockResolvedValue([mockIssueType]);

      const result = await service.getIssueTypeNames('PROJ');

      expect(result).toEqual(['Bug']);
    });
  });
});
