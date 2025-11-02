/**
 * JiraClient - Core HTTP client for JIRA Cloud API v3
 * Handles authentication, requests, retries, and error mapping
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError } from 'axios';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import { mapHttpError, JiraAPIError } from '../errors/index.js';
import { getLogger, logRequest, logResponse, logError, type Logger } from '../utils/logger.js';
import type { User, UserSearchResult } from '../models/user.js';
import type { Issue, IssueCreate, IssueUpdate, IssueTransition, IssueTransitionRequest } from '../models/issue.js';
import type { Project, ProjectVersion, IssueType, VersionQuery } from '../models/project.js';
import type { PaginatedResponse } from '../models/common.js';

/**
 * JiraClient configuration
 */
export interface JiraClientConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  maxConnections?: number;
  rateLimit?: number;
  logger?: Logger;
}

/**
 * Request timing data
 */
interface RequestTiming {
  startTime: number;
}

/**
 * JiraClient - Core HTTP client
 */
export class JiraClient {
  private axios: AxiosInstance;
  private logger: Logger;
  private config: {
    baseUrl: string;
    email: string;
    apiToken: string;
    timeout: number;
    maxRetries: number;
    retryDelay: number;
    maxConnections: number;
    rateLimit: number;
  };

  constructor(config: JiraClientConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      email: config.email,
      apiToken: config.apiToken,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      maxConnections: config.maxConnections || 10,
      rateLimit: config.rateLimit || 100,
    };

    this.logger = config.logger || getLogger();

    // Create axios instance with connection pooling
    this.axios = axios.create({
      baseURL: `${config.baseUrl}/rest/api/3`,
      timeout: this.config.timeout,
      headers: {
        Authorization: this.createAuthHeader(config.email, config.apiToken),
        'Content-Type': 'application/json',
        Accept: 'application/json',
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

    // Add request interceptor for logging and timing
    this.axios.interceptors.request.use(
      (config) => {
        const timing: RequestTiming = { startTime: Date.now() };
        (config as any).metadata = timing;

        logRequest(config.method?.toUpperCase() || 'GET', config.url || '');
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for logging and error handling
    this.axios.interceptors.response.use(
      (response) => {
        const timing = (response.config as any).metadata as RequestTiming;
        const duration = Date.now() - timing.startTime;

        logResponse(
          response.config.method?.toUpperCase() || 'GET',
          response.config.url || '',
          response.status,
          duration
        );

        return response;
      },
      async (error: AxiosError) => {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status || 0;
        const responseData = axiosError.response?.data as any;

        // Map to custom error
        const jiraError = mapHttpError(status, responseData);

        // Log error
        logError(jiraError);

        // Handle retries for specific error codes
        if (this.shouldRetry(status) && this.canRetry(axiosError.config)) {
          return this.retryRequest(axiosError.config!);
        }

        throw jiraError;
      }
    );
  }

  /**
   * Create Basic Auth header
   */
  private createAuthHeader(email: string, apiToken: string): string {
    const credentials = Buffer.from(`${email}:${apiToken}`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Check if request should be retried
   */
  private shouldRetry(status: number): boolean {
    return [408, 429, 500, 502, 503, 504].includes(status);
  }

  /**
   * Check if request can be retried (hasn't exceeded max retries)
   */
  private canRetry(config: any): boolean {
    config._retryCount = config._retryCount || 0;
    return config._retryCount < this.config.maxRetries;
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest(config: AxiosRequestConfig): Promise<any> {
    const retryCount = (config as any)._retryCount || 0;
    (config as any)._retryCount = retryCount + 1;

    // Exponential backoff with jitter
    const delay = this.config.retryDelay * Math.pow(2, retryCount) + Math.random() * 1000;

    this.logger.info(
      { retryCount: retryCount + 1, delay },
      `Retrying request after ${delay}ms`
    );

    await new Promise((resolve) => setTimeout(resolve, delay));
    return this.axios.request(config);
  }

  /**
   * Generic request method with retry logic
   */
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axios.request<T>(config);
      return response.data;
    } catch (error) {
      // Error is already mapped by interceptor
      throw error;
    }
  }

  // ======================
  // USER OPERATIONS
  // ======================

  /**
   * Get user by account ID
   */
  async getUser(accountId: string): Promise<User> {
    return this.request<User>({
      method: 'GET',
      url: `/user`,
      params: { accountId },
    });
  }

  /**
   * Search users by query string
   */
  async searchUsers(query: string, maxResults: number = 50): Promise<UserSearchResult> {
    const response = await this.request<User[]>({
      method: 'GET',
      url: `/user/search`,
      params: { query, maxResults },
    });

    return {
      users: response,
      total: response.length,
      startAt: 0,
      maxResults,
    };
  }

  /**
   * Find assignable users for a project
   */
  async findAssignableUsers(projectKey: string, maxResults: number = 50): Promise<User[]> {
    return this.request<User[]>({
      method: 'GET',
      url: `/user/assignable/search`,
      params: { project: projectKey, maxResults },
    });
  }

  // ======================
  // ISSUE OPERATIONS
  // ======================

  /**
   * Create issue
   */
  async createIssue(data: IssueCreate): Promise<Issue> {
    const response = await this.request<{ id: string; key: string; self: string }>({
      method: 'POST',
      url: `/issue`,
      data,
    });

    // Fetch full issue details
    return this.getIssue(response.key);
  }

  /**
   * Get issue by key
   */
  async getIssue(key: string, fields?: string[]): Promise<Issue> {
    return this.request<Issue>({
      method: 'GET',
      url: `/issue/${key}`,
      params: fields ? { fields: fields.join(',') } : undefined,
    });
  }

  /**
   * Update issue
   */
  async updateIssue(key: string, update: IssueUpdate): Promise<void> {
    await this.request<void>({
      method: 'PUT',
      url: `/issue/${key}`,
      data: update,
    });
  }

  /**
   * Assign issue to user
   */
  async assignIssue(key: string, accountId: string | null): Promise<void> {
    await this.request<void>({
      method: 'PUT',
      url: `/issue/${key}/assignee`,
      data: accountId ? { accountId } : { accountId: null },
    });
  }

  /**
   * Get available transitions for an issue
   */
  async getIssueTransitions(key: string): Promise<IssueTransition[]> {
    const response = await this.request<{ transitions: IssueTransition[] }>({
      method: 'GET',
      url: `/issue/${key}/transitions`,
    });

    return response.transitions;
  }

  /**
   * Transition issue to new status
   */
  async transitionIssue(key: string, data: IssueTransitionRequest): Promise<void> {
    await this.request<void>({
      method: 'POST',
      url: `/issue/${key}/transitions`,
      data,
    });
  }

  /**
   * Search issues with JQL
   */
  async searchIssues(jql: string, maxResults: number = 50, startAt: number = 0): Promise<PaginatedResponse<Issue>> {
    return this.request<PaginatedResponse<Issue>>({
      method: 'GET',
      url: `/search`,
      params: { jql, maxResults, startAt },
    });
  }

  // ======================
  // PROJECT OPERATIONS
  // ======================

  /**
   * Get project by key
   */
  async getProject(key: string): Promise<Project> {
    return this.request<Project>({
      method: 'GET',
      url: `/project/${key}`,
    });
  }

  /**
   * Get project versions
   */
  async getProjectVersions(projectKey: string, query?: VersionQuery): Promise<ProjectVersion[]> {
    return this.request<ProjectVersion[]>({
      method: 'GET',
      url: `/project/${projectKey}/versions`,
      params: query,
    });
  }

  /**
   * Create project version
   */
  async createProjectVersion(projectKey: string, data: Partial<ProjectVersion>): Promise<ProjectVersion> {
    return this.request<ProjectVersion>({
      method: 'POST',
      url: `/version`,
      data: {
        ...data,
        project: projectKey,
      },
    });
  }

  /**
   * Get all issue types
   */
  async getIssueTypes(): Promise<IssueType[]> {
    return this.request<IssueType[]>({
      method: 'GET',
      url: `/issuetype`,
    });
  }

  /**
   * Get issue types for a project
   */
  async getProjectIssueTypes(projectKey: string): Promise<IssueType[]> {
    const project = await this.getProject(projectKey);
    return project.issueTypes || [];
  }

  /**
   * Get issue type ID by name for a project
   */
  async getIssueTypeIdByName(projectKey: string, typeName: string): Promise<string> {
    const issueTypes = await this.getProjectIssueTypes(projectKey);
    const issueType = issueTypes.find(
      (type) => type.name.toLowerCase() === typeName.toLowerCase()
    );

    if (!issueType) {
      throw new JiraAPIError(
        `Issue type '${typeName}' not found in project '${projectKey}'. ` +
          `Available types: ${issueTypes.map((t) => t.name).join(', ')}`
      );
    }

    return issueType.id;
  }

  // ======================
  // LIFECYCLE
  // ======================

  /**
   * Close HTTP client and cleanup connections
   */
  async close(): Promise<void> {
    // Axios doesn't have explicit close, but agents will be cleaned up
    this.logger.info('JiraClient closed');
  }
}
