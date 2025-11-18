/**
 * Share Buttons with Web Share API
 *
 * Provides social sharing functionality with native Web Share API fallback to clipboard copy.
 * Uses event delegation for router-safe operation across Astro view transitions.
 *
 * **Features:**
 * - Native share on supported devices (iOS, Android, desktop with share targets)
 * - Clipboard copy fallback for desktop browsers without share support
 * - Automatic button visibility based on Web Share API availability
 * - Event delegation: single document listener handles all share buttons
 * - Extracts share data from parent section attributes or button data attributes
 *
 * **HTML Structure:**
 * ```html
 * <section class="share" data-title="Post Title" data-url="/blog/post">
 *   <button class="share__btn--copy" data-copy="https://example.com">Copy</button>
 *   <button class="share__btn--native" hidden>Share</button>
 * </section>
 * ```
 *
 * **Usage:**
 * Typically auto-initialized via `ui-init.ts` gate system.
 * ```typescript
 * import { initShareButtons } from './share-buttons';
 *
 * // Manual initialization
 * initShareButtons();
 * ```
 */

import { copyToClipboard } from './clipboard';
import { showToast } from './toast';
import { onRouteChange } from './router-events';

/**
 * DOM scope for querying elements
 */
type Scope = Document | Element | ParentNode;

/**
 * Web Share API data structure
 */
interface ShareData {
  title?: string;
  text?: string;
  url?: string;
}

/**
 * Navigator extended with share method
 */
interface NavigatorWithShare {
  share?: (data: ShareData) => Promise<void>;
}

/**
 * Check if Web Share API is available in current browser
 * @returns True if navigator.share() is available
 */
function canUseWebShare(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!(navigator as unknown as NavigatorWithShare).share
  );
}

/**
 * Show/hide native share buttons based on Web Share API availability
 * Updates visibility of all `.share__native` buttons in scope
 * @param scope - DOM scope to query (default: document)
 */
function updateNativeVisibility(scope: Scope = document) {
  const showNative = canUseWebShare();
  const list = (
    scope instanceof Document ? scope : (scope as Element)
  ).querySelectorAll?.('.share__native');
  if (!list) return;
  list.forEach(el => {
    (el as HTMLElement).hidden = !showNative;
  });
}

/**
 * Handle copy button click - copy URL to clipboard
 * Extracts URL from button data-copy attribute or parent section data-url
 * @param btn - Copy button element that was clicked
 */
async function handleCopy(btn: Element) {
  const root = (btn.closest('section.share') || document.body) as HTMLElement;
  const url = (btn.getAttribute('data-copy') ||
    root.getAttribute('data-url') ||
    location.href) as string;
  let ok = false;
  try {
    interface WindowWithCopyFn extends Window {
      copyToClipboard?: (text: string) => Promise<boolean>;
    }
    const w = window as WindowWithCopyFn;
    if (w && typeof w.copyToClipboard === 'function') {
      ok = !!(await w.copyToClipboard(url));
    } else {
      ok = await copyToClipboard(url);
    }
  } catch {
    ok = false;
  }

  if (ok) {
    showToast('Link copied.', { duration: 2000, type: 'success' });
  }
}

/**
 * Handle native share button click - trigger Web Share API
 * Extracts share data from parent section attributes
 * @param btn - Native share button element that was clicked
 */
async function handleNativeShare(btn: Element) {
  if (!canUseWebShare()) return;
  const root = (btn.closest('section.share') || document.body) as HTMLElement;
  const title = root.getAttribute('data-title') || document.title;
  const text = root.getAttribute('data-text') || title || '';
  const url = root.getAttribute('data-url') || location.href;
  try {
    const nav = navigator as unknown as NavigatorWithShare;
    if (nav.share) {
      await nav.share({ title, text, url });
    }
  } catch {
    // ignore dismiss/denied
  }
}

/**
 * Setup document-level event delegation for share buttons
 * Single listener handles all share button clicks (copy and native)
 * Only runs once - safe to call multiple times
 */
let delegationSetup = false;
function setupDelegation() {
  if (delegationSetup) return;
  delegationSetup = true;

  document.addEventListener('click', ev => {
    const target = ev.target as Element | null;
    if (!target) return;
    const copyBtn = target.closest?.('.share__btn--copy');
    if (copyBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      void handleCopy(copyBtn);
      return;
    }
    const nativeBtn = target.closest?.('.share__btn--native');
    if (nativeBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      void handleNativeShare(nativeBtn);
      return;
    }
  });
}

let routerSetup = false;
function setupRouterReinit() {
  if (routerSetup) return;
  routerSetup = true;

  const run = () => updateNativeVisibility(document);

  document.addEventListener('astro:page-load', run);
  document.addEventListener('astro:after-swap', run);

  onRouteChange(run);

  // Observe DOM changes for new share sections
  const observer = new MutationObserver(() => {
    // debounce a touch
    setTimeout(run, 0);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Initialize share buttons system
 * Updates native button visibility and sets up event delegation
 * @param scope - DOM scope to initialize (default: document)
 * @example
 * // Initialize for entire document
 * initShareButtons();
 *
 * // Initialize for specific section
 * const section = document.querySelector('.article');
 * initShareButtons(section);
 */
export function initShareButtons(scope?: Scope) {
  updateNativeVisibility(scope || document);
  setupDelegation();
}

/**
 * Auto-initialization entry point
 * Sets up share buttons with router and DOM mutation observers
 * Called by ui-init.ts gate system when share buttons are detected
 */
export function autoInit() {
  const run = () => initShareButtons(document);
  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        run();
        setupRouterReinit();
      },
      { once: true }
    );
  } else {
    setTimeout(() => {
      run();
      setupRouterReinit();
    }, 50);
  }
}

export default initShareButtons;
