/**
 * Global UI Initializer with Lazy Loading Gates
 *
 * Central orchestrator for client-side feature initialization with intelligent
 * conditional loading based on DOM presence. Minimizes bundle size by only
 * importing features when needed.
 *
 * **Architecture:**
 * - **Gate Pattern**: Check for DOM selectors before importing modules
 * - **Cache-but-Reinit**: Import modules once, re-execute initializers on navigation
 * - **Error Boundaries**: Graceful degradation with automatic retry logic
 * - **View Transition Safe**: Reinitializes features after Astro page swaps
 * - **Mutation Observer**: Handles dynamically injected content (e.g., AdSense)
 *
 * **Managed Features:**
 * - Share buttons (Web Share API + clipboard fallback)
 * - Code copy buttons (clipboard API)
 * - Lightbox (image zoom overlay)
 * - Responsive tables (mobile data-label injection)
 * - Theme toggle (preference flyout)
 * - Theme control (API initialization)
 * - Stories viewer (Instagram-like interface)
 * - Category filter (hash-based routing)
 * - Download tracker (GTM analytics)
 *
 * **Critical Pattern for View Transitions:**
 * ```typescript
 * // WRONG: Blocks re-execution after navigation
 * if (loaded.feature) return;
 * const mod = await import('./feature');
 * loaded.feature = true;
 *
 * // CORRECT: Cache module, always run initializer
 * if (!loaded.feature) {
 *   const mod = await import('./feature');
 *   window.__featureInit = mod.init;
 *   loaded.feature = true;
 * }
 * window.__featureInit?.(); // Execute on every page load
 * ```
 *
 * **Usage:**
 * Automatically initialized via CriticalInit.astro in SiteLayout.
 * No manual invocation required.
 */

import { safeFeatureInit, setupGlobalErrorHandler } from './error-boundary';
import { initThemeControl } from '@lib/features/theme/theme-init';

/**
 * Extended Window interface with cached feature initializers
 * Stores references to initialization functions for features that need
 * re-execution on every page load (view transitions)
 */
interface WindowWithInitializers extends Window {
  __tableResponsiveInit?: () => void;
  __themeToggleInit?: () => Promise<void>;
  __categoryFilterInit?: () => void;
  __downloadTrackerInit?: () => void;
}

/**
 * Tracks which feature modules have been imported
 * Prevents duplicate imports while allowing re-execution of initializers
 */
type LoadedFlags = {
  share: boolean;
  copy: boolean;
  lightbox: boolean;
  table: boolean;
  themeToggle: boolean;
  themeControl: boolean;
  stories: boolean;
  categoryFilter: boolean;
  downloadTracker: boolean;
};

const loaded: LoadedFlags = {
  share: false,
  copy: false,
  lightbox: false,
  table: false,
  themeToggle: false,
  themeControl: false,
  stories: false,
  categoryFilter: false,
  downloadTracker: false,
};

/**
 * DOM selectors for feature gate checks
 * Each feature only loads if matching elements exist on the page
 */
const SELECTORS = {
  share: ['section.share', '.share__btn--copy', '.share__btn--native'],
  copy: ['pre code', 'pre[class*="language-"]'],
  lightbox: [
    '.prose img:not(.hero-image)',
    '.content-image-grid img:not(.hero-image)',
  ],
  table: ['.prose table'],
  themeToggle: ['.theme-toggle'],
  stories: ['[data-stories]'],
  categoryFilter: ['#category-filter', '[data-cat-page]'],
  downloadTracker: [
    'a[href*=".zip"]',
    'a[href*=".cdr"]',
    'a[href*=".ai"]',
    'a[href*=".pdf"]',
    'a[href*=".png"]',
    'a[download]',
    '.download-files-link',
  ],
} as const;

/**
 * Check if any selector matches an element in the DOM
 * Used for gate pattern to conditionally load features
 * @param selectors - Array of CSS selectors to test
 * @returns True if at least one selector has a matching element
 */
function hasTarget(selectors: readonly string[]): boolean {
  try {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return true;
    }
  } catch {
    // ignore invalid selectors
  }
  return false;
}

async function maybeLoadShare(): Promise<void> {
  if (loaded.share) return;
  if (!hasTarget(SELECTORS.share)) return;

  await safeFeatureInit(
    'share',
    async () => {
      const m = await import('@lib/features/share-buttons');
      loaded.share = true;
      m.autoInit?.();
      return m;
    },
    { operation: 'load-and-init', recoverable: true },
  );

  // If loading failed and feature is not marked as permanently failed,
  // the error boundary will handle retry logic automatically
}

async function maybeLoadCopy(): Promise<void> {
  if (loaded.copy) return;
  if (!hasTarget(SELECTORS.copy)) return;

  await safeFeatureInit(
    'copy',
    async () => {
      const m = await import('@lib/features/code-copy');
      loaded.copy = true;
      m.autoInit?.();
      return m;
    },
    { operation: 'load-and-init', recoverable: true },
  );
}

async function maybeLoadLightbox(): Promise<void> {
  if (loaded.lightbox) return;
  if (!hasTarget(SELECTORS.lightbox)) return;

  await safeFeatureInit(
    'lightbox',
    async () => {
      const m = await import('@lib/features/lightbox');
      loaded.lightbox = true;
      m.autoInit?.();
      return m;
    },
    { operation: 'load-and-init', recoverable: true },
  );
}

async function maybeLoadTable(): Promise<void> {
  if (!hasTarget(SELECTORS.table)) return;

  await safeFeatureInit(
    'table',
    async () => {
      // Import module once, but always re-run the initializer
      const w = window as WindowWithInitializers;
      if (!loaded.table) {
        const mod = await import('@lib/features/table-responsive');
        loaded.table = true;
        // Store reference to the initializer function for subsequent calls
        w.__tableResponsiveInit = mod.initResponsiveTables;
      }
      // Always execute the initializer to process new tables after navigation
      w.__tableResponsiveInit?.();
    },
    { operation: 'load-and-init', recoverable: true },
  );
}

async function maybeLoadThemeToggle(): Promise<void> {
  // Theme toggle is always present (rendered in SiteLayout), so no gate check needed
  // Just ensure we load and init it

  await safeFeatureInit(
    'themeToggle',
    async () => {
      // Import module once, but always re-run the initializer
      const w = window as WindowWithInitializers;
      if (!loaded.themeToggle) {
        const mod = await import('@lib/features/theme/theme-toggle');
        loaded.themeToggle = true;
        // Store reference to the initializer function for subsequent calls
        w.__themeToggleInit = async () => {
          await mod.init();
        };
      }
      // Always execute the initializer to handle view transitions
      await w.__themeToggleInit?.();
    },
    { operation: 'load-and-init', recoverable: true },
  );
}

async function maybeLoadStories(): Promise<void> {
  if (loaded.stories) return;
  if (!hasTarget(SELECTORS.stories)) return;

  await safeFeatureInit(
    'stories',
    async () => {
      const m = await import('@lib/features/stories');
      loaded.stories = true;
      m.autoInit?.();
      return m;
    },
    { operation: 'load-and-init', recoverable: true },
  );
}

async function maybeLoadCategoryFilter(): Promise<void> {
  if (!hasTarget(SELECTORS.categoryFilter)) return;

  await safeFeatureInit(
    'categoryFilter',
    async () => {
      // Import module once, but always re-run the initializer
      const w = window as WindowWithInitializers;
      if (!loaded.categoryFilter) {
        const mod = await import('@lib/features/category-filter');
        loaded.categoryFilter = true;
        // Store reference to the autoInit function for subsequent calls
        w.__categoryFilterInit = mod.autoInit;
      }
      // Always execute the initializer to handle view transitions
      w.__categoryFilterInit?.();
    },
    { operation: 'load-and-init', recoverable: true },
  );
}

async function maybeLoadDownloadTracker(): Promise<void> {
  if (!hasTarget(SELECTORS.downloadTracker)) return;

  await safeFeatureInit(
    'downloadTracking',
    async () => {
      // Import module once, but always re-run the initializer
      const w = window as WindowWithInitializers;
      if (!loaded.downloadTracker) {
        const mod = await import('@lib/tracking/download-tracker');
        loaded.downloadTracker = true;
        // Store reference to the initializer function for subsequent calls
        w.__downloadTrackerInit = mod.initDownloadTracking;
      }
      // Always execute the initializer to attach new listeners
      w.__downloadTrackerInit?.();
    },
    { operation: 'load-and-init', recoverable: true },
  );
}

/**
 * Run all feature gate checks and initialize as needed
 * Called on page load, navigation, and DOM mutations
 */
function gateAll(): void {
  void maybeLoadShare();
  void maybeLoadCopy();
  void maybeLoadLightbox();
  void maybeLoadTable();
  void maybeLoadStories();
  void maybeLoadCategoryFilter();
  void maybeLoadDownloadTracker();
}

/**
 * Initialize theme toggle feature (always present in layout)
 * Separate from gateAll to prevent infinite mutation observer loops
 */
function gateThemeToggle(): void {
  void maybeLoadThemeToggle();
}

/**
 * Initialize theme control API (runs once, always)
 * Sets up global theme management system with localStorage sync
 */
function initTheme(): void {
  // Theme control initialization (runs once, always)
  if (loaded.themeControl) return;
  loaded.themeControl = true;
  initThemeControl();
}

/**
 * Setup event listeners for Astro view transitions and DOM mutations
 * Re-runs gate checks after navigation and dynamic content insertion
 */
function setupGateListeners(): void {
  // Re-gate on Astro router events until all features loaded
  const run = () => gateAll();

  document.addEventListener('astro:page-load', run);
  document.addEventListener('astro:after-swap', run);

  // Theme toggle initialization (separate from dynamic content)
  // Only needs to run on page load, not on DOM mutations
  const runTheme = () => gateThemeToggle();
  document.addEventListener('astro:page-load', runTheme);
  document.addEventListener('astro:after-swap', runTheme);

  // Debounced MutationObserver for dynamic content only
  // (excludes theme toggle to prevent infinite loops)
  let t: number | null = null;
  const debounced = () => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => {
      t = null;
      run(); // Only runs gateAll(), not theme toggle
    }, 50);
  };
  const observer = new MutationObserver(debounced);
  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Main entry point for UI initialization system
 *
 * Sets up:
 * - Global error handlers
 * - Theme control API
 * - Feature gate checks
 * - View transition listeners
 * - DOM mutation observers
 *
 * Safe to call multiple times - internal guards prevent duplicate initialization.
 * Typically called from CriticalInit.astro in SiteLayout.
 *
 * @example
 * // In CriticalInit.astro or app entry point
 * import { initUi } from './lib/ui-init';
 * initUi();
 */
export function initUi(): void {
  // Setup global error handlers once
  setupGlobalErrorHandler();

  // Initialize theme control API (runs once, always)
  initTheme();

  // Initial gate run
  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        gateAll();
        gateThemeToggle(); // Theme toggle initial load
        setupGateListeners();
      },
      { once: true },
    );
  } else {
    // Small delay to allow Astro content to hydrate
    setTimeout(() => {
      gateAll();
      gateThemeToggle(); // Theme toggle initial load
      setupGateListeners();
    }, 50);
  }
}

export default initUi;
