// Scroll-to-top button initializer that works with Astro ClientRouter
// Finds a button with id `scroll-top` and binds show/hide + smooth scroll

const SHOW_AT_PX = 200;

function updateVisibility(btn: HTMLElement) {
  try {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    btn.setAttribute('data-visible', y > SHOW_AT_PX ? 'true' : 'false');
  } catch {}
}

function bindButton(btn: HTMLElement) {
  if (btn.dataset.bound === 'true') return;
  btn.dataset.bound = 'true';

  const onScroll = () => updateVisibility(btn);
  const onClick = (ev: Event) => {
    try {
      ev.preventDefault();
      const preferSmooth = 'scrollBehavior' in document.documentElement.style;
      if (preferSmooth) window.scrollTo({ top: 0, behavior: 'smooth' });
      else window.scrollTo(0, 0);
    } catch {}
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  btn.addEventListener('click', onClick);
  // initial state
  onScroll();
}

export function initScrollTop() {
  const btn = document.getElementById('scroll-top');
  if (btn instanceof HTMLElement) bindButton(btn);
}

let routerSetup = false;
function setupRouterReinit() {
  if (routerSetup) return;
  routerSetup = true;

  const run = () => initScrollTop();

  document.addEventListener('astro:page-load', run);
  document.addEventListener('astro:after-swap', run);

  window.addEventListener('popstate', run);
  const _push = history.pushState?.bind(history);
  if (_push) {
    history.pushState = function (
      data: any,
      unused: string,
      url?: string | URL | null
    ) {
      const ret = _push(data, unused, url);
      setTimeout(run, 10);
      return ret;
    } as typeof history.pushState;
  }

  const observer = new MutationObserver(() => {
    // debounce minimal
    setTimeout(run, 0);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export function autoInit() {
  const run = () => { initScrollTop(); setupRouterReinit(); };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    setTimeout(run, 50);
  }
}

export default initScrollTop;

