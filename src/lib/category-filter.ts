/**
 * category-filter.ts - Blog category filtering and pagination
 * Manages client-side category filtering with hash-based routing and pagination
 */

interface ParsedHash {
  cat: string;
  page: number;
}

/**
 * Parse hash to get category and page number
 */
function parseHash(): ParsedHash | null {
  const match = (location.hash || '').match(/^#cat-([^#]+?)(?:-page-(\d+))?$/);
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
 * Initialize category filtering
 */
function initCategoryFilter(): void {
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

  // Attach click handlers to filter buttons
  document
    .querySelectorAll('#category-filter .cat-filter-btn')
    .forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const cat = btn.getAttribute('data-cat');
        if (cat) {
          const hash = `#cat-${cat}-page-1`;
          if (location.hash !== hash) {
            location.hash = hash;
          }
          showCategoryPage(cat, 1);
        }
      });
    });
}

/**
 * Handle pagination link clicks
 */
function handlePaginationClicks(): void {
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
            if (location.hash !== href) {
              location.hash = href;
            }
            showCategoryPage(cat, page);
          }
        }
      }
    }
  });
}

/**
 * Handle hash changes
 */
function handleHashChanges(): void {
  window.addEventListener('hashchange', function () {
    const parsed = parseHash();
    if (parsed) {
      showCategoryPage(parsed.cat, parsed.page);
    }
  });
}

/**
 * Auto-init function for lazy loading
 */
export const autoInit = (): void => {
  initCategoryFilter();
  handlePaginationClicks();
  handleHashChanges();
};

/**
 * Initialize category filtering system
 */
export const init = (): void => {
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  // Re-initialize on Astro view transitions
  document.addEventListener('astro:page-load', autoInit);
  document.addEventListener('astro:after-swap', autoInit);
};
