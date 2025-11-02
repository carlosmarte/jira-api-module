/**
 * User model types and interfaces
 * Based on JIRA Cloud API v3
 */

import type { AvatarUrls } from './common.js';
import { z } from 'zod';

/**
 * User account type
 */
export type AccountType = 'atlassian' | 'app' | 'customer';

/**
 * JIRA User
 */
export interface User {
  accountId: string;
  accountType: AccountType;
  emailAddress: string;
  displayName: string;
  active: boolean;
  timeZone: string;
  locale: string;
  avatarUrls: AvatarUrls;
  self?: string;
}

/**
 * User search result
 */
export interface UserSearchResult {
  users: User[];
  total: number;
  startAt: number;
  maxResults: number;
}

/**
 * User reference (lightweight)
 */
export interface UserReference {
  accountId: string;
  displayName?: string;
  emailAddress?: string;
}

/**
 * Zod schema for User validation
 */
export const UserSchema = z.object({
  accountId: z.string().min(1),
  accountType: z.enum(['atlassian', 'app', 'customer']),
  emailAddress: z.string().email(),
  displayName: z.string().min(1),
  active: z.boolean(),
  timeZone: z.string(),
  locale: z.string(),
  avatarUrls: z.object({
    '16x16': z.string().url(),
    '24x24': z.string().url(),
    '32x32': z.string().url(),
    '48x48': z.string().url(),
  }),
  self: z.string().url().optional(),
});

/**
 * Zod schema for UserReference
 */
export const UserReferenceSchema = z.object({
  accountId: z.string().min(1),
  displayName: z.string().optional(),
  emailAddress: z.string().email().optional(),
});
