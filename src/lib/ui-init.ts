/**
 * ui-init.ts - global UI initializer gate
 * Consolidates share, code-copy, lightbox, and table-responsive init into a single conditional dynamic import.
 */

type LoadedFlags = {
  share: boolean;
  copy: boolean;
  lightbox: boolean;
  table: boolean;
};

const loaded: LoadedFlags = {
  share: false,
  copy: false,
  lightbox: false,
  table: false,
};

const SELECTORS = {
  share: ['section.share', '.share__btn--copy', '.share__btn--native'],
  copy: ['pre code', 'pre[class*="language-"]'],
  lightbox: [
    '.prose img:not(.hero-image)',
    '.content-image-grid img:not(.hero-image)',
  ],
  table: ['.prose table'],
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
  try {
    const mod = await import('./share-buttons');
    loaded.share = true;
    mod.autoInit?.();
  } catch (e) {
    console.error('ui-init: Share load error', e);
  }
}

async function maybeLoadCopy(): Promise<void> {
  if (loaded.copy) return;
  if (!hasTarget(SELECTORS.copy)) return;
  try {
    const mod = await import('./code-copy');
    loaded.copy = true;
    mod.autoInit?.();
  } catch (e) {
    console.error('ui-init: CodeCopy load error', e);
  }
}

async function maybeLoadLightbox(): Promise<void> {
  if (loaded.lightbox) return;
  if (!hasTarget(SELECTORS.lightbox)) return;
  try {
    const mod = await import('./lightbox');
    loaded.lightbox = true;
    mod.autoInit?.();
  } catch (e) {
    console.error('ui-init: Lightbox load error', e);
  }
}

async function maybeLoadTable(): Promise<void> {
  if (!hasTarget(SELECTORS.table)) return;
  try {
    // Import module once, but always re-run the initializer
    if (!loaded.table) {
      const mod = await import('./table-responsive');
      loaded.table = true;
      // Store reference to the initializer function for subsequent calls
      (window as any).__tableResponsiveInit = mod.initResponsiveTables;
    }
    // Always execute the initializer to process new tables after navigation
    (window as any).__tableResponsiveInit?.();
  } catch (e) {
    console.error('ui-init: Table load error', e);
  }
}

function gateAll(): void {
  void maybeLoadShare();
  void maybeLoadCopy();
  void maybeLoadLightbox();
  void maybeLoadTable();
}

function setupGateListeners(): void {
  // Re-gate on Astro router events until all features loaded
  const run = () => gateAll();

  document.addEventListener('astro:page-load', run);
  document.addEventListener('astro:after-swap', run);

  // Debounced MutationObserver for DOM injections
  let t: number | null = null;
  const debounced = () => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => {
      t = null;
      run();
    }, 50);
  };
  const observer = new MutationObserver(debounced);
  observer.observe(document.body, { childList: true, subtree: true });
}

export function initUi(): void {
  // Initial gate run
  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        gateAll();
        setupGateListeners();
      },
      { once: true }
    );
  } else {
    // Small delay to allow Astro content to hydrate
    setTimeout(() => {
      gateAll();
      setupGateListeners();
    }, 50);
  }
}

export default initUi;
