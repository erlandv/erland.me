/**
 * category-filter.ts - Blog category filtering and pagination
 * Manages client-side category filtering with hash-based routing and pagination
 */

interface ParsedHash {
  cat: string;
  page: number;
}

// Global state to prevent duplicate listeners
let hashChangeListenerSetup = false;
let documentClickListenerSetup = false;

/**
 * Parse hash to get category and page number
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
    `[data-cat-page][data-cat="${category}"][data-page="${page}"]`
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
 * Initialize category filtering - can be called multiple times safely
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
          .filter(Boolean) as string[]
      )
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
 * Handle pagination link clicks - sets up document-level listener only once
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
 * Handle hash changes - sets up window-level listener only once
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
 * Auto-init function for lazy loading - sets up one-time listeners
 */
export const autoInit = (): void => {
  initCategoryFilter();
  setupDocumentClickListener();
  setupHashChangeListener();
};

/**
 * Initialize category filtering system - entry point for external usage
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
