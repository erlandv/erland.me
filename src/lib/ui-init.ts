/**
 * ui-init.ts - global UI initializer gate
 * Consolidates share, code-copy, lightbox, table-responsive, and theme control init into a single conditional dynamic import.
 * Includes error boundary for graceful error handling and recovery.
 */

import { safeFeatureInit, setupGlobalErrorHandler } from './error-boundary';
import { initThemeControl } from './theme-init';

// Window interface extensions for cached initializers
interface WindowWithInitializers extends Window {
  __tableResponsiveInit?: () => void;
  __themeToggleInit?: () => Promise<void>;
  __categoryFilterInit?: () => void;
  __downloadTrackerInit?: () => void;
}

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
      const m = await import('./share-buttons');
      loaded.share = true;
      m.autoInit?.();
      return m;
    },
    { operation: 'load-and-init', recoverable: true }
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
      const m = await import('./code-copy');
      loaded.copy = true;
      m.autoInit?.();
      return m;
    },
    { operation: 'load-and-init', recoverable: true }
  );
}

async function maybeLoadLightbox(): Promise<void> {
  if (loaded.lightbox) return;
  if (!hasTarget(SELECTORS.lightbox)) return;

  await safeFeatureInit(
    'lightbox',
    async () => {
      const m = await import('./lightbox');
      loaded.lightbox = true;
      m.autoInit?.();
      return m;
    },
    { operation: 'load-and-init', recoverable: true }
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
        const mod = await import('./table-responsive');
        loaded.table = true;
        // Store reference to the initializer function for subsequent calls
        w.__tableResponsiveInit = mod.initResponsiveTables;
      }
      // Always execute the initializer to process new tables after navigation
      w.__tableResponsiveInit?.();
    },
    { operation: 'load-and-init', recoverable: true }
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
        const mod = await import('./theme-toggle');
        loaded.themeToggle = true;
        // Store reference to the initializer function for subsequent calls
        w.__themeToggleInit = async () => {
          await mod.init();
        };
      }
      // Always execute the initializer to handle view transitions
      await w.__themeToggleInit?.();
    },
    { operation: 'load-and-init', recoverable: true }
  );
}

async function maybeLoadStories(): Promise<void> {
  if (loaded.stories) return;
  if (!hasTarget(SELECTORS.stories)) return;

  await safeFeatureInit(
    'stories',
    async () => {
      const m = await import('./stories');
      loaded.stories = true;
      m.autoInit?.();
      return m;
    },
    { operation: 'load-and-init', recoverable: true }
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
        const mod = await import('./category-filter');
        loaded.categoryFilter = true;
        // Store reference to the autoInit function for subsequent calls
        w.__categoryFilterInit = mod.autoInit;
      }
      // Always execute the initializer to handle view transitions
      w.__categoryFilterInit?.();
    },
    { operation: 'load-and-init', recoverable: true }
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
        const mod = await import('./download-tracker');
        loaded.downloadTracker = true;
        // Store reference to the initializer function for subsequent calls
        w.__downloadTrackerInit = mod.initDownloadTracking;
      }
      // Always execute the initializer to attach new listeners
      w.__downloadTrackerInit?.();
    },
    { operation: 'load-and-init', recoverable: true }
  );
}

function gateAll(): void {
  void maybeLoadShare();
  void maybeLoadCopy();
  void maybeLoadLightbox();
  void maybeLoadTable();
  void maybeLoadStories();
  void maybeLoadCategoryFilter();
  void maybeLoadDownloadTracker();
}

function gateThemeToggle(): void {
  void maybeLoadThemeToggle();
}

function initTheme(): void {
  // Theme control initialization (runs once, always)
  if (loaded.themeControl) return;
  loaded.themeControl = true;
  initThemeControl();
}

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
      { once: true }
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
