/**
 * Project model types and interfaces
 * Based on JIRA Cloud API v3
 */

import type { User } from './user.js';
import { z } from 'zod';

/**
 * JIRA Project
 */
export interface Project {
  id: string;
  key: string;
  name: string;
  description?: string;
  projectTypeKey: string;
  lead: User;
  avatarUrls: Record<string, string>;
  issueTypes: IssueType[];
  self?: string;
}

/**
 * Project reference (lightweight)
 */
export interface ProjectReference {
  id: string;
  key: string;
  name: string;
  self?: string;
}

/**
 * Issue Type
 */
export interface IssueType {
  id: string;
  name: string;
  description: string;
  subtask: boolean;
  iconUrl: string;
  avatarId?: number;
  hierarchyLevel: number;
  self?: string;
}

/**
 * Project Version
 */
export interface ProjectVersion {
  id: string;
  name: string;
  description?: string;
  released: boolean;
  archived: boolean;
  releaseDate?: string;
  startDate?: string;
  projectId: number;
  self?: string;
}

/**
 * Version query parameters
 */
export interface VersionQuery {
  released?: boolean;
  archived?: boolean;
  orderBy?: 'sequence' | '-sequence' | 'name' | '-name' | 'startDate' | '-startDate' | 'releaseDate' | '-releaseDate';
}

/**
 * Version create input
 */
export interface VersionCreateInput {
  name: string;
  description?: string;
  releaseDate?: string;
  startDate?: string;
  released?: boolean;
  archived?: boolean;
}

/**
 * Zod schema for Project
 */
export const ProjectSchema = z.object({
  id: z.string(),
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  projectTypeKey: z.string(),
  lead: z.any(), // UserSchema would create circular dependency
  avatarUrls: z.record(z.string().url()),
  issueTypes: z.array(z.any()),
  self: z.string().url().optional(),
});

/**
 * Zod schema for IssueType
 */
export const IssueTypeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  subtask: z.boolean(),
  iconUrl: z.string().url(),
  avatarId: z.number().optional(),
  hierarchyLevel: z.number(),
  self: z.string().url().optional(),
});

/**
 * Zod schema for ProjectVersion
 */
export const ProjectVersionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  released: z.boolean(),
  archived: z.boolean(),
  releaseDate: z.string().optional(),
  startDate: z.string().optional(),
  projectId: z.number(),
  self: z.string().url().optional(),
});

/**
 * Zod schema for VersionCreateInput
 */
export const VersionCreateInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  releaseDate: z.string().optional(),
  startDate: z.string().optional(),
  released: z.boolean().optional(),
  archived: z.boolean().optional(),
});
