/**
 * Lightweight Toast Notification Utility
 *
 * Creates ephemeral notification messages that auto-dismiss after a duration.
 * Matches the site's theme automatically and provides different visual types.
 *
 * **Features:**
 * - Auto-dismiss with configurable duration
 * - Three visual types: info, success, error
 * - Smooth fade + translate animations
 * - Single container for all toasts (DOM-efficient)
 * - Automatic cleanup when container is empty
 * - ARIA live region for screen reader announcements
 *
 * **Usage:**
 * ```typescript
 * import { showToast } from '@lib/features/toast';
 *
 * // Simple success message
 * showToast('Copied to clipboard!');
 *
 * // Error with custom duration
 * showToast('Network error', { type: 'error', duration: 3000 });
 * ```
 */

import '@/styles/features/toast.css';

/**
 * Configuration options for toast notifications
 * @property duration - Display duration in milliseconds (default: 2000, clamped to 1500-2500ms)
 * @property type - Visual style and semantic meaning (default: 'success')
 */
export type ToastOptions = {
  duration?: number; // ms
  type?: 'info' | 'success' | 'error';
};

let container: HTMLElement | null = null;

/**
 * Get or create the global toast container
 * Container is a singleton attached to document.body with ARIA live region attributes
 * @returns Toast container element (creates new one if missing from DOM)
 */
function ensureContainer(): HTMLElement {
  if (container && document.body.contains(container)) return container;
  const el = document.createElement('div');
  el.className = 'toast-container';
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('role', 'status');
  document.body.appendChild(el);
  container = el;
  return el;
}

/**
 * Show a toast notification message
 * Automatically creates container, animates in, waits for duration, then animates out and cleans up
 * @param message - Text content to display
 * @param options - Display configuration (duration, type)
 * @example
 * // Success notification (default)
 * showToast('Settings saved!');
 *
 * // Error with longer duration
 * showToast('Failed to load data', { type: 'error', duration: 3000 });
 *
 * // Info message
 * showToast('Processing...', { type: 'info' });
 */
export function showToast(message: string, options: ToastOptions = {}): void {
  const { duration = 2000, type = 'success' } = options;
  const wrap = ensureContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;

  // Enter animation: slight translate + fade
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(8px)';

  wrap.appendChild(toast);

  // Force layout then animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // Schedule hide and remove
  window.setTimeout(
    () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      const removeDelay = 220; // match CSS transition duration
      window.setTimeout(() => {
        if (toast.parentNode === wrap) wrap.removeChild(toast);
        // If empty, remove container to keep DOM clean
        if (wrap.childElementCount === 0) {
          wrap.remove();
          if (container === wrap) container = null;
        }
      }, removeDelay);
    },
    Math.max(1500, Math.min(2500, duration))
  );
}

/**
 * Initialize toast system (optional preload)
 * Creates the container element early to avoid layout shift on first toast
 * Generally not required - showToast() will create container on demand
 */
export function initToasts(): void {
  ensureContainer();
}

export default showToast;
