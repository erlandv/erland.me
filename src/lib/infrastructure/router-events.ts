/**
 * Centralized Router Event Manager
 *
 * Coordinates History API overrides to prevent multiple modules from conflicting patches.
 * Provides a pub/sub pattern for navigation events across the application.
 *
 * **Key Features:**
 * - Single point of History API patching (pushState/replaceState/popstate)
 * - Event notification system for navigation changes
 * - Automatic cleanup on page unload to prevent memory leaks
 * - Lazy setup - patches are applied only when first listener subscribes
 *
 * **Usage Pattern:**
 * ```typescript
 * import { onRouteChange } from './router-events';
 *
 * const unsubscribe = onRouteChange(event => {
 *   console.log(`Navigation: ${event.type} -> ${event.url}`);
 *   // Update UI, track analytics, etc.
 * });
 *
 * // Clean up when done
 * unsubscribe();
 * ```
 */

/**
 * Type of navigation event
 * - `push`: history.pushState() was called
 * - `replace`: history.replaceState() was called
 * - `pop`: browser back/forward button (popstate event)
 */
type RouterEventType = 'push' | 'replace' | 'pop';

/**
 * Navigation event object passed to listeners
 * @property type - Type of navigation (push/replace/pop)
 * @property url - Target URL after navigation
 * @property state - History state object (from pushState/replaceState data parameter)
 */
export type RouterEvent = {
  type: RouterEventType;
  url: string;
  state: unknown;
};

/**
 * Callback function invoked when navigation occurs
 * @param event - Navigation event details
 */
export type RouterEventListener = (event: RouterEvent) => void;

const listeners = new Set<RouterEventListener>();
let setupDone = false;

// Cleanup listeners on page unload to prevent memory leaks
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    listeners.clear();
  });
}

/**
 * Normalize URL input to string format
 * Handles various input types from History API methods
 * @param input - URL in string, URL object, or undefined
 * @returns Normalized URL string (current location if input is empty)
 */
function normalizeUrl(input: string | URL | null | undefined): string {
  if (!input) return window.location.href;
  if (typeof input === 'string') return input;
  return input.toString();
}

/**
 * Notify all registered listeners of a navigation event
 * Uses setTimeout to defer execution, allowing DOM updates to settle
 * Silently ignores individual listener failures to keep other listeners running
 * @param event - Navigation event to broadcast
 */
function notify(event: RouterEvent) {
  if (!listeners.size) return;
  // Defer notification to allow DOM updates to settle after navigation changes.
  window.setTimeout(() => {
    for (const listener of listeners) {
      try {
        listener(event);
      } catch {
        // Ignore failures from individual listeners to keep others running.
      }
    }
  }, 10);
}

/**
 * Setup History API patches (runs once)
 * Wraps native pushState/replaceState methods and adds popstate listener
 * Safe to call multiple times - only patches on first invocation
 */
function ensureSetup() {
  if (setupDone) return;
  if (typeof window === 'undefined' || typeof history === 'undefined') return;

  const originalPush = history.pushState?.bind(history);
  if (originalPush) {
    history.pushState = function (
      data: unknown,
      unused: string,
      url?: string | URL | null,
    ) {
      const result = originalPush(data, unused, url);
      notify({
        type: 'push',
        url: normalizeUrl(url),
        state: data,
      });
      return result;
    } as typeof history.pushState;
  }

  const originalReplace = history.replaceState?.bind(history);
  if (originalReplace) {
    history.replaceState = function (
      data: unknown,
      unused: string,
      url?: string | URL | null,
    ) {
      const result = originalReplace(data, unused, url);
      notify({
        type: 'replace',
        url: normalizeUrl(url),
        state: data,
      });
      return result;
    } as typeof history.replaceState;
  }

  window.addEventListener('popstate', event => {
    notify({
      type: 'pop',
      url: window.location.href,
      state: event.state,
    });
  });

  setupDone = true;
}

/**
 * Subscribe to navigation events
 * Automatically patches History API on first subscription
 * @param listener - Callback to invoke on navigation
 * @returns Unsubscribe function to remove listener
 * @example
 * const unsubscribe = onRouteChange(event => {
 *   if (event.type === 'push') {
 *     console.log('New page:', event.url);
 *   }
 * });
 * // Later...
 * unsubscribe();
 */
export function onRouteChange(listener: RouterEventListener): () => void {
  if (typeof window === 'undefined') return () => undefined;
  listeners.add(listener);
  ensureSetup();

  const unsubscribe = () => {
    listeners.delete(listener);
  };

  return unsubscribe;
}

/**
 * Manually trigger a route change event notification
 * Useful for programmatic navigation tracking without actual History API calls
 * @param type - Type of navigation event (default: 'replace')
 * @param url - Target URL (default: current location)
 * @param state - Optional state object
 * @example
 * // Notify listeners of a virtual navigation
 * triggerRouteChange('push', '/new-page', { fromSearch: true });
 */
export function triggerRouteChange(
  type: RouterEventType = 'replace',
  url?: string | URL | null,
  state?: unknown,
) {
  if (typeof window === 'undefined') return;
  ensureSetup();
  notify({
    type,
    url: normalizeUrl(url),
    state,
  });
}

/**
 * Clear all registered listeners
 * Useful for cleanup in test environments or manual memory management
 */
export function clearAllListeners(): void {
  listeners.clear();
}

/**
 * Get the current number of registered listeners
 * Useful for debugging potential memory leaks
 */
export function getListenerCount(): number {
  return listeners.size;
}

// Expose a tiny runtime-safe bridge for inline scripts that cannot use
// resolved import specifiers at runtime (Astro client-side script reinsertion
// may execute module text directly in the browser). Attach minimal APIs to
// window so inline <script type="module"> can call them without needing
// Vite/Server path resolution.
if (typeof window !== 'undefined') {
  interface EerlandRouterEvents {
    onRouteChange: typeof onRouteChange;
    triggerRouteChange: typeof triggerRouteChange;
    clearAllListeners: typeof clearAllListeners;
    getListenerCount: typeof getListenerCount;
  }

  // Put behind a short, unique namespace to avoid collisions
  interface WindowWithRouterEvents extends Window {
    __erland_router_events?: EerlandRouterEvents;
  }

  (window as WindowWithRouterEvents).__erland_router_events = {
    onRouteChange,
    triggerRouteChange,
    clearAllListeners,
    getListenerCount,
  };
}

declare global {
  interface Window {
    __erland_router_events?: {
      onRouteChange: typeof onRouteChange;
      triggerRouteChange: typeof triggerRouteChange;
      clearAllListeners: typeof clearAllListeners;
      getListenerCount: typeof getListenerCount;
    };
  }
}
