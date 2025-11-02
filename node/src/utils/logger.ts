/**
 * Structured logging with Pino
 * Provides per-request context and configurable log levels
 */

import pino, { type Logger, type LoggerOptions } from 'pino';
import type { Config } from './config.js';

/**
 * Log context for requests
 */
export interface LogContext {
  requestId?: string;
  method?: string;
  url?: string;
  userId?: string;
  [key: string]: any;
}

/**
 * Logger instance
 */
let loggerInstance: Logger | null = null;

/**
 * Create logger with configuration
 */
export function createLogger(config?: Partial<Config['logging']>): Logger {
  const options: LoggerOptions = {
    level: config?.level || process.env.LOG_LEVEL || 'info',
    transport: config?.pretty
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
    base: {
      env: process.env.NODE_ENV || 'development',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  loggerInstance = pino(options);
  return loggerInstance;
}

/**
 * Get logger instance (creates default if not exists)
 */
export function getLogger(): Logger {
  if (!loggerInstance) {
    return createLogger();
  }
  return loggerInstance;
}

/**
 * Create child logger with context
 */
export function createContextLogger(context: LogContext): Logger {
  return getLogger().child(context);
}

/**
 * Log HTTP request
 */
export function logRequest(
  method: string,
  url: string,
  context?: LogContext
): Logger {
  const logger = context
    ? createContextLogger(context)
    : getLogger();

  logger.info({ method, url }, 'HTTP Request');
  return logger;
}

/**
 * Log HTTP response
 */
export function logResponse(
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  context?: LogContext
): void {
  const logger = context
    ? createContextLogger(context)
    : getLogger();

  logger.info(
    { method, url, statusCode, duration },
    'HTTP Response'
  );
}

/**
 * Log error with context
 */
export function logError(
  error: Error,
  context?: LogContext
): void {
  const logger = context
    ? createContextLogger(context)
    : getLogger();

  logger.error(
    {
      err: error,
      stack: error.stack,
      ...context,
    },
    error.message
  );
}

/**
 * Log warning
 */
export function logWarning(
  message: string,
  context?: LogContext
): void {
  const logger = context
    ? createContextLogger(context)
    : getLogger();

  logger.warn(context || {}, message);
}

/**
 * Log debug information
 */
export function logDebug(
  message: string,
  data?: any
): void {
  getLogger().debug(data || {}, message);
}

/**
 * Set logger level dynamically
 */
export function setLogLevel(level: string): void {
  const logger = getLogger();
  logger.level = level;
}

export { Logger };
