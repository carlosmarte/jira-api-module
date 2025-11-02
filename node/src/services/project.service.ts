/**
 * ProjectService - High-level project operations
 * Provides project metadata, version management, and issue type helpers
 */

import type { JiraClient } from '../core/client.js';
import type {
  Project,
  ProjectVersion,
  IssueType,
  VersionQuery,
  VersionCreateInput,
} from '../models/project.js';
import { JiraNotFoundError, JiraValidationError } from '../errors/index.js';
import { getLogger } from '../utils/logger.js';

/**
 * ProjectService class
 * Provides business logic layer for project operations
 */
export class ProjectService {
  private logger = getLogger();

  constructor(private client: JiraClient) {}

  // ======================
  // PROJECT METHODS
  // ======================

  /**
   * Get project by key
   */
  async getProject(key: string): Promise<Project> {
    this.logger.debug({ key }, 'Getting project');
    return this.client.getProject(key);
  }

  // ======================
  // VERSION METHODS
  // ======================

  /**
   * Get project versions
   */
  async getProjectVersions(
    projectKey: string,
    filter?: 'released' | 'unreleased'
  ): Promise<ProjectVersion[]> {
    this.logger.debug({ projectKey, filter }, 'Getting project versions');

    const query: VersionQuery = {};
    if (filter === 'released') {
      query.released = true;
    } else if (filter === 'unreleased') {
      query.released = false;
    }

    return this.client.getProjectVersions(projectKey, query);
  }

  /**
   * Create version
   */
  async createVersion(
    projectKey: string,
    data: VersionCreateInput
  ): Promise<ProjectVersion> {
    this.logger.debug({ projectKey, data }, 'Creating version');

    // Validate required fields
    if (!data.name) {
      throw new JiraValidationError('Version name is required');
    }

    // Get project to get project ID
    const project = await this.client.getProject(projectKey);

    return this.client.createProjectVersion(projectKey, {
      ...data,
      projectId: parseInt(project.id, 10),
    });
  }

  /**
   * Get version by name
   */
  async getVersionByName(
    projectKey: string,
    versionName: string
  ): Promise<ProjectVersion> {
    this.logger.debug({ projectKey, versionName }, 'Getting version by name');

    const versions = await this.getProjectVersions(projectKey);
    const version = versions.find(
      (v) => v.name.toLowerCase() === versionName.toLowerCase()
    );

    if (!version) {
      const availableVersions = versions.map((v) => v.name).join(', ');
      throw new JiraNotFoundError(
        `Version '${versionName}' not found in project ${projectKey}. ` +
          `Available: ${availableVersions || 'none'}`
      );
    }

    return version;
  }

  /**
   * Get released versions
   */
  async getReleasedVersions(projectKey: string): Promise<ProjectVersion[]> {
    return this.getProjectVersions(projectKey, 'released');
  }

  /**
   * Get unreleased versions
   */
  async getUnreleasedVersions(projectKey: string): Promise<ProjectVersion[]> {
    return this.getProjectVersions(projectKey, 'unreleased');
  }

  // ======================
  // ISSUE TYPE METHODS
  // ======================

  /**
   * Get issue types for project
   */
  async getIssueTypes(projectKey: string): Promise<IssueType[]> {
    this.logger.debug({ projectKey }, 'Getting issue types');
    return this.client.getProjectIssueTypes(projectKey);
  }

  /**
   * Get issue type by name
   */
  async getIssueTypeByName(projectKey: string, typeName: string): Promise<IssueType> {
    this.logger.debug({ projectKey, typeName }, 'Getting issue type by name');

    const issueTypes = await this.getIssueTypes(projectKey);
    const issueType = issueTypes.find(
      (type) => type.name.toLowerCase() === typeName.toLowerCase()
    );

    if (!issueType) {
      const availableTypes = issueTypes.map((t) => t.name).join(', ');
      throw new JiraNotFoundError(
        `Issue type '${typeName}' not found in project ${projectKey}. ` +
          `Available: ${availableTypes}`
      );
    }

    return issueType;
  }

  /**
   * Get issue type ID by name
   */
  async getIssueTypeIdByName(projectKey: string, typeName: string): Promise<string> {
    const issueType = await this.getIssueTypeByName(projectKey, typeName);
    return issueType.id;
  }

  /**
   * Check if issue type exists in project
   */
  async issueTypeExists(projectKey: string, typeName: string): Promise<boolean> {
    try {
      await this.getIssueTypeByName(projectKey, typeName);
      return true;
    } catch (error) {
      if (error instanceof JiraNotFoundError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get all available issue type names for a project
   */
  async getIssueTypeNames(projectKey: string): Promise<string[]> {
    const issueTypes = await this.getIssueTypes(projectKey);
    return issueTypes.map((type) => type.name);
  }
}
