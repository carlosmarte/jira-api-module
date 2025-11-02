/**
 * Mock API responses for testing
 */

import type { User } from '../../src/models/user.js';
import type { Issue } from '../../src/models/issue.js';
import type { Project, IssueType, ProjectVersion } from '../../src/models/project.js';

/**
 * Mock user
 */
export const mockUser: User = {
  accountId: '5b10ac8d82e05b22cc7d4ef5',
  accountType: 'atlassian',
  emailAddress: 'john.doe@example.com',
  displayName: 'John Doe',
  active: true,
  timeZone: 'America/New_York',
  locale: 'en_US',
  avatarUrls: {
    '16x16': 'https://avatar-management.services.atlassian.com/16x16',
    '24x24': 'https://avatar-management.services.atlassian.com/24x24',
    '32x32': 'https://avatar-management.services.atlassian.com/32x32',
    '48x48': 'https://avatar-management.services.atlassian.com/48x48',
  },
  self: 'https://test.atlassian.net/rest/api/3/user?accountId=5b10ac8d82e05b22cc7d4ef5',
};

/**
 * Mock issue type
 */
export const mockIssueType: IssueType = {
  id: '10001',
  name: 'Bug',
  description: 'A problem which impairs or prevents the functions of the product.',
  subtask: false,
  iconUrl: 'https://test.atlassian.net/secure/viewavatar?size=xsmall&avatarId=10303',
  hierarchyLevel: 0,
  self: 'https://test.atlassian.net/rest/api/3/issuetype/10001',
};

/**
 * Mock project
 */
export const mockProject: Project = {
  id: '10000',
  key: 'TEST',
  name: 'Test Project',
  description: 'A test project for development',
  projectTypeKey: 'software',
  lead: mockUser,
  avatarUrls: {
    '48x48': 'https://test.atlassian.net/secure/projectavatar?pid=10000&avatarId=10324',
  },
  issueTypes: [mockIssueType],
  self: 'https://test.atlassian.net/rest/api/3/project/10000',
};

/**
 * Mock issue
 */
export const mockIssue: Issue = {
  id: '10001',
  key: 'TEST-123',
  self: 'https://test.atlassian.net/rest/api/3/issue/10001',
  fields: {
    summary: 'Test issue',
    description: {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'This is a test issue',
            },
          ],
        },
      ],
    },
    status: {
      id: '10000',
      name: 'To Do',
      statusCategory: {
        id: 2,
        key: 'new',
        name: 'To Do',
        colorName: 'blue-gray',
      },
      self: 'https://test.atlassian.net/rest/api/3/status/10000',
    },
    priority: {
      id: '3',
      name: 'Medium',
      iconUrl: 'https://test.atlassian.net/images/icons/priorities/medium.svg',
      self: 'https://test.atlassian.net/rest/api/3/priority/3',
    },
    assignee: mockUser,
    reporter: mockUser,
    created: '2025-01-01T10:00:00.000Z',
    updated: '2025-01-01T10:00:00.000Z',
    labels: ['test', 'automated'],
    project: {
      id: mockProject.id,
      key: mockProject.key,
      name: mockProject.name,
      self: mockProject.self,
    },
    issuetype: mockIssueType,
  },
};

/**
 * Mock project version
 */
export const mockVersion: ProjectVersion = {
  id: '10000',
  name: 'v1.0.0',
  description: 'First release',
  released: false,
  archived: false,
  releaseDate: '2025-12-31',
  projectId: 10000,
  self: 'https://test.atlassian.net/rest/api/3/version/10000',
};

/**
 * Mock issue transitions
 */
export const mockTransitions = [
  {
    id: '11',
    name: 'To Do',
    to: {
      id: '10000',
      name: 'To Do',
    },
    hasScreen: false,
    isGlobal: true,
    isInitial: true,
    isConditional: false,
  },
  {
    id: '21',
    name: 'In Progress',
    to: {
      id: '10001',
      name: 'In Progress',
    },
    hasScreen: false,
    isGlobal: true,
    isInitial: false,
    isConditional: false,
  },
  {
    id: '31',
    name: 'Done',
    to: {
      id: '10002',
      name: 'Done',
    },
    hasScreen: false,
    isGlobal: true,
    isInitial: false,
    isConditional: false,
  },
];

/**
 * Mock error responses
 */
export const mockErrorResponses = {
  notFound: {
    errorMessages: ['Issue does not exist or you do not have permission to see it.'],
    errors: {},
  },
  unauthorized: {
    errorMessages: ['Client must be authenticated to access this resource.'],
    errors: {},
  },
  forbidden: {
    errorMessages: ['You do not have permission to perform this operation.'],
    errors: {},
  },
  validation: {
    errorMessages: ['The request was invalid.'],
    errors: {
      summary: 'Summary is required',
    },
  },
  rateLimit: {
    errorMessages: ['Rate limit exceeded. Try again later.'],
    errors: {},
    retryAfter: 60,
  },
};
