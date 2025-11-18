/**
 * Centralized logging utility with production-safe behavior
 * Provides consistent logging interface with automatic environment detection
 */

/**
 * Available log levels
 * - debug: Verbose debugging (dev only)
 * - info: General information (dev only)
 * - warn: Warnings (prod + dev)
 * - error: Critical errors (prod + dev)
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Additional context data for log messages
 * @property feature - Feature name for scoped logging
 * @property timestamp - Whether to include timestamp (reserved for future use)
 */
interface LogContext {
  feature?: string;
  timestamp?: boolean;
  [key: string]: unknown;
}

/**
 * Check if we're running in production environment
 * Checks import.meta.env.PROD first, falls back to NODE_ENV
 * @returns True if running in production build
 */
function isProduction(): boolean {
  // Check build-time environment
  if (typeof import.meta !== 'undefined') {
    interface ImportMetaWithEnv {
      env?: { PROD?: boolean };
    }
    const meta = import.meta as ImportMetaWithEnv;
    if (meta.env) {
      return meta.env.PROD === true;
    }
  }
  // Fallback to runtime check
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'production';
  }
  return false;
}

/**
 * Check if specific log level should be output
 * In production: only warn and error
 * In development: all levels
 * @param level - Log level to check
 * @returns True if this level should be logged
 */
function shouldLog(level: LogLevel): boolean {
  const isProd = isProduction();

  // Production: only warnings and errors
  if (isProd) {
    return level === 'warn' || level === 'error';
  }

  // Development: all levels
  return true;
}

/**
 * Format log message with optional context
 * Adds emoji prefix and feature scope if provided
 * @param prefix - Emoji or text prefix for log level
 * @param message - Main log message
 * @param context - Optional context with feature name
 * @returns Formatted message string
 */
function formatMessage(
  prefix: string,
  message: string,
  context?: LogContext
): string {
  const parts: string[] = [prefix];

  if (context?.feature) {
    parts.push(`[${context.feature}]`);
  }

  parts.push(message);

  return parts.join(' ');
}

/**
 * Log additional context data if present
 * Filters out special properties (feature, timestamp) before logging
 * @param consoleFn - Console method to use for logging
 * @param context - Context object to log
 */
function logContext(
  consoleFn: (...args: unknown[]) => void,
  context?: LogContext
): void {
  if (!context) return;

  const { feature: _feature, timestamp: _timestamp, ...rest } = context;

  if (Object.keys(rest).length > 0) {
    consoleFn(rest);
  }
}

/**
 * Core logger class with feature-scoped logging
 *
 * Provides methods for different log levels with automatic environment detection.
 * Production builds only show warnings and errors; development shows all levels.
 *
 * @example
 * // Create feature-scoped logger
 * const log = new Logger('MyFeature');
 * log.debug('Initializing...');
 * log.info('Ready');
 * log.warn('Deprecated API used');
 * log.error('Failed to load', error);
 */
class Logger {
  private feature?: string;

  constructor(feature?: string) {
    this.feature = feature;
  }

  /**
   * Debug level logging (development only)
   * Use for verbose debugging information
   */
  debug(message: string, context?: LogContext): void {
    if (!shouldLog('debug')) return;

    const ctx = { ...context, feature: context?.feature || this.feature };
    console.debug(formatMessage('🔍', message, ctx));
    logContext(console.debug, ctx);
  }

  /**
   * Info level logging (development only)
   * Use for general informational messages
   */
  info(message: string, context?: LogContext): void {
    if (!shouldLog('info')) return;

    const ctx = { ...context, feature: context?.feature || this.feature };
    console.log(formatMessage('ℹ️', message, ctx));
    logContext(console.log, ctx);
  }

  /**
   * Warning level logging (production + development)
   * Use for recoverable errors or unexpected conditions
   */
  warn(message: string, context?: LogContext): void {
    if (!shouldLog('warn')) return;

    const ctx = { ...context, feature: context?.feature || this.feature };
    console.warn(formatMessage('⚠️', message, ctx));
    logContext(console.warn, ctx);
  }

  /**
   * Error level logging (production + development)
   * Use for critical errors that require attention
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    if (!shouldLog('error')) return;

    const ctx = { ...context, feature: context?.feature || this.feature };
    console.error(formatMessage('❌', message, ctx));

    if (error) {
      if (error instanceof Error) {
        console.error('Error:', error.message);
        if (!isProduction() && error.stack) {
          console.error('Stack:', error.stack);
        }
      } else {
        console.error('Error:', error);
      }
    }

    logContext(console.error, ctx);
  }

  /**
   * Create a child logger with scoped feature context
   * @param feature - Feature name for scoped logging
   * @returns New Logger instance with feature scope
   * @example
   * const log = logger.scope('ThemeToggle');
   * log.info('Theme changed'); // Outputs: ℹ️ [ThemeToggle] Theme changed
   */
  scope(feature: string): Logger {
    return new Logger(feature);
  }
}

/**
 * Singleton logger instance for general use
 * @example
 * import { logger } from './logger';
 * logger.info('App started');
 */
export const logger = new Logger();

/**
 * Factory function for feature-scoped loggers
 * Preferred over direct Logger instantiation for consistency
 * @param feature - Feature name for scoped logging
 * @returns New Logger instance with feature scope
 * @example
 * import { createLogger } from './logger';
 * const log = createLogger('ShareButtons');
 * log.debug('Initializing share buttons');
 */
export function createLogger(feature: string): Logger {
  return new Logger(feature);
}

// Export type for external use
export type { LogLevel, LogContext };
