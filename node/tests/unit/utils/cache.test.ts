/**
 * Cache tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Cache, initializeCache, getCache } from '../../../src/utils/cache.js';

describe('Cache', () => {
  describe('Memory Cache', () => {
    let cache: Cache;

    beforeEach(() => {
      cache = new Cache({ type: 'memory', ttl: 300, maxMemoryItems: 10 });
    });

    it('should set and get value', async () => {
      await cache.set('key1', { data: 'value1' });
      const value = await cache.get<{ data: string }>('key1');
      expect(value).toEqual({ data: 'value1' });
    });

    it('should return null for non-existent key', async () => {
      const value = await cache.get('non-existent');
      expect(value).toBeNull();
    });

    it('should check if key exists', async () => {
      await cache.set('key1', 'value1');
      expect(await cache.has('key1')).toBe(true);
      expect(await cache.has('key2')).toBe(false);
    });

    it('should delete value', async () => {
      await cache.set('key1', 'value1');
      expect(await cache.has('key1')).toBe(true);

      await cache.del('key1');
      expect(await cache.has('key1')).toBe(false);
    });

    it('should clear all values', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      expect(await cache.has('key1')).toBe(true);
      expect(await cache.has('key2')).toBe(true);

      await cache.clear();
      expect(await cache.has('key1')).toBe(false);
      expect(await cache.has('key2')).toBe(false);
    });

    it('should respect TTL', async () => {
      await cache.set('key1', 'value1', 1); // 1 second TTL

      // Value should exist immediately
      expect(await cache.get('key1')).toBe('value1');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Value should be expired
      expect(await cache.get('key1')).toBeNull();
      expect(await cache.has('key1')).toBe(false);
    });

    it('should use default TTL if not specified', async () => {
      await cache.set('key1', 'value1');
      const value = await cache.get('key1');
      expect(value).toBe('value1');
    });

    it('should handle different data types', async () => {
      await cache.set('string', 'value');
      await cache.set('number', 123);
      await cache.set('boolean', true);
      await cache.set('object', { foo: 'bar' });
      await cache.set('array', [1, 2, 3]);

      expect(await cache.get('string')).toBe('value');
      expect(await cache.get('number')).toBe(123);
      expect(await cache.get('boolean')).toBe(true);
      expect(await cache.get('object')).toEqual({ foo: 'bar' });
      expect(await cache.get('array')).toEqual([1, 2, 3]);
    });

    it('should evict oldest item when max size reached', async () => {
      const smallCache = new Cache({ type: 'memory', maxMemoryItems: 3 });

      await smallCache.set('key1', 'value1');
      await smallCache.set('key2', 'value2');
      await smallCache.set('key3', 'value3');

      // All three should exist
      expect(await smallCache.has('key1')).toBe(true);
      expect(await smallCache.has('key2')).toBe(true);
      expect(await smallCache.has('key3')).toBe(true);

      // Adding fourth item should evict first
      await smallCache.set('key4', 'value4');
      expect(await smallCache.has('key1')).toBe(false);
      expect(await smallCache.has('key2')).toBe(true);
      expect(await smallCache.has('key3')).toBe(true);
      expect(await smallCache.has('key4')).toBe(true);
    });
  });

  describe('Wrap Function', () => {
    let cache: Cache;
    let callCount: number;
    let mockFn: () => Promise<string>;

    beforeEach(() => {
      cache = new Cache({ type: 'memory', ttl: 300 });
      callCount = 0;
      mockFn = vi.fn(async () => {
        callCount++;
        return `result-${callCount}`;
      });
    });

    it('should cache function result', async () => {
      const result1 = await cache.wrap('test-key', mockFn);
      expect(result1).toBe('result-1');
      expect(callCount).toBe(1);

      // Second call should use cache
      const result2 = await cache.wrap('test-key', mockFn);
      expect(result2).toBe('result-1');
      expect(callCount).toBe(1); // Function not called again
    });

    it('should call function if cache miss', async () => {
      const result1 = await cache.wrap('key1', mockFn);
      expect(result1).toBe('result-1');

      const result2 = await cache.wrap('key2', mockFn);
      expect(result2).toBe('result-2');

      expect(callCount).toBe(2);
    });

    it('should respect custom TTL in wrap', async () => {
      const result1 = await cache.wrap('test-key', mockFn, 1);
      expect(result1).toBe('result-1');

      await new Promise((resolve) => setTimeout(resolve, 1100));

      const result2 = await cache.wrap('test-key', mockFn, 1);
      expect(result2).toBe('result-2');
      expect(callCount).toBe(2);
    });

    it('should handle function errors', async () => {
      const errorFn = async () => {
        throw new Error('Test error');
      };

      await expect(cache.wrap('error-key', errorFn)).rejects.toThrow('Test error');
      expect(await cache.has('error-key')).toBe(false);
    });
  });

  describe('Key Generation', () => {
    let cache: Cache;

    beforeEach(() => {
      cache = new Cache({ type: 'memory' });
    });

    it('should generate key from parts', () => {
      const key = cache.key('user', 'john@example.com');
      expect(key).toBe('user:john@example.com');
    });

    it('should handle multiple parts', () => {
      const key = cache.key('project', 'PROJ', 'issue', '123');
      expect(key).toBe('project:PROJ:issue:123');
    });

    it('should handle numeric parts', () => {
      const key = cache.key('user', 123, 'profile');
      expect(key).toBe('user:123:profile');
    });

    it('should handle single part', () => {
      const key = cache.key('simple');
      expect(key).toBe('simple');
    });
  });

  describe('Global Cache Instance', () => {
    it('should initialize global cache', () => {
      const cache = initializeCache({ type: 'memory', ttl: 600 });
      expect(cache).toBeInstanceOf(Cache);
    });

    it('should get global cache instance', () => {
      initializeCache({ type: 'memory' });
      const cache = getCache();
      expect(cache).toBeInstanceOf(Cache);
    });

    it('should create cache if not initialized', () => {
      const cache = getCache();
      expect(cache).toBeInstanceOf(Cache);
    });

    it('should share same instance', async () => {
      const cache1 = getCache();
      const cache2 = getCache();

      await cache1.set('shared-key', 'shared-value');
      const value = await cache2.get('shared-key');
      expect(value).toBe('shared-value');
    });
  });

  describe('Cache Integration', () => {
    it('should work with complex objects', async () => {
      const cache = new Cache({ type: 'memory' });

      const complexData = {
        user: {
          id: '123',
          name: 'John Doe',
          emails: ['john@example.com', 'john.doe@example.com'],
          metadata: {
            created: new Date().toISOString(),
            roles: ['admin', 'user'],
          },
        },
        settings: {
          theme: 'dark',
          notifications: true,
        },
      };

      await cache.set('complex', complexData);
      const retrieved = await cache.get('complex');
      expect(retrieved).toEqual(complexData);
    });

    it('should handle concurrent operations', async () => {
      const cache = new Cache({ type: 'memory' });

      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(cache.set(`key${i}`, `value${i}`));
      }

      await Promise.all(operations);

      for (let i = 0; i < 10; i++) {
        expect(await cache.get(`key${i}`)).toBe(`value${i}`);
      }
    });

    it('should handle rapid get/set cycles', async () => {
      const cache = new Cache({ type: 'memory' });
      const key = 'rapid-key';

      for (let i = 0; i < 100; i++) {
        await cache.set(key, `value${i}`);
        const value = await cache.get(key);
        expect(value).toBe(`value${i}`);
      }
    });
  });

  describe('Edge Cases', () => {
    let cache: Cache;

    beforeEach(() => {
      cache = new Cache({ type: 'memory' });
    });

    it('should handle empty string key', async () => {
      await cache.set('', 'empty-key-value');
      expect(await cache.get('')).toBe('empty-key-value');
    });

    it('should handle null/undefined values correctly', async () => {
      await cache.set('null-value', null);
      await cache.set('undefined-value', undefined);

      expect(await cache.get('null-value')).toBe(null);
      expect(await cache.get('undefined-value')).toBe(undefined);
    });

    it('should handle special characters in keys', async () => {
      const specialKey = 'key:with:colons/and/slashes@and@at';
      await cache.set(specialKey, 'special-value');
      expect(await cache.get(specialKey)).toBe('special-value');
    });

    it('should overwrite existing key', async () => {
      await cache.set('key', 'value1');
      expect(await cache.get('key')).toBe('value1');

      await cache.set('key', 'value2');
      expect(await cache.get('key')).toBe('value2');
    });

    it('should handle very large values', async () => {
      const largeArray = new Array(10000).fill('x').map((_, i) => ({ id: i, data: 'x'.repeat(100) }));
      await cache.set('large', largeArray);
      const retrieved = await cache.get('large');
      expect(retrieved).toEqual(largeArray);
      expect(Array.isArray(retrieved)).toBe(true);
      expect(retrieved?.length).toBe(10000);
    });
  });
});
