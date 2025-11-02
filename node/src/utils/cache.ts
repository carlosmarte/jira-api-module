/**
 * Caching layer
 * Supports in-memory and Redis caching
 */

import { getLogger } from './logger.js';

export interface CacheConfig {
  type?: 'memory' | 'redis';
  ttl?: number; // Time to live in seconds
  redisUrl?: string;
  maxMemoryItems?: number;
}

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

/**
 * In-memory cache provider
 */
class MemoryCacheProvider implements CacheProvider {
  private cache: Map<string, { value: any; expires: number }> = new Map();
  private maxItems: number;
  private logger = getLogger();

  constructor(maxItems: number = 1000) {
    this.maxItems = maxItems;
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    this.logger.debug({ key }, 'Cache hit');
    return item.value as T;
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxItems) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    });

    this.logger.debug({ key, ttl }, 'Cache set');
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
    this.logger.debug({ key }, 'Cache delete');
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.logger.debug('Cache cleared');
  }

  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    // Check if expired
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

/**
 * Redis cache provider (requires ioredis)
 */
class RedisCacheProvider implements CacheProvider {
  private redis: any;
  private logger = getLogger();

  constructor(redisUrl: string) {
    try {
      // Dynamic import to make Redis optional
      const Redis = require('ioredis');
      this.redis = new Redis(redisUrl);
      this.logger.info({ redisUrl }, 'Redis cache provider initialized');
    } catch (error) {
      this.logger.error({ error }, 'Failed to initialize Redis. Install ioredis package.');
      throw new Error('Redis initialization failed. Install ioredis: npm install ioredis');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) {
        return null;
      }

      this.logger.debug({ key }, 'Redis cache hit');
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error({ error, key }, 'Redis get error');
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
      this.logger.debug({ key, ttl }, 'Redis cache set');
    } catch (error) {
      this.logger.error({ error, key }, 'Redis set error');
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.logger.debug({ key }, 'Redis cache delete');
    } catch (error) {
      this.logger.error({ error, key }, 'Redis delete error');
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
      this.logger.debug('Redis cache cleared');
    } catch (error) {
      this.logger.error({ error }, 'Redis clear error');
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error({ error, key }, 'Redis exists error');
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

/**
 * Cache manager
 */
export class Cache {
  private provider: CacheProvider;
  private ttl: number;
  private logger = getLogger();

  constructor(config: CacheConfig = {}) {
    this.ttl = config.ttl || 300; // 5 minutes default

    if (config.type === 'redis' && config.redisUrl) {
      this.provider = new RedisCacheProvider(config.redisUrl);
      this.logger.info('Cache initialized with Redis provider');
    } else {
      this.provider = new MemoryCacheProvider(config.maxMemoryItems);
      this.logger.info('Cache initialized with memory provider');
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    return this.provider.get<T>(key);
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    return this.provider.set(key, value, ttl || this.ttl);
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    return this.provider.del(key);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    return this.provider.clear();
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    return this.provider.has(key);
  }

  /**
   * Wrap a function with caching
   */
  async wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }

  /**
   * Generate cache key
   */
  key(...parts: (string | number)[]): string {
    return parts.join(':');
  }
}

/**
 * Global cache instance
 */
let globalCache: Cache | null = null;

/**
 * Initialize global cache
 */
export function initializeCache(config: CacheConfig = {}): Cache {
  globalCache = new Cache(config);
  return globalCache;
}

/**
 * Get global cache instance
 */
export function getCache(): Cache {
  if (!globalCache) {
    globalCache = new Cache();
  }
  return globalCache;
}
