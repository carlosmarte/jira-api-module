/**
 * Configuration management for JIRA API module
 * Loads configuration from environment variables and optional config files
 * Priority: process.env > config file > defaults
 */

import { z } from 'zod';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';
import { JiraValidationError } from '../errors/index.js';

/**
 * JIRA configuration schema
 */
const ConfigSchema = z.object({
  baseUrl: z.string().url('Base URL must be a valid URL'),
  email: z.string().email('Email must be valid'),
  apiToken: z.string().min(1, 'API token is required'),
  timeout: z.number().positive().default(30000),
  maxRetries: z.number().int().min(0).max(10).default(3),
  retryDelay: z.number().positive().default(1000),
  maxConnections: z.number().int().positive().default(10),
  rateLimit: z.number().int().positive().default(100),
  server: z.object({
    host: z.string().default('0.0.0.0'),
    port: z.number().int().min(1).max(65535).default(8000),
    apiKey: z.string().optional(),
    reload: z.boolean().default(false),
  }).default({}),
  cache: z.object({
    enabled: z.boolean().default(false),
    ttl: z.number().int().positive().default(300),
    redisUrl: z.string().url().optional(),
  }).default({}),
  logging: z.object({
    level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    pretty: z.boolean().default(false),
  }).default({}),
});

/**
 * Configuration type
 */
export type Config = z.infer<typeof ConfigSchema>;

/**
 * Partial configuration for file storage (no sensitive data)
 */
const FileConfigSchema = ConfigSchema.partial().omit({ apiToken: true });
type FileConfig = z.infer<typeof FileConfigSchema>;

/**
 * Default configuration path
 */
const CONFIG_DIR = join(homedir(), '.jira-api');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

/**
 * Load configuration from environment variables
 */
function loadFromEnv(): Partial<Config> {
  const config: Partial<Config> = {};

  // JIRA configuration
  if (process.env.JIRA_BASE_URL) {
    config.baseUrl = process.env.JIRA_BASE_URL;
  }
  if (process.env.JIRA_EMAIL) {
    config.email = process.env.JIRA_EMAIL;
  }
  if (process.env.JIRA_API_TOKEN) {
    config.apiToken = process.env.JIRA_API_TOKEN;
  }

  // Optional configuration
  if (process.env.JIRA_TIMEOUT) {
    config.timeout = parseInt(process.env.JIRA_TIMEOUT, 10);
  }
  if (process.env.JIRA_MAX_RETRIES) {
    config.maxRetries = parseInt(process.env.JIRA_MAX_RETRIES, 10);
  }
  if (process.env.JIRA_RATE_LIMIT) {
    config.rateLimit = parseInt(process.env.JIRA_RATE_LIMIT, 10);
  }

  // Server configuration
  if (process.env.SERVER_HOST || process.env.SERVER_PORT || process.env.SERVER_API_KEY) {
    config.server = {
      host: process.env.SERVER_HOST || '0.0.0.0',
      port: process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT, 10) : 8000,
      apiKey: process.env.SERVER_API_KEY,
      reload: false,
    };
  }

  // Cache configuration
  if (process.env.JIRA_CACHE_ENABLED || process.env.REDIS_URL) {
    config.cache = {
      enabled: process.env.JIRA_CACHE_ENABLED === 'true',
      ttl: process.env.JIRA_CACHE_TTL ? parseInt(process.env.JIRA_CACHE_TTL, 10) : 300,
      redisUrl: process.env.REDIS_URL,
    };
  }

  // Logging configuration
  if (process.env.LOG_LEVEL) {
    config.logging = {
      level: process.env.LOG_LEVEL as any,
      pretty: process.env.LOG_PRETTY === 'true',
    };
  }

  return config;
}

/**
 * Load configuration from file
 */
async function loadFromFile(configPath: string = CONFIG_FILE): Promise<Partial<FileConfig>> {
  try {
    if (!existsSync(configPath)) {
      return {};
    }

    const content = await readFile(configPath, 'utf-8');
    const data = JSON.parse(content) as Partial<FileConfig>;
    return FileConfigSchema.parse(data);
  } catch (error) {
    // Silently ignore file read errors, env vars take precedence anyway
    return {};
  }
}

/**
 * Save configuration to file (non-sensitive data only)
 */
export async function saveConfig(
  config: Partial<Config>,
  configPath: string = CONFIG_FILE
): Promise<void> {
  try {
    // Ensure directory exists
    await mkdir(CONFIG_DIR, { recursive: true });

    // Remove sensitive data
    const { apiToken, ...safeConfig } = config;

    // Save to file
    await writeFile(configPath, JSON.stringify(safeConfig, null, 2), { mode: 0o600 });
  } catch (error) {
    throw new JiraValidationError(
      `Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Load and merge configuration from all sources
 * Priority: environment variables > config file > defaults
 */
export async function loadConfig(configPath?: string): Promise<Config> {
  try {
    // Load from all sources
    const envConfig = loadFromEnv();
    const fileConfig = await loadFromFile(configPath);

    // Merge with priority: env > file > defaults
    const merged = {
      ...fileConfig,
      ...envConfig,
      server: {
        ...(fileConfig.server || {}),
        ...(envConfig.server || {}),
      },
      cache: {
        ...(fileConfig.cache || {}),
        ...(envConfig.cache || {}),
      },
      logging: {
        ...(fileConfig.logging || {}),
        ...(envConfig.logging || {}),
      },
    };

    // Validate and apply defaults
    const validated = ConfigSchema.parse(merged);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new JiraValidationError(`Configuration validation failed: ${messages}`, error.errors);
    }
    throw error;
  }
}

/**
 * Validate partial configuration (for CLI input)
 */
export function validatePartialConfig(config: Partial<Config>): void {
  try {
    ConfigSchema.partial().parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new JiraValidationError(`Configuration validation failed: ${messages}`, error.errors);
    }
    throw error;
  }
}

/**
 * Get required environment variables with helpful error messages
 */
export function getRequiredEnvVars(): { baseUrl: string; email: string; apiToken: string } {
  const missing: string[] = [];

  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;

  if (!baseUrl) missing.push('JIRA_BASE_URL');
  if (!email) missing.push('JIRA_EMAIL');
  if (!apiToken) missing.push('JIRA_API_TOKEN');

  if (missing.length > 0) {
    throw new JiraValidationError(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        `Please set them or run 'jira-api configure' to set up configuration.`
    );
  }

  return { baseUrl: baseUrl!, email: email!, apiToken: apiToken! };
}
