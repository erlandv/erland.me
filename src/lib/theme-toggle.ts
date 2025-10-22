/**
 * theme-toggle.ts - Theme toggle UI controller
 * Manages theme selection flyout menu with proper cleanup and view transition support
 */

type ThemePreference = 'auto' | 'light' | 'dark';

interface ThemeControl {
  getPreference: () => ThemePreference;
  getResolved: () => 'light' | 'dark';
  setPreference: (pref: ThemePreference) => void;
  subscribe: (
    callback: (state: {
      preference: ThemePreference;
      resolved: 'light' | 'dark';
    }) => void
  ) => () => void;
}

declare global {
  interface Window {
    __themeControl?: ThemeControl;
    __themeToggleInit?: () => void;
  }
}

const stateLabels: Record<ThemePreference, string> = {
  auto: 'Auto',
  light: 'Light',
  dark: 'Dark',
};

const MOBILE_MEDIA_QUERY = '(max-width: 1024px)';

// Persistent state across re-initializations
let wrapperElement: HTMLElement | null = null;
let wrapperParent: HTMLElement | null = null;
let wrapperNextSibling: Element | null = null;
let mediaQueryList: MediaQueryList | null = null;
let mediaListenerAttached = false;

// Per-initialization state (reset on cleanup)
let isOpen = false;
let abortController: AbortController | null = null;
let unsubscribe: (() => void) | null = null;
let resizeTimeout: number | null = null;

// Pre-cached icon elements (populated once)
const iconCache = new Map<ThemePreference, SVGElement>();

/**
 * Ensure wrapper element reference is valid and connected
 */
const ensureWrapperElement = (): boolean => {
  // If element exists and is still in the DOM, we're good
  if (wrapperElement?.isConnected) {
    return true;
  }

  // Element not connected - need to find it in new DOM (after view transition)
  const found = document.querySelector<HTMLElement>('.theme-toggle');
  if (!found) {
    return false;
  }

  wrapperElement = found;

  // Always update parent references when re-finding element
  // (DOM may have changed due to view transitions)
  wrapperParent = found.parentElement;
  wrapperNextSibling = found.nextElementSibling;

  if (!wrapperElement.dataset.placement) {
    wrapperElement.dataset.placement = 'floating';
  }

  return true;
};

/**
 * Restore wrapper to original floating position
 */
const restoreWrapperPlacement = (): void => {
  if (!ensureWrapperElement() || !wrapperParent || !wrapperElement) {
    return;
  }

  if (
    wrapperParent.contains(wrapperElement) &&
    wrapperElement.dataset.placement === 'floating'
  ) {
    return;
  }

  wrapperParent.insertBefore(wrapperElement, wrapperNextSibling);
  wrapperElement.dataset.placement = 'floating';
};

/**
 * Move wrapper into sidebar navigation (mobile)
 */
const placeWrapperInSidebar = (): boolean => {
  if (!ensureWrapperElement() || !wrapperElement) {
    return false;
  }

  const navContent = document.querySelector<HTMLElement>(
    '.sidebar .nav-content'
  );
  if (!navContent) {
    restoreWrapperPlacement();
    return false;
  }

  const menuToggle = navContent.querySelector('.navbar-icon-button');
  if (menuToggle) {
    if (menuToggle.previousElementSibling !== wrapperElement) {
      navContent.insertBefore(wrapperElement, menuToggle);
    }
  } else if (!navContent.contains(wrapperElement)) {
    navContent.appendChild(wrapperElement);
  }

  wrapperElement.dataset.placement = 'sidebar';
  return true;
};

/**
 * Update wrapper placement based on viewport size
 */
const updateWrapperPlacement = (): void => {
  if (!ensureWrapperElement()) {
    return;
  }

  if (!mediaQueryList) {
    mediaQueryList = window.matchMedia(MOBILE_MEDIA_QUERY);
  }

  if (mediaQueryList.matches) {
    const placed = placeWrapperInSidebar();
    if (!placed) {
      restoreWrapperPlacement();
    }
  } else {
    restoreWrapperPlacement();
  }
};

/**
 * Attach media query listener (once)
 */
const attachMediaListener = (): void => {
  if (mediaListenerAttached) {
    return;
  }

  if (!mediaQueryList) {
    mediaQueryList = window.matchMedia(MOBILE_MEDIA_QUERY);
  }

  const handler = () => updateWrapperPlacement();

  if (typeof mediaQueryList.addEventListener === 'function') {
    mediaQueryList.addEventListener('change', handler);
  } else if (typeof mediaQueryList.addListener === 'function') {
    // Fallback for older browsers
    mediaQueryList.addListener(handler);
  }

  mediaListenerAttached = true;
};

/**
 * Pre-cache icon SVG elements for fast updates
 */
const cacheIcons = (): void => {
  if (iconCache.size > 0) {
    return; // Already cached
  }

  const options = document.querySelectorAll<HTMLElement>('[data-theme-option]');
  options.forEach(option => {
    const theme = option.getAttribute('data-theme-option') as ThemePreference;
    const svg = option.querySelector<SVGElement>('svg');
    if (theme && svg) {
      iconCache.set(theme, svg.cloneNode(true) as SVGElement);
    }
  });
};

/**
 * Update trigger icon efficiently using cached elements
 */
const updateTriggerIcon = (
  preference: ThemePreference,
  trigger: HTMLElement
): void => {
  const triggerIconContainer = trigger.querySelector(
    '.theme-toggle__trigger-icon'
  );
  if (!triggerIconContainer) {
    return;
  }

  const cachedIcon = iconCache.get(preference);
  if (cachedIcon) {
    // Clear and replace with cached icon
    triggerIconContainer.innerHTML = '';
    triggerIconContainer.appendChild(cachedIcon.cloneNode(true));
  }

  // Update aria-label and title
  trigger.setAttribute('aria-label', `Theme: ${stateLabels[preference]}`);
  trigger.setAttribute('title', `Theme: ${stateLabels[preference]}`);
};

/**
 * Update active state on option buttons
 */
const updateOptionsState = (
  preference: ThemePreference,
  options: NodeListOf<HTMLElement>
): void => {
  options.forEach(option => {
    const optionTheme = option.getAttribute('data-theme-option');
    const isActive = optionTheme === preference;
    option.setAttribute('data-active', String(isActive));
    option.setAttribute('aria-checked', String(isActive));
  });
};

/**
 * Position flyout relative to trigger
 */
const positionFlyout = (trigger: HTMLElement, flyout: HTMLElement): void => {
  const rect = trigger.getBoundingClientRect();
  const viewportWidth = window.innerWidth;

  // Mobile: dropdown below trigger, aligned right
  if (viewportWidth <= 1024) {
    flyout.style.top = `${rect.bottom + 8}px`;
    flyout.style.right = '8px';
    flyout.style.left = 'auto';
  }
  // Desktop: dropdown below trigger at top-right
  else {
    flyout.style.top = `${rect.bottom + 8}px`;
    flyout.style.right = '16px';
    flyout.style.left = 'auto';
  }
};

/**
 * Open flyout menu
 */
const openFlyout = (trigger: HTMLElement, flyout: HTMLElement): void => {
  isOpen = true;
  trigger.setAttribute('aria-expanded', 'true');
  flyout.hidden = false;
  flyout.removeAttribute('hidden');
  positionFlyout(trigger, flyout);

  // Focus first option
  const firstOption = flyout.querySelector<HTMLElement>('[data-theme-option]');
  if (firstOption) {
    firstOption.focus();
  }
};

/**
 * Close flyout menu
 */
const closeFlyout = (trigger: HTMLElement, flyout: HTMLElement): void => {
  isOpen = false;
  trigger.setAttribute('aria-expanded', 'false');
  flyout.hidden = true;
  trigger.focus();
};

/**
 * Toggle flyout open/closed
 */
const toggleFlyout = (trigger: HTMLElement, flyout: HTMLElement): void => {
  if (isOpen) {
    closeFlyout(trigger, flyout);
  } else {
    openFlyout(trigger, flyout);
  }
};

/**
 * Announce theme change to screen readers
 */
const announceThemeChange = (theme: ThemePreference): void => {
  const statusEl = document.getElementById('theme-status');
  if (statusEl) {
    statusEl.textContent = `Theme changed to ${stateLabels[theme]}`;
    setTimeout(() => {
      statusEl.textContent = '';
    }, 1000);
  }
};

/**
 * Wait for theme control to be available
 */
const waitForThemeControl = (): Promise<ThemeControl> => {
  return new Promise((resolve, reject) => {
    if (window.__themeControl) {
      resolve(window.__themeControl);
      return;
    }

    let attempts = 0;
    const maxAttempts = 20; // 1 second max
    const interval = setInterval(() => {
      attempts++;
      if (window.__themeControl) {
        clearInterval(interval);
        resolve(window.__themeControl);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        reject(new Error('Theme control not available'));
      }
    }, 50);
  });
};

/**
 * Cleanup function - called before re-initialization or navigation
 */
const cleanup = (): void => {
  // Abort all event listeners
  if (abortController) {
    abortController.abort();
    abortController = null;
  }

  // Clear resize timeout
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
    resizeTimeout = null;
  }

  // Unsubscribe from theme changes
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  // Reset state
  isOpen = false;

  // Note: Don't restore placement here - let re-init handle it
  // because after view transitions, DOM references are stale
};

/**
 * Initialize theme toggle UI
 * Can be called multiple times safely (view transitions)
 */
export const init = async (): Promise<void> => {
  // Always cleanup previous initialization
  cleanup();

  // ALWAYS reset wrapper element to force fresh query
  // This ensures we get the correct element from the new DOM
  wrapperElement = null;

  // Remove all duplicate theme toggle elements (keep only first one)
  const allToggles = document.querySelectorAll('.theme-toggle');

  if (allToggles.length > 1) {
    // Remove all except the first one
    allToggles.forEach((toggle, index) => {
      if (index > 0) {
        toggle.remove();
      }
    });
  }

  // Get DOM elements
  const trigger = document.querySelector<HTMLElement>('[data-theme-trigger]');
  const flyout = document.getElementById('theme-flyout');
  const options = document.querySelectorAll<HTMLElement>('[data-theme-option]');

  if (!trigger || !flyout || !options.length) {
    return;
  }

  // Update wrapper placement
  updateWrapperPlacement();
  attachMediaListener();

  // Wait for theme control to be available
  let control: ThemeControl;
  try {
    control = await waitForThemeControl();
  } catch (error) {
    console.error('[ThemeToggle] Theme control not available:', error);
    return;
  }

  // Pre-cache icons for fast updates
  cacheIcons();

  // Create new abort controller for this initialization
  abortController = new AbortController();
  const { signal } = abortController;

  // Update UI based on current theme
  const updateUI = ({
    preference,
  }: {
    preference: ThemePreference;
    resolved: 'light' | 'dark';
  }): void => {
    updateTriggerIcon(preference, trigger);
    updateOptionsState(preference, options);
  };

  // Subscribe to theme changes
  unsubscribe = control.subscribe(updateUI);

  // Initial UI update to sync with current theme
  updateUI({
    preference: control.getPreference(),
    resolved: control.getResolved(),
  });

  // Trigger click handler
  trigger.addEventListener(
    'click',
    event => {
      event.preventDefault();
      event.stopPropagation();
      toggleFlyout(trigger, flyout);
    },
    { signal }
  );

  // Option click handlers
  options.forEach(option => {
    option.addEventListener(
      'click',
      event => {
        event.preventDefault();
        const theme = option.getAttribute(
          'data-theme-option'
        ) as ThemePreference | null;

        if (
          theme &&
          (theme === 'auto' || theme === 'light' || theme === 'dark')
        ) {
          control.setPreference(theme);
          announceThemeChange(theme);
          closeFlyout(trigger, flyout);
        }
      },
      { signal }
    );
  });

  // Click outside to close
  document.addEventListener(
    'click',
    event => {
      const target = event.target as Node;
      if (isOpen && !trigger.contains(target) && !flyout.contains(target)) {
        closeFlyout(trigger, flyout);
      }
    },
    { signal }
  );

  // ESC key to close
  document.addEventListener(
    'keydown',
    event => {
      if (isOpen && event.key === 'Escape') {
        event.preventDefault();
        closeFlyout(trigger, flyout);
      }
    },
    { signal }
  );

  // Reposition on resize (debounced)
  window.addEventListener(
    'resize',
    () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = window.setTimeout(() => {
        if (isOpen) {
          positionFlyout(trigger, flyout);
        }
        resizeTimeout = null;
      }, 100);
    },
    { signal }
  );
};

/**
 * Auto-init function for lazy loading
 */
export const autoInit = (): void => {
  void init();
};
