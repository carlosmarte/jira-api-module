/**
 * SDK Client
 * HTTP client for accessing the JIRA API REST server
 */

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import type { User } from '../models/user.js';
import type { Issue, IssueCreateInput } from '../models/issue.js';
import type { Project, ProjectVersion, IssueType } from '../models/project.js';

/**
 * SDK Client configuration
 */
export interface SDKClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  maxConnections?: number;
}

/**
 * SDK Client
 * Provides programmatic access to JIRA API REST server
 */
export class SDKClient {
  private axios: AxiosInstance;
  private config: {
    baseUrl: string;
    apiKey: string;
    timeout: number;
    maxRetries: number;
    retryDelay: number;
    maxConnections: number;
  };

  constructor(config: SDKClientConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      maxConnections: config.maxConnections || 10,
    };

    // Create axios instance with connection pooling
    this.axios = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
      },
      httpAgent: new HttpAgent({
        keepAlive: true,
        maxSockets: this.config.maxConnections,
      }),
      httpsAgent: new HttpsAgent({
        keepAlive: true,
        maxSockets: this.config.maxConnections,
      }),
    });

    // Add retry interceptor
    this.axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config as AxiosRequestConfig & { _retryCount?: number };

        // Don't retry if no config or max retries reached
        if (!config || (config._retryCount || 0) >= this.config.maxRetries) {
          return Promise.reject(error);
        }

        // Only retry on 5xx errors or network errors
        const shouldRetry =
          !error.response ||
          (error.response.status >= 500 && error.response.status < 600);

        if (!shouldRetry) {
          return Promise.reject(error);
        }

        // Increment retry count
        config._retryCount = (config._retryCount || 0) + 1;

        // Wait before retrying (exponential backoff)
        const delay = this.config.retryDelay * Math.pow(2, config._retryCount - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Retry request
        return this.axios(config);
      }
    );
  }

  // ======================
  // USER OPERATIONS
  // ======================

  /**
   * Get user by email or account ID
   */
  async getUser(identifier: string): Promise<User> {
    const response = await this.axios.get<User>(`/api/v1/users/${identifier}`);
    return response.data;
  }

  /**
   * Search users
   */
  async searchUsers(query: string, maxResults?: number): Promise<User[]> {
    const response = await this.axios.get<User[]>(`/api/v1/users/search/${query}`, {
      params: { maxResults },
    });
    return response.data;
  }

  /**
   * Find assignable users for projects
   */
  async findAssignableUsers(projectKeys: string[]): Promise<User[]> {
    const response = await this.axios.post<User[]>('/api/v1/users/assignable', {
      projectKeys,
    });
    return response.data;
  }

  /**
   * Resolve email to account ID
   */
  async resolveToAccountId(identifier: string): Promise<string> {
    const response = await this.axios.get<{ accountId: string }>(
      `/api/v1/users/resolve/${identifier}`
    );
    return response.data.accountId;
  }

  // ======================
  // ISSUE OPERATIONS
  // ======================

  /**
   * Get issue by key
   */
  async getIssue(key: string): Promise<Issue> {
    const response = await this.axios.get<Issue>(`/api/v1/issues/${key}`);
    return response.data;
  }

  /**
   * Search issues with JQL
   */
  async searchIssues(jql: string, maxResults?: number): Promise<Issue[]> {
    const response = await this.axios.post<Issue[]>('/api/v1/issues/search', {
      jql,
      maxResults,
    });
    return response.data;
  }

  /**
   * Create issue
   */
  async createIssue(data: IssueCreateInput): Promise<Issue> {
    const response = await this.axios.post<Issue>('/api/v1/issues', data);
    return response.data;
  }

  /**
   * Update issue
   */
  async updateIssue(
    key: string,
    update: { summary?: string; description?: string }
  ): Promise<void> {
    await this.axios.patch(`/api/v1/issues/${key}`, update);
  }

  /**
   * Assign issue to user
   */
  async assignIssue(key: string, email: string): Promise<void> {
    await this.axios.post(`/api/v1/issues/${key}/assign`, { email });
  }

  /**
   * Unassign issue
   */
  async unassignIssue(key: string): Promise<void> {
    await this.axios.post(`/api/v1/issues/${key}/unassign`);
  }

  /**
   * Add labels to issue
   */
  async addLabels(key: string, labels: string[]): Promise<void> {
    await this.axios.post(`/api/v1/issues/${key}/labels`, { labels });
  }

  /**
   * Get available transitions
   */
  async getTransitions(key: string): Promise<Array<{ id: string; name: string }>> {
    const response = await this.axios.get<Array<{ id: string; name: string }>>(
      `/api/v1/issues/${key}/transitions`
    );
    return response.data;
  }

  /**
   * Transition issue
   */
  async transitionIssue(key: string, transitionName: string, comment?: string): Promise<void> {
    await this.axios.post(`/api/v1/issues/${key}/transition`, {
      transitionName,
      comment,
    });
  }

  // ======================
  // PROJECT OPERATIONS
  // ======================

  /**
   * Get project by key
   */
  async getProject(key: string): Promise<Project> {
    const response = await this.axios.get<Project>(`/api/v1/projects/${key}`);
    return response.data;
  }

  /**
   * Get project versions
   */
  async getProjectVersions(projectKey: string, released?: boolean): Promise<ProjectVersion[]> {
    const response = await this.axios.get<ProjectVersion[]>(
      `/api/v1/projects/${projectKey}/versions`,
      {
        params: released !== undefined ? { released } : undefined,
      }
    );
    return response.data;
  }

  /**
   * Create project version
   */
  async createVersion(
    projectKey: string,
    data: { name: string; description?: string; releaseDate?: string }
  ): Promise<ProjectVersion> {
    const response = await this.axios.post<ProjectVersion>(
      `/api/v1/projects/${projectKey}/versions`,
      data
    );
    return response.data;
  }

  /**
   * Get issue types for project
   */
  async getIssueTypes(projectKey: string): Promise<IssueType[]> {
    const response = await this.axios.get<IssueType[]>(
      `/api/v1/projects/${projectKey}/issue-types`
    );
    return response.data;
  }

  /**
   * Get issue type names
   */
  async getIssueTypeNames(projectKey: string): Promise<string[]> {
    const response = await this.axios.get<string[]>(
      `/api/v1/projects/${projectKey}/issue-type-names`
    );
    return response.data;
  }

  /**
   * Check if issue type exists
   */
  async issueTypeExists(projectKey: string, typeName: string): Promise<boolean> {
    const response = await this.axios.get<{ exists: boolean }>(
      `/api/v1/projects/${projectKey}/issue-types/${typeName}/exists`
    );
    return response.data.exists;
  }

  // ======================
  // HEALTH & METRICS
  // ======================

  /**
   * Check server health
   */
  async health(): Promise<{ status: string; timestamp: string; uptime: number }> {
    const response = await this.axios.get<{ status: string; timestamp: string; uptime: number }>(
      '/health'
    );
    return response.data;
  }

  /**
   * Check server readiness
   */
  async ready(): Promise<{ ready: boolean; timestamp: string }> {
    const response = await this.axios.get<{ ready: boolean; timestamp: string }>('/ready');
    return response.data;
  }

  /**
   * Get server metrics
   */
  async metrics(): Promise<{
    memory: Record<string, number>;
    cpu: Record<string, number>;
    uptime: number;
  }> {
    const response = await this.axios.get<{
      memory: Record<string, number>;
      cpu: Record<string, number>;
      uptime: number;
    }>('/metrics');
    return response.data;
  }

  /**
   * Close HTTP connections
   */
  async close(): Promise<void> {
    // Axios doesn't have a built-in close method, but we can clear the agents
    // The connections will be closed when the Node.js process exits
  }
}
