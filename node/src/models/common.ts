/**
 * Common types and interfaces shared across JIRA models
 */

/**
 * Atlassian Document Format (ADF) types
 * Used for rich text content in JIRA (descriptions, comments, etc.)
 */
export interface ADFDocument {
  version: 1;
  type: 'doc';
  content: ADFNode[];
}

export interface ADFNode {
  type: 'paragraph' | 'heading' | 'codeBlock' | 'bulletList' | 'orderedList' | 'text' | 'listItem';
  content?: ADFNode[];
  text?: string;
  attrs?: Record<string, any>;
  marks?: ADFMark[];
}

export interface ADFMark {
  type: 'strong' | 'em' | 'code' | 'link';
  attrs?: Record<string, any>;
}

/**
 * Avatar URLs for users and projects
 */
export interface AvatarUrls {
  '16x16': string;
  '24x24': string;
  '32x32': string;
  '48x48': string;
}

/**
 * Issue status category
 */
export interface StatusCategory {
  id: number;
  key: string;
  name: string;
  colorName?: string;
}

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
  startAt: number;
  maxResults: number;
  total: number;
  values?: T[];
  issues?: T[];
}

/**
 * Field update operation
 */
export interface FieldUpdate {
  set?: any;
  add?: any;
  remove?: any;
}

/**
 * Common query parameters
 */
export interface QueryParams {
  startAt?: number;
  maxResults?: number;
  fields?: string[];
  expand?: string[];
}
