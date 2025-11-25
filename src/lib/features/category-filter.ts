/**
 * Blog Category Filtering & Pagination
 *
 * Client-side category filtering using hash-based routing for blog posts.
 * Manages category visibility, pagination, and random initial category selection.
 *
 * **URL Pattern:**
 * - `#cat-{category}-page-{pageNumber}` (e.g., `#cat-web-development-page-2`)
 * - No hash: Randomly selects a category and redirects to page 1
 *
 * **Features:**
 * - Hash-based routing (no page reload on category change)
 * - Pagination within categories
 * - Random initial category if no hash provided
 * - Active filter button highlighting
 * - Browser back/forward support (popstate)
 * - Safe multi-call: prevents duplicate event listeners
 *
 * **HTML Structure:**
 * ```html
 * <div id="category-filter">
 *   <button class="cat-filter-btn" data-cat="web-development">Web Dev</button>
 * </div>
 *
 * <div data-cat-page data-cat="web-development" data-page="1">
 *   <!-- Category posts page 1 -->
 * </div>
 * <div data-cat-page data-cat="web-development" data-page="2">
 *   <!-- Category posts page 2 -->
 * </div>
 * ```
 *
 * **Usage:**
 * Typically auto-initialized via `ui-init.ts` gate system.
 * ```typescript
 * import { init } from './category-filter';
 *
 * // Initialize category filtering
 * init();
 * ```
 */

interface ParsedHash {
  cat: string;
  page: number;
}

// Global state to prevent duplicate listeners
let hashChangeListenerSetup = false;
let documentClickListenerSetup = false;

/**
 * Parse URL hash to extract category and page number
 * @returns Object with category slug and 1-indexed page number, or null if invalid
 * @example
 * // URL: https://example.com/blog/category/#cat-web-development-page-2
 * parseHash() // { cat: 'web-development', page: 2 }
 */
function parseHash(): ParsedHash | null {
  const hash = location.hash || '';
  const match = hash.match(/^#cat-([^#]+?)(?:-page-(\d+))?$/);
  return match
    ? {
        cat: match[1],
        page: Math.max(1, parseInt(match[2] || '1', 10) || 1),
      }
    : null;
}

/**
 * Show specific category page and update active filter button
 * Hides all other category pages and highlights matching filter button
 * @param category - Category slug to display
 * @param page - Page number to show (1-indexed)
 */
function showCategoryPage(category: string, page: number): void {
  // Hide all category pages
  document.querySelectorAll('[data-cat-page]').forEach(function (el) {
    if (el instanceof HTMLElement) {
      el.style.display = 'none';
    }
  });

  // Show target page
  const target = document.querySelector(
    `[data-cat-page][data-cat="${category}"][data-page="${page}"]`,
  );
  if (target instanceof HTMLElement) {
    target.style.display = '';
  }

  // Update active filter button
  document
    .querySelectorAll('#category-filter .cat-filter-btn')
    .forEach(function (btn) {
      if (btn instanceof HTMLElement) {
        const btnCat = btn.getAttribute('data-cat');
        if (btnCat === category) {
          btn.classList.add('is-active');
        } else {
          btn.classList.remove('is-active');
        }
      }
    });
}

/**
 * Initialize category filtering system
 * Parses hash or selects random category, shows appropriate page, sets up filter button handlers
 * Safe to call multiple times - prevents duplicate event listeners
 * @example
 * // Initialize after page load
 * initCategoryFilter();
 */
export function initCategoryFilter(): void {
  let parsed = parseHash();

  // If no hash, pick random category
  if (!parsed) {
    const allCats = Array.from(
      new Set(
        Array.from(document.querySelectorAll('[data-cat-page]'))
          .map(function (el) {
            return el.getAttribute('data-cat');
          })
          .filter(Boolean) as string[],
      ),
    );
    if (allCats.length > 0) {
      const randomCat = allCats[Math.floor(Math.random() * allCats.length)];
      location.replace(`#cat-${randomCat}-page-1`);
      parsed = { cat: randomCat, page: 1 };
    }
  }

  if (parsed) {
    showCategoryPage(parsed.cat, parsed.page);
  }

  // Attach click handlers to filter buttons with duplicate prevention
  document
    .querySelectorAll('#category-filter .cat-filter-btn')
    .forEach(function (btn) {
      const elem = btn as Element & { _categoryFilterBound?: boolean };
      if (elem._categoryFilterBound) return;
      elem._categoryFilterBound = true;

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const cat = btn.getAttribute('data-cat');
        if (cat) {
          const hash = `#cat-${cat}-page-1`;
          location.hash = hash;
          // Always call showCategoryPage to ensure UI updates
          showCategoryPage(cat, 1);
        }
      });
    });
}

/**
 * Setup document-level click listener for pagination links
 * Intercepts clicks on `#cat-*` hash links and updates UI immediately
 * Only runs once - safe to call multiple times
 */
function setupDocumentClickListener(): void {
  if (documentClickListenerSetup) return;
  documentClickListenerSetup = true;

  document.addEventListener('click', function (e) {
    const target = e.target;
    if (target) {
      let link: HTMLAnchorElement | null = null;
      if (target instanceof HTMLAnchorElement) {
        link = target;
      } else if (
        target instanceof Element &&
        typeof target.closest === 'function'
      ) {
        link = target.closest('a');
      }

      if (link) {
        const href = link.getAttribute('href') || '';
        if (href.startsWith('#cat-')) {
          const match = href.match(/^#cat-([^#]+?)(?:-page-(\d+))?$/);
          if (match) {
            e.preventDefault();
            const cat = match[1];
            const page = Math.max(1, parseInt(match[2] || '1', 10) || 1);
            location.hash = href;
            // Always call showCategoryPage to ensure UI updates immediately
            showCategoryPage(cat, page);
          }
        }
      }
    }
  });
}

/**
 * Setup hash change and popstate listeners for browser navigation
 * Handles hash changes from browser back/forward buttons
 * Only runs once - safe to call multiple times
 */
function setupHashChangeListener(): void {
  if (hashChangeListenerSetup) return;
  hashChangeListenerSetup = true;

  window.addEventListener('hashchange', function () {
    const parsed = parseHash();
    if (parsed) {
      showCategoryPage(parsed.cat, parsed.page);
    }
  });

  // Also listen for popstate events (browser back/forward)
  window.addEventListener('popstate', function () {
    // Small delay to ensure hash is updated
    setTimeout(() => {
      const parsed = parseHash();
      if (parsed) {
        showCategoryPage(parsed.cat, parsed.page);
      }
    }, 10);
  });
}

/**
 * Auto-initialization entry point
 * Initializes filtering and sets up one-time event listeners
 * Called by ui-init.ts gate system when category filter is detected
 */
export const autoInit = (): void => {
  initCategoryFilter();
  setupDocumentClickListener();
  setupHashChangeListener();
};

/**
 * Initialize category filtering system - main entry point
 * Handles DOM ready state and sets up view transition listeners
 * @example
 * import { init } from './category-filter';
 *
 * // Initialize on page load
 * init();
 */
export const init = (): void => {
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  // Set up view transition listeners only once
  if (!hashChangeListenerSetup || !documentClickListenerSetup) {
    document.addEventListener('astro:page-load', autoInit);
    document.addEventListener('astro:after-swap', autoInit);
  }
};
