/**
 * Sidebar Controller
 *
 * Manages sidebar collapse/expand behavior, mobile menu state, active navigation
 * highlighting, and breakpoint transitions.
 *
 * **Features:**
 * - Persistent sidebar collapse state (localStorage)
 * - Mobile vs desktop breakpoint handling (1024px)
 * - Smooth collapse/expand animations
 * - Active nav link detection and highlighting
 * - Mobile menu drawer controls
 * - Focus trap for mobile menu accessibility
 * - Router event integration for view transitions
 * - Syncs with SidebarToggleButton component
 *
 * **State Persistence:**
 * - Sidebar collapsed state: localStorage key "sidebar-collapsed"
 * - Desktop: persists user preference
 * - Mobile: always expanded (breakpoint override)
 *
 * **Controlled Elements:**
 * - `.sidebar` element and CSS classes
 * - `document.documentElement` data-sidebar attribute
 * - `#sidebar-toggle` checkbox (desktop collapse)
 * - `#nav-toggle` checkbox (mobile menu)
 * - `.nav-link-container` active states
 *
 * **Usage:**
 * ```typescript
 * import { initSidebarController } from '@lib/features/sidebar/sidebar-controller';
 *
 * // Initialize on page load
 * initSidebarController();
 * ```
 *
 * **Testing:**
 * Injectable dependencies for storage and breakpoint detection enable unit testing:
 * ```typescript
 * const mockStorage: SidebarStorage = {
 *   getCollapsed: () => false,
 *   setCollapsed: () => {},
 * };
 *
 * initSidebarController(mockStorage);
 * ```
 */

import { onRouteChange } from '@lib/infrastructure/router-events';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'sidebar-collapsed';
const MOBILE_QUERY = '(max-width: 1024px)';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Storage abstraction for sidebar state persistence
 * Enables dependency injection for testing
 */
export interface SidebarStorage {
  /** Get the current collapsed state from storage */
  getCollapsed(): boolean;
  /** Set the collapsed state in storage */
  setCollapsed(value: boolean): void;
}

/**
 * Breakpoint detection abstraction
 * Enables dependency injection for testing
 */
export interface BreakpointDetector {
  /** Check if viewport is currently in mobile mode */
  isMobile(): boolean;
  /** Register a listener for breakpoint changes, returns cleanup function */
  onChange(handler: () => void): () => void;
}

// ============================================================================
// Default Implementations
// ============================================================================

/**
 * Default localStorage implementation for sidebar state
 * Falls back gracefully if localStorage is unavailable
 */
export const defaultStorage: SidebarStorage = {
  getCollapsed(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  },

  setCollapsed(value: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
    } catch {
      // Silently fail if storage unavailable
    }
  },
};

/**
 * Default breakpoint detector using matchMedia API
 * Falls back to desktop mode if matchMedia unavailable
 */
export const defaultBreakpoint: BreakpointDetector = {
  isMobile(): boolean {
    try {
      return !!(window.matchMedia && window.matchMedia(MOBILE_QUERY).matches);
    } catch {
      return false;
    }
  },

  onChange(handler: () => void): () => void {
    try {
      const mq = window.matchMedia(MOBILE_QUERY);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } catch {
      return () => {
        // No-op cleanup if matchMedia unavailable
      };
    }
  },
};

// ============================================================================
// Global State Tracking
// ============================================================================

/**
 * Tracks whether router events have been bound
 * Prevents duplicate event listener registration
 */
declare global {
  interface Window {
    __sidebarControllerRouterBound?: boolean;
  }
}

// ============================================================================
// Core Controller Functions
// ============================================================================

/**
 * Apply sidebar state immediately without animation
 * Respects mobile breakpoint override (always expanded on mobile)
 *
 * @param collapsed - Target collapsed state
 * @param breakpoint - Breakpoint detector instance
 */
function applyStateImmediate(
  collapsed: boolean,
  breakpoint: BreakpointDetector,
): void {
  const sidebar = document.querySelector('.sidebar') as HTMLElement | null;
  if (!sidebar) return;

  let isCollapsed = collapsed;
  if (breakpoint.isMobile()) isCollapsed = false;

  document.documentElement.classList.toggle(
    'sidebar-collapsed-global',
    isCollapsed,
  );
  document.documentElement.setAttribute(
    'data-sidebar',
    isCollapsed ? 'collapsed' : 'expanded',
  );
  document.body.classList.toggle('sidebar-collapsed', isCollapsed);
  sidebar.classList.toggle('sidebar-collapsed', isCollapsed);
  sidebar.classList.remove('sidebar-animating', 'hiding-text');

  syncToggleActive();
}

/**
 * Apply sidebar state with smooth animation
 * Skips animation on mobile (always expanded)
 *
 * @param collapsed - Target collapsed state
 * @param breakpoint - Breakpoint detector instance
 */
function animateToState(
  collapsed: boolean,
  breakpoint: BreakpointDetector,
): void {
  const sidebar = document.querySelector('.sidebar') as HTMLElement | null;
  if (!sidebar) return applyStateImmediate(collapsed, breakpoint);
  if (breakpoint.isMobile()) return applyStateImmediate(false, breakpoint);

  sidebar.classList.add('sidebar-animating');

  if (collapsed) {
    // Collapse animation sequence
    sidebar.classList.add('hiding-text');
    setTimeout(() => {
      document.documentElement.classList.add('sidebar-collapsed-global');
      document.documentElement.setAttribute('data-sidebar', 'collapsed');
      document.body.classList.add('sidebar-collapsed');
      sidebar.classList.add('sidebar-collapsed');
      syncToggleActive();
    }, 120);
    setTimeout(() => {
      sidebar.classList.remove('sidebar-animating');
    }, 360);
  } else {
    // Expand animation sequence
    document.documentElement.classList.remove('sidebar-collapsed-global');
    document.documentElement.setAttribute('data-sidebar', 'expanded');
    document.body.classList.remove('sidebar-collapsed');
    sidebar.classList.remove('sidebar-collapsed');
    sidebar.classList.add('hiding-text');
    setTimeout(() => {
      sidebar.classList.remove('hiding-text');
    }, 180);
    setTimeout(() => {
      sidebar.classList.remove('sidebar-animating');
    }, 360);
    syncToggleActive();
  }
}

/**
 * Sync toggle button active state with sidebar collapsed state
 * Updates visual state of SidebarToggleButton component
 */
function syncToggleActive(): void {
  try {
    const toggleButtons = document.querySelectorAll<HTMLElement>(
      '.sidebar-toggle-button',
    );
    const sidebar = document.querySelector('.sidebar') as HTMLElement | null;
    if (!toggleButtons.length || !sidebar) return;

    const isCollapsedNow =
      document.documentElement.getAttribute('data-sidebar') === 'collapsed' ||
      sidebar.classList.contains('sidebar-collapsed');

    toggleButtons.forEach(btn =>
      btn.classList.toggle('is-active', isCollapsedNow),
    );
  } catch {
    // Silently fail if elements not found
  }
}

/**
 * Apply initial root flags before DOM is fully loaded
 * Prevents FOUC (Flash of Unstyled Content) on page load
 *
 * @param storage - Storage instance for retrieving saved state
 * @param breakpoint - Breakpoint detector instance
 */
function applyInitialRootFlags(
  storage: SidebarStorage,
  breakpoint: BreakpointDetector,
): void {
  try {
    const shouldCollapse = storage.getCollapsed() && !breakpoint.isMobile();
    document.documentElement.classList.toggle(
      'sidebar-collapsed-global',
      shouldCollapse,
    );
    document.documentElement.setAttribute(
      'data-sidebar',
      shouldCollapse ? 'collapsed' : 'expanded',
    );
  } catch {
    // Silently fail if document not ready
  }
}

/**
 * Handle viewport breakpoint changes (mobile ↔ desktop)
 * Auto-expands sidebar on mobile, restores saved state on desktop
 *
 * @param storage - Storage instance for retrieving saved state
 * @param breakpoint - Breakpoint detector instance
 */
function handleBreakpointChanges(
  storage: SidebarStorage,
  breakpoint: BreakpointDetector,
): void {
  try {
    const handler = () => {
      const sidebarToggle = document.getElementById(
        'sidebar-toggle',
      ) as HTMLInputElement | null;
      if (!sidebarToggle) return;

      if (breakpoint.isMobile()) {
        sidebarToggle.checked = false;
        applyStateImmediate(false, breakpoint);
      } else {
        const collapsed = storage.getCollapsed();
        sidebarToggle.checked = collapsed;
        applyStateImmediate(collapsed, breakpoint);
      }
      syncToggleActive();
    };

    // Apply once immediately
    handler();

    // Listen for breakpoint changes
    breakpoint.onChange(handler);
  } catch {
    // Silently fail if matchMedia unavailable
  }
}

/**
 * Update ARIA expanded attribute on mobile menu toggle button
 * Ensures accessibility for screen readers
 */
function updateMobileAriaExpanded(): void {
  try {
    const btn = document.querySelector(
      '.navbar-icon-button',
    ) as HTMLElement | null;
    const toggle = document.getElementById(
      'nav-toggle',
    ) as HTMLInputElement | null;
    if (!btn || !toggle) return;

    btn.setAttribute('aria-expanded', toggle.checked ? 'true' : 'false');
  } catch {
    // Silently fail if elements not found
  }
}

/**
 * Close mobile menu drawer
 * Called on navigation or escape key press
 */
function closeMobileMenu(): void {
  try {
    const toggle = document.getElementById(
      'nav-toggle',
    ) as HTMLInputElement | null;
    if (!toggle) return;

    if (toggle.checked) {
      toggle.checked = false;
      const btn = document.querySelector('.navbar-icon-button');
      if (btn instanceof HTMLElement) btn.blur();
      updateMobileAriaExpanded();
    }
  } catch {
    // Silently fail if elements not found
  }
}

/**
 * Normalize URL path with trailing slash
 * Ensures consistent path comparison for active nav detection
 *
 * @param p - URL path to normalize
 * @returns Normalized path with trailing slash
 */
function normalizePath(p: string): string {
  try {
    if (!p) return '/';
    return p.endsWith('/') ? p : `${p}/`;
  } catch {
    return '/';
  }
}

/**
 * Update active navigation link highlighting
 * Finds best matching nav link based on current URL path
 * Uses longest prefix match algorithm
 */
function updateActiveNav(): void {
  try {
    const links = document.querySelectorAll<HTMLAnchorElement>(
      '.sidebar .nav-link-container[href]',
    );
    if (!links || !links.length) return;

    const current = normalizePath(window.location.pathname);
    let best: HTMLAnchorElement | null = null;
    let bestLen = -1;

    links.forEach(link => {
      try {
        const hrefAttr = link.getAttribute('href') || '';
        const hrefPath = normalizePath(
          new URL(hrefAttr, window.location.origin).pathname,
        );

        // Exact match for homepage
        if (current === '/' && hrefPath === '/') {
          if (hrefPath.length > bestLen) {
            best = link;
            bestLen = hrefPath.length;
          }
        }
        // Prefix match for other pages (longest wins)
        else if (hrefPath !== '/' && current.startsWith(hrefPath)) {
          if (hrefPath.length > bestLen) {
            best = link;
            bestLen = hrefPath.length;
          }
        }
      } catch {
        // Skip invalid URLs
      }
    });

    // Remove all active states
    links.forEach(link => {
      link.classList.remove('is-current-page');
      link.removeAttribute('aria-current');
    });

    // Set best match as active
    const bestMatch = best as HTMLAnchorElement | null;
    if (bestMatch) {
      bestMatch.classList.add('is-current-page');
      bestMatch.setAttribute('aria-current', 'page');
    }
  } catch {
    // Silently fail if DOM query fails
  }
}

/**
 * Attach click handlers to navigation links
 * Closes mobile menu and updates active state on click
 */
function attachNavClickHandlers(): void {
  try {
    const links = document.querySelectorAll<HTMLAnchorElement>(
      '.sidebar .nav-link-container[href]',
    );
    if (!links || !links.length) return;

    links.forEach(link => {
      // Skip if already bound
      if (link.dataset.navActiveBound === 'true') return;
      link.dataset.navActiveBound = 'true';

      link.addEventListener(
        'click',
        (ev: MouseEvent) => {
          try {
            // Skip if default prevented or modifier keys pressed
            if (ev.defaultPrevented) return;
            if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;

            const hrefAttr = link.getAttribute('href') || '';
            const targetUrl = new URL(hrefAttr, window.location.origin);

            // Skip external links
            if (targetUrl.origin !== window.location.origin) return;

            closeMobileMenu();

            // Update active state immediately for better UX
            const all = document.querySelectorAll<HTMLAnchorElement>(
              '.sidebar .nav-link-container[href]',
            );
            all.forEach(a => {
              a.classList.remove('is-current-page');
              a.removeAttribute('aria-current');
            });
            link.classList.add('is-current-page');
            link.setAttribute('aria-current', 'page');

            // Re-sync after navigation completes
            setTimeout(updateActiveNav, 0);
          } catch {
            // Silently fail on click handler errors
          }
        },
        { passive: true },
      );
    });
  } catch {
    // Silently fail if DOM query fails
  }
}

/**
 * Refresh sidebar collapsed state from storage
 * Respects mobile breakpoint override
 *
 * @param storage - Storage instance for retrieving saved state
 * @param breakpoint - Breakpoint detector instance
 */
function refreshCollapsedState(
  storage: SidebarStorage,
  breakpoint: BreakpointDetector,
): void {
  try {
    const sidebarToggle = document.getElementById(
      'sidebar-toggle',
    ) as HTMLInputElement | null;

    let collapsed = storage.getCollapsed();
    if (breakpoint.isMobile()) collapsed = false;

    if (sidebarToggle) sidebarToggle.checked = collapsed;
    applyStateImmediate(collapsed, breakpoint);
    syncToggleActive();
  } catch {
    // Silently fail if elements not found
  }
}

/**
 * Bind router event listeners for view transitions
 * Re-applies sidebar state after Astro page swaps
 *
 * @param storage - Storage instance for retrieving saved state
 * @param breakpoint - Breakpoint detector instance
 */
function bindRouterEvents(
  storage: SidebarStorage,
  breakpoint: BreakpointDetector,
): void {
  try {
    if (window.__sidebarControllerRouterBound) return;
    window.__sidebarControllerRouterBound = true;

    const reapply = () => {
      refreshCollapsedState(storage, breakpoint);
    };

    document.addEventListener('astro:after-swap', reapply);
    document.addEventListener('astro:page-load', reapply);
    onRouteChange(reapply);
  } catch {
    // Silently fail if event binding fails
  }
}

/**
 * Main initialization function - runs once per page load
 * Safe to call multiple times (idempotent via dataset flag)
 *
 * @param storage - Storage instance (injectable for testing)
 * @param breakpoint - Breakpoint detector instance (injectable for testing)
 */
function bootOnce(
  storage: SidebarStorage,
  breakpoint: BreakpointDetector,
): void {
  const sidebar = document.querySelector('.sidebar') as HTMLElement | null;
  if (!sidebar) return;
  if (sidebar.dataset.controllerInitialized === 'true') return;
  sidebar.dataset.controllerInitialized = 'true';

  // Apply root flags ASAP to prevent FOUC
  applyInitialRootFlags(storage, breakpoint);

  // Re-enable transitions after initial state is applied
  // The inline <head> script sets --sidebar-init-transition: none to prevent
  // animated FOUC on soft reload. After JS controller initializes, we remove
  // the override so subsequent user interactions have smooth transitions.
  requestAnimationFrame(() => {
    try {
      document.documentElement.style.removeProperty(
        '--sidebar-init-transition',
      );
    } catch {
      // Silently fail if style manipulation fails
    }
  });

  // Initialize state and breakpoint handling
  const sidebarToggle = document.getElementById(
    'sidebar-toggle',
  ) as HTMLInputElement | null;

  if (sidebarToggle) {
    let collapsed = storage.getCollapsed();
    if (breakpoint.isMobile()) collapsed = false;

    sidebarToggle.checked = collapsed;
    applyStateImmediate(collapsed, breakpoint);

    sidebarToggle.addEventListener('change', (ev: Event) => {
      const input = ev.currentTarget as HTMLInputElement;

      if (breakpoint.isMobile()) {
        // Force expanded on mobile
        input.checked = false;
        applyStateImmediate(false, breakpoint);
        storage.setCollapsed(true); // Preserve desktop preference
        return;
      }

      animateToState(input.checked, breakpoint);
      storage.setCollapsed(input.checked);
      setTimeout(syncToggleActive, 200);
    });
  } else {
    applyStateImmediate(storage.getCollapsed(), breakpoint);
  }

  // Sync ARIA for mobile nav toggle + listen for changes
  const navToggle = document.getElementById(
    'nav-toggle',
  ) as HTMLInputElement | null;

  if (navToggle) {
    updateMobileAriaExpanded();
    navToggle.addEventListener('change', updateMobileAriaExpanded);

    // Focus trap when menu is open
    const siteNav = document.getElementById('site-nav') as HTMLElement | null;
    if (siteNav) {
      const trap = (ev: KeyboardEvent) => {
        if (ev.key !== 'Tab') return;
        if (!navToggle.checked) return;

        const focusables = siteNav.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (ev.shiftKey) {
          // Shift+Tab: wrap to last element
          if (active === first || !siteNav.contains(active)) {
            ev.preventDefault();
            last.focus();
          }
        } else {
          // Tab: wrap to first element
          if (active === last || !siteNav.contains(active)) {
            ev.preventDefault();
            first.focus();
          }
        }
      };

      // Attach trap listener permanently
      // The guard check (line 628: if (!navToggle.checked) return) ensures
      // the trap is only active when menu is open, so no cleanup needed
      document.addEventListener('keydown', trap);
    }
  }

  handleBreakpointChanges(storage, breakpoint);

  // Initialize navigation handling
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      closeMobileMenu();
      updateActiveNav();
      attachNavClickHandlers();
    });
  } else {
    closeMobileMenu();
    updateActiveNav();
    attachNavClickHandlers();
  }

  // Refresh nav state on route changes
  const refreshNavState = () => {
    try {
      queueMicrotask(() => {
        closeMobileMenu();
        updateActiveNav();
      });
    } catch {
      setTimeout(() => {
        closeMobileMenu();
        updateActiveNav();
      }, 0);
    }
  };

  onRouteChange(refreshNavState);
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Initialize sidebar controller with dependency injection support
 *
 * @param storage - Optional storage implementation (defaults to localStorage)
 * @param breakpoint - Optional breakpoint detector (defaults to matchMedia)
 *
 * @example
 * // Default initialization
 * initSidebarController();
 *
 * @example
 * // Testing with mocks
 * const mockStorage: SidebarStorage = {
 *   getCollapsed: () => false,
 *   setCollapsed: () => {},
 * };
 * initSidebarController(mockStorage);
 */
export function initSidebarController(
  storage: SidebarStorage = defaultStorage,
  breakpoint: BreakpointDetector = defaultBreakpoint,
): void {
  bootOnce(storage, breakpoint);
  bindRouterEvents(storage, breakpoint);
}

/**
 * Auto-initialization helper
 * Safe to call in SSR context (no-op if window undefined)
 */
export function autoInit(): void {
  if (typeof window === 'undefined') return;
  initSidebarController();
}
