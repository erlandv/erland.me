// Centralized router event manager to coordinate History API overrides.
// Modules can subscribe to navigation changes without patching history individually.

type RouterEventType = 'push' | 'replace' | 'pop';

export type RouterEvent = {
  type: RouterEventType;
  url: string;
  state: unknown;
};

export type RouterEventListener = (event: RouterEvent) => void;

const listeners = new Set<RouterEventListener>();
let setupDone = false;

// Cleanup listeners on page unload to prevent memory leaks
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    listeners.clear();
  });
}

function normalizeUrl(input: string | URL | null | undefined): string {
  if (!input) return window.location.href;
  if (typeof input === 'string') return input;
  return input.toString();
}

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

function ensureSetup() {
  if (setupDone) return;
  if (typeof window === 'undefined' || typeof history === 'undefined') return;

  const originalPush = history.pushState?.bind(history);
  if (originalPush) {
    history.pushState = function (
      data: any,
      unused: string,
      url?: string | URL | null
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
      data: any,
      unused: string,
      url?: string | URL | null
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

export function onRouteChange(listener: RouterEventListener): () => void {
  if (typeof window === 'undefined') return () => undefined;
  listeners.add(listener);
  ensureSetup();

  const unsubscribe = () => {
    listeners.delete(listener);
  };

  return unsubscribe;
}

export function triggerRouteChange(
  type: RouterEventType = 'replace',
  url?: string | URL | null,
  state?: unknown
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
