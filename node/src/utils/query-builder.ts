/**
 * JQL Query Builder
 * Fluent API for constructing JIRA Query Language (JQL) queries
 */

export type JQLOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | '~' | '!~' | 'IN' | 'NOT IN' | 'IS' | 'IS NOT';
export type JQLOrder = 'ASC' | 'DESC';

/**
 * JQL Query Builder
 */
export class JQLQueryBuilder {
  private conditions: string[] = [];
  private orderFields: Array<{ field: string; order: JQLOrder }> = [];

  /**
   * Add a condition to the query
   */
  where(field: string, operator: JQLOperator, value: string | number | string[]): this {
    if (Array.isArray(value)) {
      const values = value.map((v) => this.escapeValue(v)).join(', ');
      this.conditions.push(`${field} ${operator} (${values})`);
    } else {
      this.conditions.push(`${field} ${operator} ${this.escapeValue(value)}`);
    }
    return this;
  }

  /**
   * Add AND condition
   */
  and(field: string, operator: JQLOperator, value: string | number | string[]): this {
    return this.where(field, operator, value);
  }

  /**
   * Add OR condition group
   */
  or(callback: (builder: JQLQueryBuilder) => void): this {
    const subBuilder = new JQLQueryBuilder();
    callback(subBuilder);
    const subQuery = subBuilder.build();
    if (subQuery) {
      this.conditions.push(`(${subQuery})`);
    }
    return this;
  }

  /**
   * Filter by project
   */
  project(projectKey: string | string[]): this {
    if (Array.isArray(projectKey)) {
      return this.where('project', 'IN', projectKey);
    }
    return this.where('project', '=', projectKey);
  }

  /**
   * Filter by status
   */
  status(status: string | string[]): this {
    if (Array.isArray(status)) {
      return this.where('status', 'IN', status);
    }
    return this.where('status', '=', status);
  }

  /**
   * Filter by assignee
   */
  assignee(assignee: string | null): this {
    if (assignee === null) {
      return this.where('assignee', 'IS', 'EMPTY');
    }
    return this.where('assignee', '=', assignee);
  }

  /**
   * Filter by reporter
   */
  reporter(reporter: string): this {
    return this.where('reporter', '=', reporter);
  }

  /**
   * Filter by issue type
   */
  issueType(type: string | string[]): this {
    if (Array.isArray(type)) {
      return this.where('issuetype', 'IN', type);
    }
    return this.where('issuetype', '=', type);
  }

  /**
   * Filter by priority
   */
  priority(priority: string | string[]): this {
    if (Array.isArray(priority)) {
      return this.where('priority', 'IN', priority);
    }
    return this.where('priority', '=', priority);
  }

  /**
   * Filter by labels
   */
  labels(label: string | string[]): this {
    if (Array.isArray(label)) {
      return this.where('labels', 'IN', label);
    }
    return this.where('labels', '=', label);
  }

  /**
   * Filter by created date
   */
  createdAfter(date: string): this {
    return this.where('created', '>=', date);
  }

  /**
   * Filter by created date
   */
  createdBefore(date: string): this {
    return this.where('created', '<=', date);
  }

  /**
   * Filter by updated date
   */
  updatedAfter(date: string): this {
    return this.where('updated', '>=', date);
  }

  /**
   * Filter by updated date
   */
  updatedBefore(date: string): this {
    return this.where('updated', '<=', date);
  }

  /**
   * Search in summary and description
   */
  text(query: string): this {
    return this.where('text', '~', query);
  }

  /**
   * Filter by current user
   */
  currentUser(): this {
    return this.where('assignee', '=', 'currentUser()');
  }

  /**
   * Add order by clause
   */
  orderBy(field: string, order: JQLOrder = 'ASC'): this {
    this.orderFields.push({ field, order });
    return this;
  }

  /**
   * Build the JQL query string
   */
  build(): string {
    let query = this.conditions.join(' AND ');

    if (this.orderFields.length > 0) {
      const orderClauses = this.orderFields
        .map((o) => `${o.field} ${o.order}`)
        .join(', ');
      query += ` ORDER BY ${orderClauses}`;
    }

    return query;
  }

  /**
   * Escape value for JQL
   */
  private escapeValue(value: string | number): string {
    if (typeof value === 'number') {
      return value.toString();
    }

    // Don't quote JQL keywords and functions
    if (value === 'EMPTY' || value === 'NULL' || value.endsWith('()')) {
      return value;
    }

    // Check if value needs quoting (spaces, special characters)
    const needsQuotes = /[\s,()[\]{}"]/.test(value);

    if (needsQuotes) {
      // Escape quotes and wrap in quotes
      return `"${value.replace(/"/g, '\\"')}"`;
    }

    return value;
  }

  /**
   * Reset builder
   */
  reset(): this {
    this.conditions = [];
    this.orderFields = [];
    return this;
  }
}

/**
 * Create a new JQL query builder
 */
export function jql(): JQLQueryBuilder {
  return new JQLQueryBuilder();
}
