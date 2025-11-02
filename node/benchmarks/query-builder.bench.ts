/**
 * JQL Query Builder Benchmarks
 */

import { describe, bench } from 'vitest';
import { jql } from '../src/utils/query-builder.js';

describe('JQL Query Builder Performance', () => {
  bench('Simple query', () => {
    jql().project('PROJ').build();
  });

  bench('Complex query with multiple conditions', () => {
    jql()
      .project('PROJ')
      .status(['Open', 'In Progress'])
      .assignee('currentUser()')
      .priority(['High', 'Critical'])
      .createdAfter('-30d')
      .orderBy('priority', 'DESC')
      .orderBy('created', 'DESC')
      .build();
  });

  bench('Query with OR conditions', () => {
    jql()
      .project('PROJ')
      .or((builder) => {
        builder.status('Open').priority('High');
      })
      .build();
  });

  bench('Query with text search', () => {
    jql().project('PROJ').text('critical bug in production').build();
  });

  bench('Builder reuse', () => {
    const builder = jql();
    builder.project('PROJ').status('Open').build();
    builder.reset();
    builder.project('PROJ2').status('Closed').build();
  });
});
