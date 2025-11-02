/**
 * Issue model types and interfaces
 * Based on JIRA Cloud API v3
 */

import type { User } from './user.js';
import type { ProjectReference, IssueType } from './project.js';
import type { ADFDocument } from './common.js';
import { z } from 'zod';

/**
 * JIRA Issue
 */
export interface Issue {
  id: string;
  key: string;
  self: string;
  fields: IssueFields;
}

/**
 * Issue fields
 */
export interface IssueFields {
  summary: string;
  description?: ADFDocument;
  status: IssueStatus;
  priority?: IssuePriority;
  assignee?: User | null;
  reporter: User;
  created: string;
  updated: string;
  resolutiondate?: string;
  resolution?: IssueResolution;
  labels: string[];
  project: ProjectReference;
  issuetype: IssueType;
  parent?: IssueReference;
  subtasks?: IssueReference[];
  [key: string]: any; // Allow custom fields
}

/**
 * Issue status
 */
export interface IssueStatus {
  id: string;
  name: string;
  statusCategory: {
    id: number;
    key: string;
    name: string;
    colorName?: string;
  };
  self?: string;
}

/**
 * Issue priority
 */
export interface IssuePriority {
  id: string;
  name: string;
  iconUrl: string;
  self?: string;
}

/**
 * Issue resolution
 */
export interface IssueResolution {
  id: string;
  name: string;
  description?: string;
  self?: string;
}

/**
 * Issue reference (lightweight)
 */
export interface IssueReference {
  id: string;
  key: string;
  self?: string;
}

/**
 * Issue transition
 */
export interface IssueTransition {
  id: string;
  name: string;
  to: {
    id: string;
    name: string;
  };
  hasScreen: boolean;
  isGlobal: boolean;
  isInitial: boolean;
  isConditional: boolean;
}

/**
 * Issue create input (with type name - user-friendly)
 */
export interface IssueCreateInput {
  projectKey: string;
  issueTypeName: string;
  summary: string;
  description?: string;
  assigneeEmail?: string;
  priority?: string;
  labels?: string[];
  parentKey?: string;
  [key: string]: any; // Allow custom fields
}

/**
 * Issue create request (with type ID - API format)
 */
export interface IssueCreate {
  fields: {
    project: { key: string };
    issuetype: { id: string };
    summary: string;
    description?: ADFDocument;
    assignee?: { accountId: string };
    priority?: { name: string };
    labels?: string[];
    parent?: { key: string };
    [key: string]: any;
  };
}

/**
 * Issue update input
 */
export interface IssueUpdateInput {
  summary?: string;
  description?: string;
  labelsAdd?: string[];
  labelsRemove?: string[];
  [key: string]: any;
}

/**
 * Issue update request (API format)
 */
export interface IssueUpdate {
  fields?: Partial<IssueFields>;
  update?: {
    labels?: Array<{ add?: string; remove?: string }>;
    [key: string]: any;
  };
}

/**
 * Issue transition request
 */
export interface IssueTransitionRequest {
  transition: {
    id: string;
  };
  fields?: Record<string, any>;
  update?: Record<string, any>;
}

/**
 * Zod schema for Issue
 */
export const IssueSchema = z.object({
  id: z.string(),
  key: z.string(),
  self: z.string().url(),
  fields: z.object({
    summary: z.string().min(1).max(255),
    description: z.any().optional(),
    status: z.object({
      id: z.string(),
      name: z.string(),
      statusCategory: z.object({
        id: z.number(),
        key: z.string(),
        name: z.string(),
        colorName: z.string().optional(),
      }),
      self: z.string().url().optional(),
    }),
    priority: z.object({
      id: z.string(),
      name: z.string(),
      iconUrl: z.string().url(),
      self: z.string().url().optional(),
    }).optional(),
    assignee: z.any().nullable().optional(),
    reporter: z.any(),
    created: z.string(),
    updated: z.string(),
    resolutiondate: z.string().optional(),
    resolution: z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      self: z.string().url().optional(),
    }).optional(),
    labels: z.array(z.string()),
    project: z.any(),
    issuetype: z.any(),
    parent: z.object({
      id: z.string(),
      key: z.string(),
      self: z.string().url().optional(),
    }).optional(),
    subtasks: z.array(z.object({
      id: z.string(),
      key: z.string(),
      self: z.string().url().optional(),
    })).optional(),
  }).passthrough(), // Allow additional custom fields
});

/**
 * Zod schema for IssueCreateInput
 */
export const IssueCreateInputSchema = z.object({
  projectKey: z.string().min(1),
  issueTypeName: z.string().min(1),
  summary: z.string().min(1).max(255),
  description: z.string().optional(),
  assigneeEmail: z.string().email().optional(),
  priority: z.string().optional(),
  labels: z.array(z.string()).optional(),
  parentKey: z.string().optional(),
}).passthrough();

/**
 * Zod schema for IssueUpdateInput
 */
export const IssueUpdateInputSchema = z.object({
  summary: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  labelsAdd: z.array(z.string()).optional(),
  labelsRemove: z.array(z.string()).optional(),
}).passthrough();
