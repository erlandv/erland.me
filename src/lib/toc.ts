/**
 * Dynamic Table of Contents (TOC) Generator
 *
 * Automatically scans `.prose` content for H2/H3 headings and generates a
 * collapsible, interactive table of contents with smooth scroll navigation.
 *
 * **Features:**
 * - Auto-generates unique IDs for headings without existing IDs
 * - Hierarchical structure (H2 with nested H3 sublists)
 * - Toggleable expand/collapse with keyboard support
 * - Smooth scroll to heading on click
 * - URL hash updates for shareable links
 * - Only shows on article routes (blog posts & downloads)
 * - XSS-safe: HTML-escapes all heading text
 * - Router-safe: Re-initializes on Astro view transitions
 *
 * **HTML Structure:**
 * ```html
 * <div class="toc" data-expanded="false">
 *   <div class="toc__header" role="button" tabindex="0">
 *     <strong class="toc__title">Table of Contents</strong>
 *     <button class="toc__toggle" aria-expanded="false">▼</button>
 *   </div>
 *   <ul class="toc__list">
 *     <li class="toc__item toc__item--h2">
 *       <a class="toc__anchor" href="#heading-id">Heading Text</a>
 *       <ul class="toc__sublist">
 *         <li class="toc__item toc__item--h3">
 *           <a class="toc__anchor" href="#subheading-id">Subheading</a>
 *         </li>
 *       </ul>
 *     </li>
 *   </ul>
 * </div>
 * ```
 *
 * **Usage:**
 * Automatically initialized via `ui-init.ts` on article pages.
 * Manual initialization:
 * ```typescript
 * import { initToc } from './toc';
 * initToc(); // Runs only on article routes
 * ```
 */

import { qs, escapeHtml } from './dom-builder';
import { onRouteChange } from './router-events';
import arrowUpRaw from '@/icons/arrow-up.svg?raw';
import arrowDownRaw from '@/icons/arrow-down.svg?raw';

/**
 * Heading metadata for TOC generation
 * @property el - The heading DOM element
 * @property level - Heading level (2 for H2, 3 for H3)
 * @property text - Heading text content (trimmed)
 * @property id - Unique ID attribute for anchor linking
 */
type HeadingInfo = {
  el: HTMLElement;
  level: 2 | 3;
  text: string;
  id: string;
};

/**
 * Convert text to URL-safe slug
 * Strips special characters, converts to lowercase, and replaces spaces with hyphens
 * @param text - Raw heading text to slugify
 * @returns URL-safe slug string
 * @example
 * slugify('Hello World!') // 'hello-world'
 * slugify('API Reference 2.0') // 'api-reference-20'
 */
function slugify(text: string): string {
  try {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  } catch {
    return '';
  }
}

/**
 * Ensure ID is unique within container by appending numeric suffix if needed
 * Prevents ID collisions when multiple headings have similar text
 * @param base - Base ID string (pre-slugified)
 * @param container - Container element to check for existing IDs
 * @returns Unique ID string (may have numeric suffix)
 * @example
 * ensureUniqueId('intro', prose) // 'intro' if available
 * ensureUniqueId('intro', prose) // 'intro-1' if 'intro' exists
 */
function ensureUniqueId(base: string, container: HTMLElement): string {
  let id = base || 'section';
  let i = 1;
  while (container.querySelector(`#${CSS.escape(id)}`)) {
    id = `${base}-${i++}`;
  }
  return id;
}

/**
 * Collect all H2 and H3 headings from prose container
 * Auto-generates unique IDs for headings without existing IDs
 * @param prose - Prose container element to scan
 * @returns Array of heading metadata with levels, text, and IDs
 */
function collectHeadings(prose: HTMLElement): HeadingInfo[] {
  const els = Array.from(prose.querySelectorAll('h2, h3')) as HTMLElement[];
  const out: HeadingInfo[] = [];
  for (const el of els) {
    const level = el.tagName.toLowerCase() === 'h2' ? 2 : 3;
    const text = (el.textContent || '').trim();
    let id = (el.getAttribute('id') || '').trim();
    if (!id) {
      const base = slugify(text);
      id = ensureUniqueId(base, prose);
      try {
        el.setAttribute('id', id);
      } catch {}
    }
    if (text) out.push({ el, level: level as 2 | 3, text, id });
  }
  return out;
}

/**
 * Check if current route is an article page (blog post or download)
 * TOC only shows on individual article pages, not listing/archive pages
 * @returns True if on blog/download article route
 */
function isArticleRoute(): boolean {
  try {
    const p = window.location?.pathname || '';
    return (
      (p.startsWith('/blog/') && !p.startsWith('/blog/page/')) ||
      (p.startsWith('/download/') && !p.startsWith('/download/page/'))
    );
  } catch {
    return false;
  }
}

/**
 * Create TOC header template with title and toggle button
 * @param arrowDownIcon - SVG icon HTML for collapsed state
 * @returns HTML string for TOC header structure
 */
function createTocHeaderTemplate(arrowDownIcon: string): string {
  return `
    <div class="toc__header" role="button" tabindex="0">
      <strong class="toc__title">Table of Contents</strong>
      <button 
        type="button" 
        class="toc__toggle" 
        aria-expanded="false" 
        aria-label="Show table of contents"
      >
        ${arrowDownIcon}
      </button>
    </div>
  `;
}

/**
 * Create TOC list item HTML with proper escaping
 * Heading text is HTML-escaped to prevent XSS and DOM corruption
 * from headings containing special characters (<, >, &, etc.)
 * @param heading - Heading metadata with level, text, and ID
 * @returns HTML string for TOC list item
 */
function createTocItemHtml(heading: HeadingInfo): string {
  return `
    <li class="toc__item toc__item--h${heading.level}">
      <a class="toc__anchor" href="#${heading.id}">${escapeHtml(heading.text)}</a>
    </li>
  `;
}

/**
 * Build complete TOC DOM element with interactive behaviors
 *
 * Creates hierarchical list structure with:
 * - H2 as top-level items
 * - H3 nested under parent H2
 * - Toggle expand/collapse functionality
 * - Keyboard navigation support
 * - Smooth scroll to headings
 * - URL hash updates
 *
 * @param headings - Array of heading metadata
 * @returns TOC container element or null if no headings
 * @throws Error if template generation fails (should never happen)
 */
function buildTocElement(headings: HeadingInfo[]): HTMLElement | null {
  if (!headings.length) return null;

  const container = document.createElement('div');
  container.className = 'toc';
  container.setAttribute('data-expanded', 'false');

  // Use template for header
  const arrowDownIcon = normalizeSvg(arrowDownRaw, 'toc__toggle-icon');
  container.innerHTML = createTocHeaderTemplate(arrowDownIcon);

  // Get references to header elements with explicit error handling
  const header = qs<HTMLDivElement>(container, '.toc__header');
  const toggle = qs<HTMLButtonElement>(container, '.toc__toggle');

  // Ensure required elements exist (should never fail with our template)
  if (!header || !toggle) {
    throw new Error('Failed to create TOC: missing required header elements');
  }

  // Build list dynamically (structure depends on heading nesting)
  const list = document.createElement('ul');
  list.className = 'toc__list';

  let currentH2Li: HTMLLIElement | null = null;
  let currentSubUl: HTMLUListElement | null = null;

  for (const h of headings) {
    if (h.level === 2) {
      // Create H2 item from template
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = createTocItemHtml(h);
      const li = tempDiv.firstElementChild as HTMLLIElement;
      list.appendChild(li);
      currentH2Li = li;
      currentSubUl = null;
    } else {
      // H3
      if (!currentH2Li) {
        // No preceding H2, append as top-level fallback
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = createTocItemHtml(h);
        const li = tempDiv.firstElementChild as HTMLLIElement;
        list.appendChild(li);
        continue;
      }
      if (!currentSubUl) {
        currentSubUl = document.createElement('ul');
        currentSubUl.className = 'toc__sublist';
        currentH2Li.appendChild(currentSubUl);
      }
      // Create H3 item from template
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = createTocItemHtml(h);
      const subLi = tempDiv.firstElementChild as HTMLLIElement;
      currentSubUl.appendChild(subLi);
    }
  }

  // Append list to container (header already in innerHTML)
  container.appendChild(list);

  // Toggle behavior
  const setExpanded = (next: boolean) => {
    container.setAttribute('data-expanded', String(next));
    toggle.setAttribute('aria-expanded', String(next));
    toggle.setAttribute(
      'aria-label',
      next ? 'Hide table of contents' : 'Show table of contents'
    );
    toggle.innerHTML = next
      ? normalizeSvg(arrowUpRaw, 'toc__toggle-icon')
      : normalizeSvg(arrowDownRaw, 'toc__toggle-icon');
  };

  const getExpanded = () => container.getAttribute('data-expanded') === 'true';

  // Click on header toggles
  header.addEventListener('click', () => {
    const next = !getExpanded();
    setExpanded(next);
  });

  // Keyboard support on header
  header.addEventListener('keydown', ev => {
    const key = (ev as KeyboardEvent).key;
    if (key === 'Enter' || key === ' ') {
      ev.preventDefault();
      const next = !getExpanded();
      setExpanded(next);
    }
  });

  // Button toggles too; stop bubbling to header to avoid double toggle
  toggle.addEventListener('click', ev => {
    ev.stopPropagation();
    const next = !getExpanded();
    setExpanded(next);
  });

  // Smooth scroll for TOC anchors
  container.addEventListener('click', ev => {
    const target = ev.target as HTMLElement | null;
    if (!target) return;
    const anchor = target.closest('a.toc__anchor') as HTMLAnchorElement | null;
    if (!anchor) return;
    const id = anchor.getAttribute('href')?.slice(1);
    if (!id) return;
    const heading = document.getElementById(id);
    if (!heading) return;
    ev.preventDefault();
    try {
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, '', `#${id}`);
    } catch {
      location.hash = `#${id}`;
    }
  });

  return container;
}

/**
 * Find ideal insertion point for TOC (before first paragraph)
 * @param prose - Prose container element
 * @returns First paragraph element or first child node
 */
function findInsertPoint(prose: HTMLElement): ChildNode | null {
  const firstPara = prose.querySelector('p');
  return firstPara || prose.firstChild;
}

/**
 * Initialize table of contents for current page
 *
 * Guards:
 * - Only runs on article routes (blog/download posts)
 * - Requires `.prose` container element
 * - Prevents duplicate initialization
 *
 * Process:
 * 1. Collect H2/H3 headings from `.prose`
 * 2. Build interactive TOC element
 * 3. Insert before first paragraph
 * 4. Mark as initialized
 *
 * Safe to call multiple times - idempotent via initialization flag.
 *
 * @example
 * // Manual initialization
 * initToc();
 *
 * // Auto-initialization on route change
 * document.addEventListener('astro:page-load', initToc);
 */
export function initToc() {
  // Guard: only initialize on article routes (blog & download)
  if (!isArticleRoute()) return;
  const prose = document.querySelector('.prose');
  if (!(prose instanceof HTMLElement)) return;
  if (prose.dataset.tocInitialized === 'true') return;

  const headings = collectHeadings(prose).filter(
    h => h.level === 2 || h.level === 3
  );
  const tocEl = buildTocElement(headings);
  if (!tocEl) return;

  const insertBefore = findInsertPoint(prose);
  try {
    if (insertBefore) prose.insertBefore(tocEl, insertBefore);
    else prose.prepend(tocEl);
    prose.dataset.tocInitialized = 'true';
  } catch {}
}

/**
 * Setup router event listeners for TOC re-initialization
 * Ensures TOC regenerates on Astro view transitions and navigation
 * Only sets up once via module-level flag
 */
let routerSetup = false;
function setupRouterReinit() {
  if (routerSetup) return;
  routerSetup = true;
  const run = () => {
    if (isArticleRoute()) initToc();
  };
  document.addEventListener('astro:page-load', run);
  document.addEventListener('astro:after-swap', run);
  onRouteChange(run);
}

/**
 * Auto-initialization entry point
 * Sets up TOC with router listeners for automatic regeneration
 * Typically called by ui-init.ts on app startup
 */
export function autoInit() {
  const run = () => {
    if (!isArticleRoute()) return;
    initToc();
    setupRouterReinit();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    setTimeout(run, 50);
  }
}

export default initToc;

/**
 * Normalize SVG icon for inline use with currentColor
 *
 * Transformations:
 * - Removes XML declarations and comments
 * - Strips style tags
 * - Replaces fill/stroke colors with currentColor
 * - Removes width/height attributes
 * - Adds aria-hidden="true" for accessibility
 * - Adds custom class name
 *
 * @param svg - Raw SVG string from import
 * @param extraClass - Optional class name to add to SVG element
 * @returns Normalized SVG HTML string
 */
function normalizeSvg(svg: string, extraClass = ''): string {
  try {
    let s = svg
      .replace(/<\?xml[\s\S]*?\?>/g, '')
      .replace(/<!--([\s\S]*?)-->/g, '')
      .replace(/<style[\s\S]*?<\/style>/g, '')
      .replace(
        /fill\s*:\s*(?!none\b)(?!currentColor\b)(?!url\()[^;"']+/gi,
        'fill:currentColor'
      )
      .replace(
        /stroke\s*:\s*(?!none\b)(?!currentColor\b)(?!url\()[^;"']+/gi,
        'stroke:currentColor'
      )
      .replace(
        /fill\s*=\s*"(?!none\b)(?!currentColor\b)(?!url\()[^"]*"/gi,
        'fill="currentColor"'
      )
      .replace(
        /stroke\s*=\s*"(?!none\b)(?!currentColor\b)(?!url\()[^"]*"/gi,
        'stroke="currentColor"'
      );

    s = s.replace(/<svg(\s[^>]*)?>/i, match => {
      let tag = match
        .replace(/\s(width|height)\s*=\s*"[^"]*"/gi, '')
        .replace(/\sfill\s*=\s*"[^"]*"/i, '');
      const cls = extraClass ? ` ${extraClass}` : '';
      if (/class\s*=\s*"[^"]*"/i.test(tag)) {
        tag = tag.replace(
          /class\s*=\s*"([^"]*)"/i,
          (_m, c) => `class="${c}${cls}"`
        );
      } else {
        tag = tag.replace(/<svg/i, `<svg class="${extraClass}"`);
      }
      if (!/aria-hidden\s*=\s*"true"/i.test(tag)) {
        tag = tag.replace(/<svg/i, `<svg aria-hidden="true"`);
      }
      if (!/fill\s*=\s*"currentColor"/i.test(tag)) {
        tag = tag.replace(/<svg/i, `<svg fill="currentColor"`);
      }
      return tag;
    });
    return s;
  } catch {
    return svg;
  }
}
