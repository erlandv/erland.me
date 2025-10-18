// Lightweight Image Lightbox for markdown-rendered images
// Targets images inside blog and download detail content containers
// - Adds zoom-in cursor to images
// - Opens overlay with zoom animation
// - Close button and a floating open button (SVG loaded via ?raw)

import closeIcon from '@/icons/close.svg?raw';
import fullscreenIcon from '@/icons/fullscreen.svg?raw';
import { onRouteChange } from './router-events';

type InitOptions = {
  containerSelectors?: string[];
};

const DEFAULT_CONTAINERS = ['.prose', '.content-image-grid'];

function createOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'image-lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const backdrop = document.createElement('div');
  backdrop.className = 'image-lightbox__backdrop';
  overlay.appendChild(backdrop);

  const figure = document.createElement('figure');
  figure.className = 'image-lightbox__figure';

  const img = document.createElement('img');
  img.className = 'image-lightbox__image';
  img.alt = '';

  const caption = document.createElement('figcaption');
  caption.className = 'image-lightbox__caption';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'image-lightbox__close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = closeIcon;

  figure.appendChild(img);
  figure.appendChild(caption);
  figure.appendChild(closeBtn);
  overlay.appendChild(figure);

  return { overlay, backdrop, img, caption, closeBtn };
}

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

function disableScroll() {
  document.documentElement.classList.add('image-lightbox--locked');
}

function enableScroll() {
  document.documentElement.classList.remove('image-lightbox--locked');
}

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
      if (img.classList.contains('hero-image') || img.closest('.hero-image'))
        continue;
      imgs.push(img);
    }
  }
  return imgs;
}

export function initImageLightbox(opts?: InitOptions) {
  const containers = opts?.containerSelectors?.length
    ? opts.containerSelectors
    : DEFAULT_CONTAINERS;
  const images = selectTargetImages(containers);

  images.forEach(img => {
    // Mark as ready and add handler once
    img.classList.add('lightbox-ready');
    if ((img as any)._lightboxBound) return;
    (img as any)._lightboxBound = true;
    img.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openLightbox(img);
    });

    // Add open icon button top-right of image when lightbox is inactive
    const container = (img.closest('figure') ||
      img.parentElement) as HTMLElement | null;
    if (container) {
      container.classList.add('lightbox-anchor');
      if (!(img as any)._lightboxBtn) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'image-lightbox__open';
        btn.setAttribute('aria-label', 'Open image');
        btn.innerHTML = fullscreenIcon;
        btn.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation();
          openLightbox(img);
        });
        container.appendChild(btn);
        (img as any)._lightboxBtn = btn;
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
