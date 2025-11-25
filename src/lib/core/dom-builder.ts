/**
 * Type-safe DOM Builder Utilities
 * Provides helpers for creating DOM elements with better DX than vanilla createElement
 * - Type-safe element creation
 * - Template literal support for HTML-like syntax
 * - Simplified property/attribute setting
 */

/**
 * Create a DOM element with type-safe properties
 * @example
 * const btn = el('button', {
 *   className: 'my-btn',
 *   type: 'button',
 *   ariaLabel: 'Click me',
 *   innerHTML: '<span>Click</span>'
 * });
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Partial<
    HTMLElementTagNameMap[K] & {
      className?: string;
      innerHTML?: string;
      ariaLabel?: string;
      ariaModal?: string;
      role?: string;
    }
  >,
  children?: (Node | string)[],
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (key === 'textContent') {
        element.textContent = String(value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        const event = key.slice(2).toLowerCase();
        element.addEventListener(event, value as EventListener);
      } else {
        (element as Record<string, unknown>)[key] = value;
      }
    }
  }

  if (children) {
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
  }

  return element;
}

/**
 * Parse HTML string into DOM elements
 * Useful for creating complex structures with template literals
 * @example
 * const modal = html`
 *   <div class="modal">
 *     <div class="modal__content">
 *       <h2>Title</h2>
 *       <p>Content</p>
 *     </div>
 *   </div>
 * `;
 */
export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): DocumentFragment {
  // Combine template strings and values
  const htmlString = strings.reduce((result, str, i) => {
    const value = values[i] !== undefined ? String(values[i]) : '';
    return result + str + value;
  }, '');

  // Create a template element and parse HTML
  const template = document.createElement('template');
  template.innerHTML = htmlString.trim();

  return template.content;
}

/**
 * Query selector helper with type safety
 * @example
 * const button = qs<HTMLButtonElement>(container, '.my-button');
 * if (button) button.disabled = true;
 */
export function qs<T extends Element = Element>(
  parent: Element | Document,
  selector: string,
): T | null {
  return parent.querySelector<T>(selector);
}

/**
 * Query selector all helper with type safety
 * @example
 * const buttons = qsa<HTMLButtonElement>(container, 'button');
 * buttons.forEach(btn => btn.disabled = true);
 */
export function qsa<T extends Element = Element>(
  parent: Element | Document,
  selector: string,
): T[] {
  return Array.from(parent.querySelectorAll<T>(selector));
}

/**
 * Set multiple attributes at once
 * @example
 * setAttrs(element, {
 *   'data-id': '123',
 *   'aria-label': 'Description',
 *   'role': 'button'
 * });
 */
export function setAttrs(
  element: Element,
  attrs: Record<string, string | number | boolean>,
): void {
  Object.entries(attrs).forEach(([key, value]) => {
    element.setAttribute(key, String(value));
  });
}

/**
 * Add multiple event listeners at once
 * @example
 * onEvents(button, {
 *   click: handleClick,
 *   mouseenter: handleHover,
 *   mouseleave: handleHover
 * });
 */
export function onEvents<K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  events: Partial<
    Record<K, (this: HTMLElement, ev: HTMLElementEventMap[K]) => void>
  >,
): void {
  Object.entries(events).forEach(([event, handler]) => {
    element.addEventListener(event, handler as EventListener);
  });
}

/**
 * Escape HTML special characters to prevent XSS and DOM corruption
 * Safely converts text content to HTML-safe string
 *
 * BROWSER ONLY: Uses DOM APIs (document.createElement)
 * For Node.js/build-time usage, use escapeHtml from html-utils.ts instead
 *
 * @example
 * escapeHtml('1 < 2 && 3 > 1') // '1 &lt; 2 &amp;&amp; 3 &gt; 1'
 * escapeHtml('AT&T') // 'AT&amp;T'
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
