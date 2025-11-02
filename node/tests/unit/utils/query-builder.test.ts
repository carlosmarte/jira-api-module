/**
 * JQL Query Builder tests
 */

import { describe, it, expect } from 'vitest';
import { JQLQueryBuilder, jql } from '../../../src/utils/query-builder.js';

describe('JQLQueryBuilder', () => {
  describe('Basic Queries', () => {
    it('should build simple project query', () => {
      const query = jql().project('PROJ').build();
      expect(query).toBe('project = PROJ');
    });

    it('should build query with multiple projects', () => {
      const query = jql().project(['PROJ1', 'PROJ2']).build();
      expect(query).toBe('project IN (PROJ1, PROJ2)');
    });

    it('should build query with status', () => {
      const query = jql().status('Open').build();
      expect(query).toBe('status = Open');
    });

    it('should build query with multiple statuses', () => {
      const query = jql().status(['Open', 'In Progress']).build();
      expect(query).toBe('status IN (Open, "In Progress")');
    });

    it('should build query with assignee', () => {
      const query = jql().assignee('john@example.com').build();
      expect(query).toBe('assignee = john@example.com');
    });

    it('should build query with empty assignee', () => {
      const query = jql().assignee(null).build();
      expect(query).toBe('assignee IS EMPTY');
    });
  });

  describe('Complex Queries', () => {
    it('should chain multiple conditions with AND', () => {
      const query = jql()
        .project('PROJ')
        .status('Open')
        .assignee('john@example.com')
        .build();
      expect(query).toBe('project = PROJ AND status = Open AND assignee = john@example.com');
    });

    it('should support OR conditions', () => {
      const query = jql()
        .project('PROJ')
        .or((builder) => {
          builder.status('Open').priority('High');
        })
        .build();
      expect(query).toBe('project = PROJ AND (status = Open AND priority = High)');
    });

    it('should support nested OR conditions', () => {
      const query = jql()
        .project('PROJ')
        .or((builder) => {
          builder
            .where('status', '=', 'Open')
            .where('status', '=', 'Reopened');
        })
        .build();
      expect(query).toBe('project = PROJ AND (status = Open AND status = Reopened)');
    });
  });

  describe('Date Filters', () => {
    it('should filter by created after', () => {
      const query = jql().createdAfter('-7d').build();
      expect(query).toBe('created >= -7d');
    });

    it('should filter by created before', () => {
      const query = jql().createdBefore('2025-01-01').build();
      expect(query).toBe('created <= 2025-01-01');
    });

    it('should filter by updated after', () => {
      const query = jql().updatedAfter('-1w').build();
      expect(query).toBe('updated >= -1w');
    });

    it('should filter by updated before', () => {
      const query = jql().updatedBefore('2025-12-31').build();
      expect(query).toBe('updated <= 2025-12-31');
    });
  });

  describe('Ordering', () => {
    it('should add ORDER BY clause', () => {
      const query = jql()
        .project('PROJ')
        .orderBy('created', 'DESC')
        .build();
      expect(query).toBe('project = PROJ ORDER BY created DESC');
    });

    it('should add multiple ORDER BY fields', () => {
      const query = jql()
        .project('PROJ')
        .orderBy('priority', 'DESC')
        .orderBy('created', 'ASC')
        .build();
      expect(query).toBe('project = PROJ ORDER BY priority DESC, created ASC');
    });

    it('should default to ASC order', () => {
      const query = jql()
        .project('PROJ')
        .orderBy('created')
        .build();
      expect(query).toBe('project = PROJ ORDER BY created ASC');
    });
  });

  describe('Convenience Methods', () => {
    it('should filter by issue type', () => {
      const query = jql().issueType('Bug').build();
      expect(query).toBe('issuetype = Bug');
    });

    it('should filter by multiple issue types', () => {
      const query = jql().issueType(['Bug', 'Task']).build();
      expect(query).toBe('issuetype IN (Bug, Task)');
    });

    it('should filter by priority', () => {
      const query = jql().priority('High').build();
      expect(query).toBe('priority = High');
    });

    it('should filter by labels', () => {
      const query = jql().labels('urgent').build();
      expect(query).toBe('labels = urgent');
    });

    it('should filter by reporter', () => {
      const query = jql().reporter('jane@example.com').build();
      expect(query).toBe('reporter = jane@example.com');
    });

    it('should filter by current user', () => {
      const query = jql().currentUser().build();
      expect(query).toBe('assignee = currentUser()');
    });

    it('should perform text search', () => {
      const query = jql().text('bug in login').build();
      expect(query).toBe('text ~ "bug in login"');
    });
  });

  describe('Value Escaping', () => {
    it('should quote values with spaces', () => {
      const query = jql().where('summary', '~', 'critical bug').build();
      expect(query).toBe('summary ~ "critical bug"');
    });

    it('should quote values with special characters', () => {
      const query = jql().where('summary', '=', 'bug [URGENT]').build();
      expect(query).toBe('summary = "bug [URGENT]"');
    });

    it('should escape quotes in values', () => {
      const query = jql().where('summary', '=', 'bug with "quotes"').build();
      expect(query).toBe('summary = "bug with \\"quotes\\""');
    });

    it('should handle numeric values', () => {
      const query = jql().where('priority', '>', 3).build();
      expect(query).toBe('priority > 3');
    });

    it('should not quote simple alphanumeric values', () => {
      const query = jql().where('status', '=', 'Open').build();
      expect(query).toBe('status = Open');
    });

    it('should not quote EMPTY and NULL keywords', () => {
      const query = jql().where('assignee', 'IS', 'EMPTY').build();
      expect(query).toBe('assignee IS EMPTY');
    });
  });

  describe('Complex Use Cases', () => {
    it('should build realistic issue search query', () => {
      const query = jql()
        .project('PROJ')
        .status(['Open', 'In Progress'])
        .assignee('currentUser()')
        .priority(['High', 'Critical'])
        .createdAfter('-30d')
        .orderBy('priority', 'DESC')
        .orderBy('created', 'DESC')
        .build();

      expect(query).toContain('project = PROJ');
      expect(query).toContain('status IN');
      expect(query).toContain('assignee = currentUser()');
      expect(query).toContain('priority IN');
      expect(query).toContain('created >= -30d');
      expect(query).toContain('ORDER BY priority DESC, created DESC');
    });

    it('should build query for unassigned issues', () => {
      const query = jql()
        .project('PROJ')
        .assignee(null)
        .status('Open')
        .build();

      expect(query).toBe('project = PROJ AND assignee IS EMPTY AND status = Open');
    });

    it('should build query with labels and text search', () => {
      const query = jql()
        .project('PROJ')
        .labels(['urgent', 'bug'])
        .text('crashes on startup')
        .build();

      expect(query).toContain('project = PROJ');
      expect(query).toContain('labels IN');
      expect(query).toContain('text ~ "crashes on startup"');
    });
  });

  describe('Reset', () => {
    it('should reset builder state', () => {
      const builder = jql().project('PROJ').status('Open');
      expect(builder.build()).toBe('project = PROJ AND status = Open');

      builder.reset();
      expect(builder.build()).toBe('');
    });

    it('should allow reuse after reset', () => {
      const builder = jql().project('PROJ1');
      expect(builder.build()).toBe('project = PROJ1');

      builder.reset().project('PROJ2');
      expect(builder.build()).toBe('project = PROJ2');
    });
  });

  describe('Generic Where Clause', () => {
    it('should support all operators', () => {
      expect(jql().where('priority', '=', 'High').build()).toBe('priority = High');
      expect(jql().where('priority', '!=', 'Low').build()).toBe('priority != Low');
      expect(jql().where('created', '>', '2025-01-01').build()).toBe('created > 2025-01-01');
      expect(jql().where('created', '>=', '2025-01-01').build()).toBe('created >= 2025-01-01');
      expect(jql().where('created', '<', '2025-12-31').build()).toBe('created < 2025-12-31');
      expect(jql().where('created', '<=', '2025-12-31').build()).toBe('created <= 2025-12-31');
      expect(jql().where('summary', '~', 'bug').build()).toBe('summary ~ bug');
      expect(jql().where('summary', '!~', 'test').build()).toBe('summary !~ test');
      expect(jql().where('assignee', 'IS', 'EMPTY').build()).toBe('assignee IS EMPTY');
      expect(jql().where('assignee', 'IS NOT', 'EMPTY').build()).toBe('assignee IS NOT EMPTY');
    });

    it('should support IN operator with array', () => {
      const query = jql().where('status', 'IN', ['Open', 'Closed']).build();
      expect(query).toBe('status IN (Open, Closed)');
    });

    it('should support NOT IN operator with array', () => {
      const query = jql().where('status', 'NOT IN', ['Resolved', 'Closed']).build();
      expect(query).toBe('status NOT IN (Resolved, Closed)');
    });
  });
});
