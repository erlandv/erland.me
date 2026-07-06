/**
 * Avatar Stories — public entry point
 *
 * Re-exports types, attaches click handlers to `[data-stories]` elements,
 * and wires up Astro view-transition listeners so the feature survives
 * client-side navigation.
 *
 * **Usage (automatic):**
 * Loaded lazily by `ui-init.ts` when `[data-stories]` is found in the DOM.
 *
 * **Usage (manual):**
 * ```typescript
 * import { initAvatarStories } from '@lib/features/stories';
 * initAvatarStories();
 * ```
 */

import { onRouteChange } from '@lib/infrastructure/router-events';
import { StoriesViewer } from './viewer';

// Re-export types for consumers that need them
export type { Story, Music, StoriesData } from './types';
export { loadStoriesData, clearStoriesCache } from './loader';
export { StoriesViewer } from './viewer';

// ─── Initializer ──────────────────────────────────────────────────────────────

interface ElementWithStoriesBound extends Element {
  _storiesBound?: boolean;
}

/**
 * Initialize avatar stories feature.
 *
 * Finds all `[data-stories]` elements and attaches click handlers.
 * Safe to call multiple times — uses a `_storiesBound` flag to prevent
 * duplicate event binding on the same element.
 *
 * @example
 * // In HTML: <img data-stories src="avatar.jpg" />
 * initAvatarStories();
 */
export function initAvatarStories(): void {
  const avatarImages = document.querySelectorAll('[data-stories]');

  avatarImages.forEach(avatar => {
    const elem = avatar as ElementWithStoriesBound;
    if (elem._storiesBound) return;
    elem._storiesBound = true;

    avatar.addEventListener('click', async (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      const viewer = new StoriesViewer();
      await viewer.open();
    });

    // Add visual indicator (cursor pointer)
    (avatar as HTMLElement).style.cursor = 'pointer';
  });
}

// ─── Router / View-Transition setup ───────────────────────────────────────────

let routerSetup = false;

function setupRouterReinit() {
  if (routerSetup) return;
  routerSetup = true;

  const run = () => initAvatarStories();

  document.addEventListener('astro:page-load', run);
  document.addEventListener('astro:after-swap', run);

  onRouteChange(run);
}

// ─── Auto-init ────────────────────────────────────────────────────────────────

/**
 * Auto-init when module is loaded.
 * Called by `ui-init.ts` gate system after DOM is ready.
 */
export function autoInit(): void {
  const run = () => initAvatarStories();

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        run();
        setupRouterReinit();
      },
      { once: true },
    );
  } else {
    setTimeout(() => {
      run();
      setupRouterReinit();
    }, 50);
  }
}

export default initAvatarStories;
