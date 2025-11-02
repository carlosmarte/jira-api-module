/**
 * Unit tests for UserService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '../../../src/services/user.service.js';
import type { JiraClient } from '../../../src/core/client.js';
import { JiraNotFoundError, JiraValidationError } from '../../../src/errors/index.js';
import { mockUser } from '../../fixtures/mock-responses.js';

describe('UserService', () => {
  let service: UserService;
  let mockClient: JiraClient;

  beforeEach(() => {
    mockClient = {
      getUser: vi.fn(),
      searchUsers: vi.fn(),
      findAssignableUsers: vi.fn(),
    } as any;

    service = new UserService(mockClient);
  });

  describe('getUserById', () => {
    it('should get user by account ID', async () => {
      vi.mocked(mockClient.getUser).mockResolvedValue(mockUser);

      const result = await service.getUserById('test-account-id');

      expect(result).toEqual(mockUser);
      expect(mockClient.getUser).toHaveBeenCalledWith('test-account-id');
    });
  });

  describe('getUserByEmail', () => {
    it('should get user by email with exact match', async () => {
      vi.mocked(mockClient.searchUsers).mockResolvedValue({
        users: [mockUser],
        total: 1,
        startAt: 0,
        maxResults: 50,
      });

      const result = await service.getUserByEmail('john.doe@example.com');

      expect(result).toEqual(mockUser);
      expect(mockClient.searchUsers).toHaveBeenCalledWith('john.doe@example.com', 50);
    });

    it('should match email case-insensitively', async () => {
      vi.mocked(mockClient.searchUsers).mockResolvedValue({
        users: [mockUser],
        total: 1,
        startAt: 0,
        maxResults: 50,
      });

      const result = await service.getUserByEmail('JOHN.DOE@EXAMPLE.COM');

      expect(result).toEqual(mockUser);
    });

    it('should throw validation error for invalid email', async () => {
      await expect(service.getUserByEmail('not-an-email')).rejects.toThrow(JiraValidationError);
    });

    it('should throw not found error if email not found', async () => {
      vi.mocked(mockClient.searchUsers).mockResolvedValue({
        users: [],
        total: 0,
        startAt: 0,
        maxResults: 50,
      });

      await expect(service.getUserByEmail('notfound@example.com')).rejects.toThrow(
        JiraNotFoundError
      );
    });
  });

  describe('getUserByIdentifier', () => {
    it('should use email lookup for email-like identifiers', async () => {
      vi.mocked(mockClient.searchUsers).mockResolvedValue({
        users: [mockUser],
        total: 1,
        startAt: 0,
        maxResults: 50,
      });

      const result = await service.getUserByIdentifier('john.doe@example.com');

      expect(result).toEqual(mockUser);
      expect(mockClient.searchUsers).toHaveBeenCalled();
      expect(mockClient.getUser).not.toHaveBeenCalled();
    });

    it('should use account ID lookup for non-email identifiers', async () => {
      vi.mocked(mockClient.getUser).mockResolvedValue(mockUser);

      const result = await service.getUserByIdentifier('account-id-123');

      expect(result).toEqual(mockUser);
      expect(mockClient.getUser).toHaveBeenCalledWith('account-id-123');
    });
  });

  describe('searchUsers', () => {
    it('should search users by query', async () => {
      vi.mocked(mockClient.searchUsers).mockResolvedValue({
        users: [mockUser],
        total: 1,
        startAt: 0,
        maxResults: 50,
      });

      const result = await service.searchUsers('john');

      expect(result).toEqual([mockUser]);
      expect(mockClient.searchUsers).toHaveBeenCalledWith('john', 50);
    });

    it('should throw validation error for empty query', async () => {
      await expect(service.searchUsers('')).rejects.toThrow(JiraValidationError);
    });
  });

  describe('findAssignableUsersForProjects', () => {
    it('should find assignable users for multiple projects', async () => {
      vi.mocked(mockClient.findAssignableUsers)
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValueOnce([mockUser]);

      const result = await service.findAssignableUsersForProjects(['PROJ1', 'PROJ2']);

      expect(result).toHaveLength(1); // Deduplicated
      expect(result[0]).toEqual(mockUser);
    });

    it('should throw validation error for empty project list', async () => {
      await expect(service.findAssignableUsersForProjects([])).rejects.toThrow(
        JiraValidationError
      );
    });
  });

  describe('userExists', () => {
    it('should return true if user exists', async () => {
      vi.mocked(mockClient.getUser).mockResolvedValue(mockUser);

      const result = await service.userExists('test-id');

      expect(result).toBe(true);
    });

    it('should return false if user not found', async () => {
      vi.mocked(mockClient.getUser).mockRejectedValue(new JiraNotFoundError('User'));

      const result = await service.userExists('test-id');

      expect(result).toBe(false);
    });
  });

  describe('resolveToAccountId', () => {
    it('should resolve email to account ID', async () => {
      vi.mocked(mockClient.searchUsers).mockResolvedValue({
        users: [mockUser],
        total: 1,
        startAt: 0,
        maxResults: 50,
      });

      const result = await service.resolveToAccountId('john.doe@example.com');

      expect(result).toBe(mockUser.accountId);
    });

    it('should resolve account ID to same account ID', async () => {
      vi.mocked(mockClient.getUser).mockResolvedValue(mockUser);

      const result = await service.resolveToAccountId('account-id');

      expect(result).toBe(mockUser.accountId);
    });
  });
});
