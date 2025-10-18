/**
 * Service Worker Registration
 *
 * Handles registration, updates, and lifecycle management of the service worker.
 * Only runs in production to avoid caching dev content.
 */

import { createLogger } from './logger';

const log = createLogger('ServiceWorker');

type ServiceWorkerConfig = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
};

/**
 * Check if service worker is supported
 */
function isSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Register service worker
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
 * Skip waiting and activate new service worker immediately
 */
export function skipWaiting(): void {
  if (!isSupported()) return;

  const waiting = navigator.serviceWorker.controller;
  if (waiting) {
    waiting.postMessage('SKIP_WAITING');
  }
}

/**
 * Show update notification to user
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
 * Initialize service worker with default config
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
 * Auto-initialize in production
 */
export function autoInit(): void {
  initServiceWorker();
}

export default initServiceWorker;
