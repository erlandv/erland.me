/**
 * Centralized logging utility with production-safe behavior
 * Provides consistent logging interface with automatic environment detection
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  feature?: string;
  timestamp?: boolean;
  [key: string]: unknown;
}

/**
 * Check if we're running in production environment
 */
function isProduction(): boolean {
  // Check build-time environment
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env.PROD === true;
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
 */
function logContext(
  consoleFn: (...args: unknown[]) => void,
  context?: LogContext
): void {
  if (!context) return;

  const { feature, timestamp, ...rest } = context;

  if (Object.keys(rest).length > 0) {
    consoleFn(rest);
  }
}

/**
 * Core logger class with feature-scoped logging
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
   */
  scope(feature: string): Logger {
    return new Logger(feature);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export factory function for feature-scoped loggers
export function createLogger(feature: string): Logger {
  return new Logger(feature);
}

// Export type for external use
export type { LogLevel, LogContext };
