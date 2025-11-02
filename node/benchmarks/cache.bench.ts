/**
 * Cache Benchmarks
 */

import { describe, bench, beforeEach } from 'vitest';
import { Cache } from '../src/utils/cache.js';

describe('Cache Performance', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache({ type: 'memory', maxMemoryItems: 10000 });
  });

  bench('Cache set operation', async () => {
    await cache.set('key', { data: 'value' });
  });

  bench('Cache get operation (hit)', async () => {
    await cache.set('benchmark-key', { data: 'value' });
    await cache.get('benchmark-key');
  });

  bench('Cache get operation (miss)', async () => {
    await cache.get('non-existent-key');
  });

  bench('Cache has operation', async () => {
    await cache.set('check-key', 'value');
    await cache.has('check-key');
  });

  bench('Cache wrap function (cached)', async () => {
    const fn = async () => ({ result: 'data' });
    await cache.wrap('wrap-key', fn);
    await cache.wrap('wrap-key', fn); // Second call should use cache
  });

  bench('Key generation', () => {
    cache.key('project', 'PROJ', 'issue', '123', 'version', '1.0');
  });

  bench('Large object caching', async () => {
    const largeObject = {
      users: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
      })),
    };
    await cache.set('large-object', largeObject);
    await cache.get('large-object');
  });
});
