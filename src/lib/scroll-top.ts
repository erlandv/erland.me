/**
 * Scroll-to-Top Button Controller
 *
 * Manages show/hide behavior and smooth scroll functionality for scroll-to-top button.
 * Works seamlessly with Astro view transitions and router navigation.
 *
 * **Features:**
 * - Auto show/hide based on scroll position
 * - Smooth scroll animation (with fallback for older browsers)
 * - Router-safe: reinitializes on navigation
 * - Prevents duplicate event binding
 *
 * **HTML Structure:**
 * ```html
 * <button id="scroll-top">↑ Top</button>
 * ```
 *
 * **Usage:**
 * Typically auto-initialized via `ui-init.ts` or layout component.
 * ```typescript
 * import { initScrollTop } from './scroll-top';
 * initScrollTop();
 * ```
 */

import { onRouteChange } from './router-events';

/**
 * Scroll threshold in pixels - button shows when scrolled past this point
 */
const SHOW_AT_PX = 200;

/**
 * Update button visibility based on current scroll position
 * Sets data-visible attribute for CSS-based show/hide
 * @param btn - Scroll-top button element
 */
function updateVisibility(btn: HTMLElement) {
  try {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    btn.setAttribute('data-visible', y > SHOW_AT_PX ? 'true' : 'false');
  } catch {}
}

/**
 * Bind scroll and click event handlers to button
 * Prevents duplicate binding via data-bound attribute
 * @param btn - Scroll-top button element to initialize
 */
function bindButton(btn: HTMLElement) {
  if (btn.dataset.bound === 'true') return;
  btn.dataset.bound = 'true';

  const onScroll = () => updateVisibility(btn);
  const onClick = (ev: Event) => {
    try {
      ev.preventDefault();
      const preferSmooth = 'scrollBehavior' in document.documentElement.style;
      if (preferSmooth) window.scrollTo({ top: 0, behavior: 'smooth' });
      else window.scrollTo(0, 0);
    } catch {}
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  btn.addEventListener('click', onClick);
  // initial state
  onScroll();
}

/**
 * Initialize scroll-to-top button functionality
 * Finds button by ID and attaches event handlers
 * Safe to call multiple times - prevents duplicate binding
 * @example
 * // After page load or navigation
 * initScrollTop();
 */
export function initScrollTop() {
  const btn = document.getElementById('scroll-top');
  if (btn instanceof HTMLElement) bindButton(btn);
}

let routerSetup = false;
function setupRouterReinit() {
  if (routerSetup) return;
  routerSetup = true;

  const run = () => initScrollTop();

  document.addEventListener('astro:page-load', run);
  document.addEventListener('astro:after-swap', run);
  onRouteChange(run);

  const observer = new MutationObserver(() => {
    // debounce minimal
    setTimeout(run, 0);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Auto-initialization entry point
 * Sets up scroll-top with router and DOM observers for automatic reinit
 * Typically called by ui-init.ts or layout component on app startup
 */
export function autoInit() {
  const run = () => {
    initScrollTop();
    setupRouterReinit();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    setTimeout(run, 50);
  }
}

export default initScrollTop;
