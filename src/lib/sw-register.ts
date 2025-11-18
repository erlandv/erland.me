/**
 * Service Worker Registration and Lifecycle Management
 *
 * Handles registration, updates, and lifecycle events for the service worker.
 * Provides hooks for update notifications and error handling.
 *
 * **Features:**
 * - Production-only registration (skips dev to avoid caching issues)
 * - Update detection with user notifications
 * - Graceful error handling with logging
 * - Skip waiting support for immediate activation
 * - Toast notification integration for updates
 * - Automatic registration on window load
 *
 * **Service Worker Lifecycle:**
 * 1. Register: Initial registration of `/sw.js`
 * 2. Installing: New worker being installed
 * 3. Waiting: New worker waiting to activate
 * 4. Active: Worker is controlling the page
 * 5. Update found: New version detected, notify user
 *
 * **Usage:**
 * ```typescript
 * // Auto-initialization (recommended)
 * import { autoInit } from './sw-register';
 * autoInit();
 *
 * // Manual with callbacks
 * import { registerServiceWorker } from './sw-register';
 * registerServiceWorker({
 *   onSuccess: () => console.log('SW active'),
 *   onUpdate: () => showUpdatePrompt(),
 *   onError: (err) => logError(err)
 * });
 * ```
 */

import { createLogger } from './logger';

const log = createLogger('ServiceWorker');

/**
 * Configuration for service worker registration callbacks
 * @property onSuccess - Called when SW is active and ready
 * @property onUpdate - Called when new SW version is available
 * @property onError - Called on registration failure
 */
type ServiceWorkerConfig = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
};

/**
 * Check if service workers are supported in current browser
 * @returns True if navigator.serviceWorker API exists
 */
function isSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Register service worker with lifecycle callbacks
 *
 * Only runs in production builds to prevent dev content caching.
 * Listens for update events and triggers callbacks appropriately.
 *
 * @param config - Optional callbacks for success, update, and error events
 * @returns ServiceWorkerRegistration if successful, null otherwise
 * @example
 * const registration = await registerServiceWorker({
 *   onSuccess: (reg) => console.log('Active:', reg.scope),
 *   onUpdate: (reg) => showToast('Update available!'),
 *   onError: (err) => console.error('Failed:', err)
 * });
 */
export async function registerServiceWorker(
  config: ServiceWorkerConfig = {}
): Promise<ServiceWorkerRegistration | null> {
  if (!isSupported()) {
    log.info('Service workers not supported');
    return null;
  }

  if (!import.meta.env.PROD) {
    log.info('Skipping registration in development');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    log.info('Service worker registered', { scope: registration.scope });

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      log.info('Update found, installing new version...');

      newWorker.addEventListener('statechange', () => {
        if (
          newWorker.state === 'installed' &&
          navigator.serviceWorker.controller
        ) {
          // New service worker available
          log.info('New version available');
          config.onUpdate?.(registration);
        }
      });
    });

    // Success callback
    if (registration.active) {
      config.onSuccess?.(registration);
    }

    return registration;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    log.error('Registration failed', err);
    config.onError?.(err);
    return null;
  }
}

/**
 * Unregister service worker (for development/testing)
 * Useful for debugging or removing SW from browser
 * @returns True if successfully unregistered, false otherwise
 * @example
 * // In browser console for debugging
 * await unregisterServiceWorker();
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const success = await registration.unregister();
      log.info('Unregistered', { success });
      return success;
    }
    return false;
  } catch (error) {
    log.error('Unregister failed', error);
    return false;
  }
}

/**
 * Skip waiting phase and activate new service worker immediately
 * Sends message to waiting worker to take control without page reload
 * Use with caution - may cause issues if old and new SW are incompatible
 * @example
 * // User clicks 'Update Now' button
 * skipWaiting();
 * window.location.reload();
 */
export function skipWaiting(): void {
  if (!isSupported()) return;

  const waiting = navigator.serviceWorker.controller;
  if (waiting) {
    waiting.postMessage('SKIP_WAITING');
  }
}

/**
 * Show update notification to user via toast system
 * Dynamically imports toast module to avoid bundling if not needed
 * Falls back to logger if toast import fails
 */
function showUpdateNotification(): void {
  // Import toast dynamically to avoid bundling if not needed
  import('./toast')
    .then(({ showToast }) => {
      showToast('New version available! Refresh to update.', {
        duration: 5000,
        type: 'info',
      });
    })
    .catch(() => {
      // Fallback to logger if toast fails
      log.info('New version available. Please refresh the page.');
    });
}

/**
 * Initialize service worker with default configuration
 * Registers on window load to avoid blocking initial render
 * Sets up success, update, and error handlers with logging and notifications
 * @example
 * // In CriticalInit.astro or app entry point
 * initServiceWorker();
 */
export function initServiceWorker(): void {
  if (typeof window === 'undefined') return;

  // Register on load to avoid blocking initial render
  window.addEventListener('load', () => {
    registerServiceWorker({
      onSuccess: () => {
        log.info('Active and ready');
      },
      onUpdate: () => {
        log.info('Update available');
        showUpdateNotification();
      },
      onError: error => {
        log.error('Registration error', error);
      },
    });
  });
}

/**
 * Auto-initialization entry point for service worker
 * Wrapper around initServiceWorker for consistent API with other modules
 * Typically called by ui-init.ts or layout component
 */
export function autoInit(): void {
  initServiceWorker();
}

export default initServiceWorker;
