/**
 * Error Boundary Utility for Client-Side Features
 *
 * Provides graceful error handling with user feedback and recovery mechanisms.
 * Integrates with toast notifications for non-intrusive error reporting.
 */

import { showToast } from './toast';
import { createLogger } from './logger';

const log = createLogger('ErrorBoundary');

/**
 * Context information for error reporting
 * @property feature - Feature name that encountered the error
 * @property operation - Specific operation that failed (optional)
 * @property recoverable - Whether error recovery should be attempted
 */
export type ErrorContext = {
  feature: string;
  operation?: string;
  recoverable?: boolean;
};

/**
 * Error handler callback function type
 */
export type ErrorHandler = (error: Error, context: ErrorContext) => void;

/**
 * Track feature load failures to prevent infinite retry loops
 */
const failedFeatures = new Set<string>();
const MAX_RETRIES = 2;
const retryAttempts = new Map<string, number>();

/**
 * Default error messages for different feature types
 */
const ERROR_MESSAGES: Record<string, string> = {
  share: 'Share feature temporarily unavailable',
  copy: 'Copy feature temporarily unavailable',
  lightbox: 'Image viewer temporarily unavailable',
  table: 'Table formatting temporarily unavailable',
  search: 'Search feature temporarily unavailable',
  default: 'Feature temporarily unavailable',
};

/**
 * Determine if an error is recoverable (e.g., network errors, temporary failures)
 * Checks error message and name against known recoverable patterns
 * @param error - Error object to check
 * @returns True if error matches recoverable patterns
 */
function isRecoverableError(error: Error): boolean {
  const recoverablePatterns = [
    /network/i,
    /timeout/i,
    /failed to fetch/i,
    /loading chunk \d+ failed/i,
    /dynamically imported module/i,
  ];

  return recoverablePatterns.some(
    pattern => pattern.test(error.message) || pattern.test(error.name)
  );
}

/**
 * Log error details for debugging in development
 * Uses logger utility for consistent formatting
 * @param error - Error object to log
 * @param context - Error context with feature and operation info
 */
function logError(error: Error, context: ErrorContext): void {
  log.error(`${context.feature} error`, error, {
    operation: context.operation,
    recoverable: context.recoverable,
  });
}

/**
 * Show user-friendly error notification
 * Displays toast in production only (dev errors go to console)
 * @param context - Error context to determine message
 */
function notifyUser(context: ErrorContext): void {
  const message = ERROR_MESSAGES[context.feature] || ERROR_MESSAGES.default;

  // Only show toast in production or if explicitly enabled
  if (!import.meta.env.DEV) {
    showToast(message, { type: 'error', duration: 3000 });
  }
}

/**
 * Mark feature as failed and check if retry should be attempted
 * Tracks retry attempts and marks features as permanently failed after max retries
 * @param featureName - Name of feature to check
 * @returns True if retry should be attempted (under MAX_RETRIES)
 */
function shouldRetry(featureName: string): boolean {
  const attempts = retryAttempts.get(featureName) || 0;

  if (attempts >= MAX_RETRIES) {
    failedFeatures.add(featureName);
    return false;
  }

  retryAttempts.set(featureName, attempts + 1);
  return true;
}

/**
 * Check if a feature has permanently failed
 */
export function hasFeatureFailed(featureName: string): boolean {
  return failedFeatures.has(featureName);
}

/**
 * Reset failure state for a feature (useful for manual retry)
 */
export function resetFeatureFailure(featureName: string): void {
  failedFeatures.delete(featureName);
  retryAttempts.delete(featureName);
}

/**
 * Main error handler with recovery logic
 * Logs error, determines if recoverable, attempts retry if appropriate
 * @param error - Error that occurred
 * @param context - Context about where error occurred
 * @example
 * handleFeatureError(new Error('Network failed'), {
 *   feature: 'lightbox',
 *   operation: 'load-module',
 *   recoverable: true
 * });
 */
export function handleFeatureError(error: Error, context: ErrorContext): void {
  // Log error for debugging
  logError(error, context);

  // Check if error is recoverable
  const recoverable = context.recoverable ?? isRecoverableError(error);

  // Determine if retry should be attempted
  if (recoverable && shouldRetry(context.feature)) {
    // Don't notify user on first retry attempt
    if ((retryAttempts.get(context.feature) || 0) > 1) {
      notifyUser(context);
    }
  } else {
    // Feature failed permanently
    notifyUser(context);
  }
}

/**
 * Wrapper function to safely execute feature initialization with error boundary
 */
export async function safeFeatureInit<T>(
  featureName: string,
  initFn: () => Promise<T>,
  options: {
    operation?: string;
    recoverable?: boolean;
    silent?: boolean;
  } = {}
): Promise<T | null> {
  // Don't attempt if feature has permanently failed
  if (hasFeatureFailed(featureName)) {
    return null;
  }

  try {
    return await initFn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    if (!options.silent) {
      handleFeatureError(err, {
        feature: featureName,
        operation: options.operation,
        recoverable: options.recoverable,
      });
    }

    return null;
  }
}

/**
 * Create a wrapped version of a feature loader function with error boundary
 * Returns new function that automatically catches and handles errors
 * @param fn - Function to wrap with error handling
 * @param featureName - Name of feature for error reporting
 * @param options - Error handling options (operation, recoverable)
 * @returns Wrapped function with error boundary
 * @example
 * const safeLightbox = withErrorBoundary(
 *   loadLightbox,
 *   'lightbox',
 *   { operation: 'init', recoverable: true }
 * );
 */
export function withErrorBoundary<
  T extends (...args: unknown[]) => Promise<unknown>,
>(
  fn: T,
  featureName: string,
  options: {
    operation?: string;
    recoverable?: boolean;
  } = {}
): T {
  return (async (...args: unknown[]) => {
    return safeFeatureInit(featureName, () => fn(...args), options);
  }) as T;
}

/**
 * Global unhandled error handler for runtime errors
 * Sets up window listeners for unhandled promise rejections and global errors
 * Should be called once during app initialization
 * @example
 * // In ui-init.ts
 * setupGlobalErrorHandler();
 */
export function setupGlobalErrorHandler(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

    handleFeatureError(error, {
      feature: 'global',
      operation: 'unhandled-rejection',
      recoverable: true,
    });
  });

  // Handle global errors
  window.addEventListener('error', event => {
    // Ignore script loading errors (already handled by feature loaders)
    if (event.filename && event.message.includes('Script error')) {
      return;
    }

    const error =
      event.error instanceof Error ? event.error : new Error(event.message);

    handleFeatureError(error, {
      feature: 'global',
      operation: 'runtime-error',
      recoverable: false,
    });
  });
}

/**
 * Export a convenient shorthand for showing errors
 * Displays error toast notification to user
 * @param message - Error message to display
 * @param duration - Display duration in milliseconds (default: 3000)
 */
export function showError(message: string, duration = 3000): void {
  showToast(message, { type: 'error', duration });
}

/**
 * Export convenience methods for manual error handling
 */
export const errorBoundary = {
  handle: handleFeatureError,
  safe: safeFeatureInit,
  wrap: withErrorBoundary,
  hasFailed: hasFeatureFailed,
  reset: resetFeatureFailure,
  showError,
  setupGlobal: setupGlobalErrorHandler,
};

export default errorBoundary;
