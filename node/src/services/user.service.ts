/**
 * UserService - High-level user operations
 * Provides email-based lookups and smart identifier resolution
 */

import type { JiraClient } from '../core/client.js';
import type { User } from '../models/user.js';
import { JiraNotFoundError, JiraValidationError } from '../errors/index.js';
import { getLogger } from '../utils/logger.js';

/**
 * UserService class
 * Provides business logic layer for user operations
 */
export class UserService {
  private logger = getLogger();

  constructor(private client: JiraClient) {}

  /**
   * Get user by account ID
   */
  async getUserById(accountId: string): Promise<User> {
    this.logger.debug({ accountId }, 'Getting user by ID');
    return this.client.getUser(accountId);
  }

  /**
   * Get user by email address
   * Uses search API with exact email matching
   */
  async getUserByEmail(email: string): Promise<User> {
    this.logger.debug({ email }, 'Getting user by email');

    // Validate email format
    if (!email || !email.includes('@')) {
      throw new JiraValidationError(`Invalid email address: ${email}`);
    }

    // Search for users with this email
    const result = await this.client.searchUsers(email, 50);

    // Find exact match (case-insensitive)
    const user = result.users.find(
      (u) => u.emailAddress.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      throw new JiraNotFoundError(`User with email ${email}`);
    }

    return user;
  }

  /**
   * Get user by identifier (account ID or email)
   * Smart lookup that tries account ID first, then email
   */
  async getUserByIdentifier(identifier: string): Promise<User> {
    this.logger.debug({ identifier }, 'Getting user by identifier');

    // If it looks like an email, search by email
    if (identifier.includes('@')) {
      return this.getUserByEmail(identifier);
    }

    // Otherwise, try account ID
    try {
      return await this.getUserById(identifier);
    } catch (error) {
      // If account ID lookup fails, try as email fallback
      if (error instanceof JiraNotFoundError) {
        this.logger.debug('Account ID lookup failed, trying email');
        return this.getUserByEmail(identifier);
      }
      throw error;
    }
  }

  /**
   * Search users by query string
   */
  async searchUsers(query: string, maxResults: number = 50): Promise<User[]> {
    this.logger.debug({ query, maxResults }, 'Searching users');

    if (!query || query.trim() === '') {
      throw new JiraValidationError('Search query cannot be empty');
    }

    const result = await this.client.searchUsers(query, maxResults);
    return result.users;
  }

  /**
   * Find assignable users for one or more projects
   * Aggregates results across multiple projects and deduplicates
   */
  async findAssignableUsersForProjects(projectKeys: string[]): Promise<User[]> {
    this.logger.debug({ projectKeys }, 'Finding assignable users for projects');

    if (!projectKeys || projectKeys.length === 0) {
      throw new JiraValidationError('At least one project key is required');
    }

    // Fetch assignable users for each project
    const userArrays = await Promise.all(
      projectKeys.map((key) => this.client.findAssignableUsers(key))
    );

    // Deduplicate by account ID
    const userMap = new Map<string, User>();
    for (const users of userArrays) {
      for (const user of users) {
        if (!userMap.has(user.accountId)) {
          userMap.set(user.accountId, user);
        }
      }
    }

    return Array.from(userMap.values());
  }

  /**
   * Find assignable users for a single project
   */
  async findAssignableUsers(projectKey: string, maxResults: number = 50): Promise<User[]> {
    this.logger.debug({ projectKey, maxResults }, 'Finding assignable users');
    return this.client.findAssignableUsers(projectKey, maxResults);
  }

  /**
   * Check if user exists by account ID
   */
  async userExists(accountId: string): Promise<boolean> {
    try {
      await this.getUserById(accountId);
      return true;
    } catch (error) {
      if (error instanceof JiraNotFoundError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get multiple users by account IDs
   * Returns users that were found, skips not found ones
   */
  async getUsers(accountIds: string[]): Promise<User[]> {
    this.logger.debug({ count: accountIds.length }, 'Getting multiple users');

    const results = await Promise.allSettled(
      accountIds.map((id) => this.getUserById(id))
    );

    const users: User[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        users.push(result.value);
      } else {
        this.logger.warn(
          { error: result.reason },
          'Failed to fetch user'
        );
      }
    }

    return users;
  }

  /**
   * Resolve user identifier to account ID
   * Accepts email or account ID, returns account ID
   */
  async resolveToAccountId(identifier: string): Promise<string> {
    const user = await this.getUserByIdentifier(identifier);
    return user.accountId;
  }

  /**
   * Resolve multiple identifiers to account IDs
   */
  async resolveToAccountIds(identifiers: string[]): Promise<string[]> {
    this.logger.debug({ count: identifiers.length }, 'Resolving identifiers to account IDs');

    const users = await Promise.all(
      identifiers.map((id) => this.getUserByIdentifier(id))
    );

    return users.map((u) => u.accountId);
  }
}
