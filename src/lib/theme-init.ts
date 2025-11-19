/**
 * Theme control API initialization
 *
 * This module provides a comprehensive theme management system with:
 * - Theme preference storage (light/dark/auto)
 * - System theme change detection
 * - View transitions support
 * - Public API for theme manipulation
 * - Subscriber pattern for theme changes
 *
 * The minimal FOUC prevention code runs inline in <head> via CriticalInit.astro.
 * This module handles the full interactive theme control after page load.
 */

import { createLogger } from './logger';

const log = createLogger('ThemeControl');

/**
 * User's theme preference setting
 * - 'light': Force light theme
 * - 'dark': Force dark theme
 * - 'auto': Follow system preference
 */
type ThemePreference = 'light' | 'dark' | 'auto';

/**
 * Resolved theme value (always light or dark, never auto)
 */
type ResolvedTheme = 'light' | 'dark';

/**
 * Current theme state including preference and resolved value
 */
interface ThemeState {
  preference: ThemePreference;
  resolved: ResolvedTheme;
}

/**
 * Public API for theme control
 * Exposed globally as window.__themeControl
 */
interface ThemeControl {
  getPreference: () => ThemePreference;
  getResolved: () => ResolvedTheme;
  setPreference: (pref: ThemePreference) => void;
  cyclePreference: () => ThemePreference;
  subscribe: (callback: (state: ThemeState) => void) => () => void;
  syncDocument: (doc?: Document) => ResolvedTheme;
}

/**
 * Astro view transition event with new document reference
 */
interface AstroBeforeSwapEvent extends Event {
  readonly detail?: {
    readonly newDocument?: Document;
  };
}

declare global {
  interface Window {
    __themeControl?: ThemeControl;
  }
}

/**
 * Initialize theme control API
 *
 * Sets up complete theme management system including:
 * - Preference storage in localStorage
 * - System theme change detection
 * - View transitions support (Astro)
 * - Subscriber pattern for theme changes
 * - Public API on window.__themeControl
 *
 * Safe to call multiple times - will re-sync document if already initialized
 *
 * @example
 * // Initialize in CriticalInit.astro or app entry point
 * initThemeControl();
 *
 * // Access API anywhere
 * window.__themeControl.setPreference('dark');
 * window.__themeControl.subscribe(state => {
 *   console.log('Theme changed:', state);
 * });
 */
export function initThemeControl(): void {
  // Skip if already initialized (view transitions)
  if (window.__themeControl) {
    window.__themeControl.syncDocument(document);
    return;
  }

  const storageKey = 'theme-preference';
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const subscribers = new Set<(state: ThemeState) => void>();

  const readStoredPreference = (): ThemePreference => {
    try {
      const value = localStorage.getItem(storageKey);
      return value === 'light' || value === 'dark' || value === 'auto'
        ? value
        : 'dark';
    } catch {
      return 'dark';
    }
  };

  const writeStoredPreference = (value: ThemePreference): void => {
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      // Silent fail - theme still works without localStorage persistence
    }
  };

  let preference = readStoredPreference();

  const resolvePreference = (pref: ThemePreference): ResolvedTheme => {
    if (pref === 'auto') {
      return media.matches ? 'dark' : 'light';
    }
    return pref;
  };

  const syncDocument = (targetDoc: Document = document): ResolvedTheme => {
    const resolved = resolvePreference(preference);
    const root = targetDoc.documentElement;

    if (root) {
      if (resolved === 'light') {
        root.setAttribute('data-theme', 'light');
      } else {
        root.removeAttribute('data-theme');
      }
      root.setAttribute('data-theme-preference', preference);
      root.setAttribute('data-theme-resolved', resolved);
    }

    return resolved;
  };

  const notifySubscribers = (resolved: ResolvedTheme): void => {
    subscribers.forEach(callback => {
      try {
        callback({ preference, resolved });
      } catch (error) {
        log.error('Theme subscriber error', { error });
      }
    });
  };

  const applyPreference = (pref: ThemePreference, persist: boolean): void => {
    preference = pref;
    const resolved = syncDocument(document);

    if (persist) {
      writeStoredPreference(pref);
    }

    notifySubscribers(resolved);
  };

  const setPreference = (nextPref: ThemePreference): void => {
    applyPreference(nextPref, true);
  };

  // System theme change listener
  const handleMediaChange = (): void => {
    if (preference === 'auto') {
      applyPreference(preference, false);
    }
  };

  media.addEventListener('change', handleMediaChange);

  // View transitions support
  const syncIncomingDocument = (event: Event): void => {
    const astroEvent = event as AstroBeforeSwapEvent;
    const newDoc = astroEvent?.detail?.newDocument;
    if (newDoc) {
      syncDocument(newDoc);
    }
  };

  const reapplyCurrent = (): void => {
    syncDocument(document);
  };

  document.addEventListener('astro:before-swap', syncIncomingDocument);
  document.addEventListener('astro:after-swap', reapplyCurrent);
  document.addEventListener('astro:page-load', reapplyCurrent);

  // Public API
  const api: ThemeControl = {
    getPreference: () => preference,
    getResolved: () => resolvePreference(preference),
    setPreference,
    cyclePreference: () => {
      const order: ThemePreference[] = ['auto', 'light', 'dark'];
      const index = order.indexOf(preference);
      const next = order[(index + 1) % order.length];
      setPreference(next);
      return next;
    },
    subscribe: callback => {
      if (typeof callback !== 'function') {
        return () => {};
      }
      subscribers.add(callback);
      // Immediately notify with current state
      callback({
        preference,
        resolved: resolvePreference(preference),
      });
      return () => {
        subscribers.delete(callback);
      };
    },
    syncDocument,
  };

  Object.defineProperty(window, '__themeControl', {
    value: api,
    writable: false,
    configurable: false,
  });
}
