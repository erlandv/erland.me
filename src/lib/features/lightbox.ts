/**
 * Lightweight Image Lightbox
 *
 * Provides click-to-zoom functionality for content images in blog posts and downloads.
 * Creates an overlay modal with smooth animations and keyboard controls.
 *
 * **Features:**
 * - Click image or fullscreen button to open overlay
 * - Zoom animation from source image position
 * - Displays image caption from figcaption or alt text
 * - Keyboard support (ESC to close)
 * - Multiple close methods (backdrop, close button, image click)
 * - Respects responsive images (uses currentSrc)
 * - Prevents body scroll when active
 * - Auto-reinitializes on navigation and DOM mutations
 *
 * **Target Selectors:**
 * - `.prose img` (blog/download content)
 * - `.content-image-grid img` (gallery images)
 * - Excludes `.hero-image` class
 *
 * **Usage:**
 * Typically auto-initialized via `ui-init.ts` gate system.
 * ```typescript
 * import { initImageLightbox } from './lightbox';
 *
 * // Manual initialization with custom containers
 * initImageLightbox({ containerSelectors: ['.my-content'] });
 * ```
 */

import closeIcon from '@/icons/btn-close.svg?raw';
import fullscreenIcon from '@/icons/btn-fullscreen.svg?raw';
import { onRouteChange } from '@lib/infrastructure/router-events';

/**
 * Initialization options for lightbox
 * @property containerSelectors - CSS selectors for containers that hold lightbox-enabled images
 */
type InitOptions = {
  containerSelectors?: string[];
};

/**
 * Extended HTMLImageElement with lightbox state tracking
 * @property _lightboxBound - Flag to prevent duplicate event binding
 * @property _lightboxBtn - Reference to associated fullscreen button element
 */
interface ImageWithLightbox extends HTMLImageElement {
  _lightboxBound?: boolean;
  _lightboxBtn?: HTMLButtonElement;
}

const DEFAULT_CONTAINERS = ['.prose', '.content-image-grid'];

/**
 * Create lightbox overlay template HTML
 */
function createOverlayTemplate(): string {
  return `
    <div class="image-lightbox__backdrop"></div>
    <figure class="image-lightbox__figure">
      <img class="image-lightbox__image" alt="" />
      <figcaption class="image-lightbox__caption"></figcaption>
      <button 
        class="image-lightbox__close" 
        type="button" 
        aria-label="Close"
      >
        ${closeIcon}
      </button>
    </figure>
  `;
}

/**
 * Cached DOM references for lightbox overlay elements
 * @property overlay - Main lightbox container with dialog role
 * @property backdrop - Semi-transparent background (closes on click)
 * @property img - Image element displaying the zoomed content
 * @property caption - Figcaption element for image description
 * @property closeBtn - Close button in top-right corner
 */
interface LightboxElements {
  overlay: HTMLDivElement;
  backdrop: HTMLDivElement;
  img: HTMLImageElement;
  caption: HTMLElement;
  closeBtn: HTMLButtonElement;
}

/**
 * Create lightbox overlay DOM structure
 * Builds the complete modal HTML and queries all interactive elements
 * @returns Object containing references to all lightbox DOM elements
 * @throws Error if template structure is malformed (missing required elements)
 */
function createOverlay(): LightboxElements {
  const overlay = document.createElement('div');
  overlay.className = 'image-lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  // Use template to create structure
  overlay.innerHTML = createOverlayTemplate();

  // Query and cache DOM references with explicit error handling
  const backdrop = overlay.querySelector<HTMLDivElement>(
    '.image-lightbox__backdrop'
  );
  const img = overlay.querySelector<HTMLImageElement>('.image-lightbox__image');
  const caption = overlay.querySelector<HTMLElement>(
    '.image-lightbox__caption'
  );
  const closeBtn = overlay.querySelector<HTMLButtonElement>(
    '.image-lightbox__close'
  );

  // Ensure all required elements exist (should never fail with our template)
  if (!backdrop || !img || !caption || !closeBtn) {
    throw new Error(
      'Failed to create lightbox overlay: missing required elements'
    );
  }

  return { overlay, backdrop, img, caption, closeBtn };
}

/**
 * Extract caption text for an image
 * Prioritizes explicit figcaption, falls back to alt text
 * @param el - Image element to get caption for
 * @returns Caption text or null if no caption available
 */
function getCaptionForImage(el: HTMLImageElement): string | null {
  // Prefer explicit figcaption if available
  const figure = el.closest('figure');
  const figcaption = figure?.querySelector('figcaption');
  if (figcaption && figcaption.textContent) {
    return figcaption.textContent;
  }
  // Fallback to alt text
  if (el.alt && el.alt.trim().length > 0) {
    return el.alt.trim();
  }
  return null;
}

/**
 * Prevent body scroll when lightbox is open
 * Adds CSS class to document element (global lock)
 */
function disableScroll() {
  document.documentElement.classList.add('image-lightbox--locked');
}

/**
 * Re-enable body scroll after lightbox closes
 * Removes CSS class from document element
 */
function enableScroll() {
  document.documentElement.classList.remove('image-lightbox--locked');
}

/**
 * Open lightbox overlay with specified image
 * Creates modal, sets up event handlers, disables scroll, and animates in
 * @param sourceImg - Source image element that was clicked
 * @example
 * img.addEventListener('click', () => openLightbox(img));
 */
function openLightbox(sourceImg: HTMLImageElement) {
  const { overlay, backdrop, img, caption, closeBtn } = createOverlay();

  // Set image source (prefer currentSrc for responsive images)
  const src = (sourceImg.currentSrc || sourceImg.src) as string;
  img.src = src;
  img.alt = sourceImg.alt || '';

  const text = getCaptionForImage(sourceImg);
  if (text) {
    caption.textContent = text;
    caption.style.display = '';
  } else {
    caption.style.display = 'none';
  }

  function close() {
    overlay.classList.remove('open');
    overlay.addEventListener(
      'transitionend',
      () => {
        overlay.remove();
        enableScroll();
        document.removeEventListener('keydown', onKeyDown);
      },
      { once: true }
    );
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  }

  // Event wiring
  backdrop.addEventListener('click', close);
  closeBtn.addEventListener('click', close);
  // Also allow closing by clicking the image itself
  img.addEventListener('click', close);
  overlay.addEventListener('click', e => {
    // Click outside figure closes
    if (e.target === overlay) close();
  });

  document.body.appendChild(overlay);
  // Force reflow then open for animation
  void overlay.offsetWidth;
  overlay.classList.add('open');
  disableScroll();
  document.addEventListener('keydown', onKeyDown);
}

/**
 * Query all images within specified containers
 * Filters out hero images and other excluded elements
 * @param containers - CSS selectors for parent containers
 * @returns Array of HTMLImageElement that should have lightbox enabled
 */
function selectTargetImages(containers: string[]): HTMLImageElement[] {
  const imgs: HTMLImageElement[] = [];
  for (const sel of containers) {
    const found = Array.from(
      document.querySelectorAll(`${sel} img`)
    ) as HTMLImageElement[];
    for (const img of found) {
      // Skip non-content images like hero
      // Note: Astro Image may place the 'hero-image' class on the <picture> wrapper;
      // ensure we skip when either the <img> or any ancestor has this class.
      if (img.classList.contains('hero-image') || img.closest('.hero-image')) {
        continue;
      }
      imgs.push(img);
    }
  }
  return imgs;
}

/**
 * Initialize lightbox on all qualifying images
 * Adds click handlers, fullscreen buttons, and CSS classes
 * Safe to call multiple times - tracks initialization state per image
 * @param opts - Configuration options (container selectors)
 * @example
 * // Use default containers (.prose, .content-image-grid)
 * initImageLightbox();
 *
 * // Custom containers
 * initImageLightbox({ containerSelectors: ['.gallery', '.photos'] });
 */
export function initImageLightbox(opts?: InitOptions) {
  const containers = opts?.containerSelectors?.length
    ? opts.containerSelectors
    : DEFAULT_CONTAINERS;
  const images = selectTargetImages(containers);

  images.forEach(img => {
    // Mark as ready and add handler once
    const imgWithLightbox = img as ImageWithLightbox;
    imgWithLightbox.classList.add('lightbox-ready');
    if (imgWithLightbox._lightboxBound) return;
    imgWithLightbox._lightboxBound = true;
    imgWithLightbox.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openLightbox(imgWithLightbox);
    });

    // Add open icon button top-right of image when lightbox is inactive
    const container = (imgWithLightbox.closest('figure') ||
      imgWithLightbox.parentElement) as HTMLElement | null;
    if (container) {
      container.classList.add('lightbox-anchor');
      if (!imgWithLightbox._lightboxBtn) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'image-lightbox__open';
        btn.setAttribute('aria-label', 'Open image');
        btn.innerHTML = fullscreenIcon;
        btn.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation();
          openLightbox(imgWithLightbox);
        });
        container.appendChild(btn);
        imgWithLightbox._lightboxBtn = btn;
      }
    }
  });
}

// Auto-init when imported on the client
let routerSetup = false;
function setupRouterReinit() {
  if (routerSetup) return;
  routerSetup = true;

  const run = () => initImageLightbox();

  // Astro transitions events (if ClientRouter is used)
  document.addEventListener('astro:page-load', run);
  document.addEventListener('astro:after-swap', run);

  onRouteChange(run);

  // Observe DOM changes to catch newly injected content
  const debounced = (() => {
    let t: number | null = null;
    return () => {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(() => {
        run();
        t = null;
      }, 25);
    };
  })();

  const observer = new MutationObserver(debounced);
  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Auto-initialization entry point
 * Sets up lightbox with router and DOM mutation observers for automatic reinit
 * Called by ui-init.ts gate system when lightbox-eligible images are detected
 */
export function autoInit() {
  const run = () => initImageLightbox();
  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        run();
        setupRouterReinit();
      },
      { once: true }
    );
  } else {
    // Delay slightly to allow Astro content to hydrate
    setTimeout(() => {
      run();
      setupRouterReinit();
    }, 50);
  }
}

export default initImageLightbox;
