import '@/styles/toast.css';

// Lightweight toast notification utility
// Creates a container and shows ephemeral messages matching site theme.

export type ToastOptions = {
  duration?: number; // ms
  type?: 'info' | 'success' | 'error';
};

let container: HTMLElement | null = null;

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

export function initToasts(): void {
  ensureContainer();
}

export default showToast;
