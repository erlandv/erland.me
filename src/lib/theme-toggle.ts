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

// Per-initialization state (reset on cleanup)
let isOpen = false;
let abortController: AbortController | null = null;
let unsubscriptions: Array<() => void> = []; // Changed: Store multiple unsubscribe functions
let resizeTimeout: number | null = null;

// Pre-cached icon elements (populated once)
const iconCache = new Map<ThemePreference, SVGElement>();

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
 * Update trigger icon efficiently using cached elements with fade animation
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
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // No animation: instant swap
      triggerIconContainer.innerHTML = '';
      triggerIconContainer.appendChild(cachedIcon.cloneNode(true));
    } else {
      // Animated swap: fade out → swap → fade in
      const container = triggerIconContainer as HTMLElement;
      container.style.opacity = '0';
      container.style.transition = 'opacity 120ms ease-out';
      
      setTimeout(() => {
        triggerIconContainer.innerHTML = '';
        triggerIconContainer.appendChild(cachedIcon.cloneNode(true));
        
        // Trigger reflow to ensure transition applies
        void container.offsetHeight;
        
        container.style.opacity = '1';
        container.style.transition = 'opacity 150ms ease-in';
      }, 120);
    }
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
 * Close flyout menu with animation
 */
const closeFlyout = (trigger: HTMLElement, flyout: HTMLElement): void => {
  isOpen = false;
  trigger.setAttribute('aria-expanded', 'false');
  
  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    // No animation: instant close
    flyout.hidden = true;
    trigger.focus();
  } else {
    // Add closing animation class
    flyout.classList.add('theme-toggle__flyout--closing');
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
      flyout.hidden = true;
      flyout.classList.remove('theme-toggle__flyout--closing');
      trigger.focus();
    }, 200); // Match animation duration
  }
};

/**
 * Toggle flyout open/closed
 * Ensures only one flyout is open at a time
 */
const toggleFlyout = (trigger: HTMLElement, flyout: HTMLElement): void => {
  if (isOpen) {
    closeFlyout(trigger, flyout);
  } else {
    // Close all other open flyouts first
    const allFlyouts = document.querySelectorAll<HTMLElement>('#theme-flyout');
    allFlyouts.forEach(f => {
      if (f !== flyout && !f.hidden) {
        const otherTrigger = f
          .closest('.theme-toggle')
          ?.querySelector<HTMLElement>('[data-theme-trigger]');
        if (otherTrigger) {
          closeFlyout(otherTrigger, f);
        }
      }
    });

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
  unsubscriptions.forEach(unsub => unsub());
  unsubscriptions = [];

  // Reset state
  isOpen = false;

  // Note: Don't restore placement here - let re-init handle it
  // because after view transitions, DOM references are stale
};

/**
 * Initialize theme toggle UI
 * Can be called multiple times safely (view transitions)
 * Supports multiple theme toggle instances (desktop + mobile)
 */
export const init = async (): Promise<void> => {
  // Always cleanup previous initialization
  cleanup();

  // Get all theme toggle wrappers (we have 2: body-level and sidebar-level)
  const allToggles = document.querySelectorAll<HTMLElement>('.theme-toggle');

  if (allToggles.length === 0) {
    return;
  }

  // Wait for theme control to be available
  let control: ThemeControl;
  try {
    control = await waitForThemeControl();
  } catch (error) {
    console.error('[ThemeToggle] Theme control not available:', error);
    return;
  }

  // Pre-cache icons for fast updates (only once)
  cacheIcons();

  // Create new abort controller for this initialization
  abortController = new AbortController();
  const { signal } = abortController;

  // Initialize each theme toggle instance
  allToggles.forEach(wrapperElement => {
    const trigger = wrapperElement.querySelector<HTMLElement>(
      '[data-theme-trigger]'
    );
    const flyout = wrapperElement.querySelector<HTMLElement>('#theme-flyout');
    const options = wrapperElement.querySelectorAll<HTMLElement>(
      '[data-theme-option]'
    );

    if (!trigger || !flyout || !options.length) {
      return;
    }

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

    // Subscribe to theme changes (each instance gets its own subscription)
    const unsubscribe = control.subscribe(updateUI);
    unsubscriptions.push(unsubscribe);

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

    // Keyboard navigation
    flyout.addEventListener(
      'keydown',
      (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          closeFlyout(trigger, flyout);
          trigger.focus();
        }
      },
      { signal }
    );
  });
};

/**
 * Auto-init function for lazy loading
 */
export const autoInit = (): void => {
  void init();
};
