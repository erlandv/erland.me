// Router-safe Share Buttons initializer with event delegation
// - Works across Astro client router navigations and swaps
// - Handles native Web Share and copy-to-clipboard

import { copyToClipboard } from './clipboard';
import { showToast } from './toast';
import { onRouteChange } from './router-events';

type Scope = Document | Element | ParentNode;

function canUseWebShare(): boolean {
  return typeof navigator !== 'undefined' && !!(navigator as any).share;
}

function updateNativeVisibility(scope: Scope = document) {
  const showNative = canUseWebShare();
  const list = (
    scope instanceof Document ? scope : (scope as Element)
  ).querySelectorAll?.('.share__native');
  if (!list) return;
  list.forEach(el => {
    (el as HTMLElement).hidden = !showNative;
  });
}

async function handleCopy(btn: Element) {
  const root = (btn.closest('section.share') || document.body) as HTMLElement;
  const url = (btn.getAttribute('data-copy') ||
    root.getAttribute('data-url') ||
    location.href) as string;
  let ok = false;
  try {
    const w = window as any;
    if (w && typeof w.copyToClipboard === 'function') {
      ok = !!(await w.copyToClipboard(url));
    } else {
      ok = await copyToClipboard(url);
    }
  } catch {
    ok = false;
  }

  if (ok) {
    showToast('Link copied.', { duration: 2000, type: 'success' });
  }
}

async function handleNativeShare(btn: Element) {
  if (!canUseWebShare()) return;
  const root = (btn.closest('section.share') || document.body) as HTMLElement;
  const title = root.getAttribute('data-title') || document.title;
  const text = root.getAttribute('data-text') || title || '';
  const url = root.getAttribute('data-url') || location.href;
  try {
    await (navigator as any).share({ title, text, url });
  } catch {
    // ignore dismiss/denied
  }
}

let delegationSetup = false;
function setupDelegation() {
  if (delegationSetup) return;
  delegationSetup = true;

  document.addEventListener('click', ev => {
    const target = ev.target as Element | null;
    if (!target) return;
    const copyBtn = target.closest?.('.share__btn--copy');
    if (copyBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      void handleCopy(copyBtn);
      return;
    }
    const nativeBtn = target.closest?.('.share__btn--native');
    if (nativeBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      void handleNativeShare(nativeBtn);
      return;
    }
  });
}

let routerSetup = false;
function setupRouterReinit() {
  if (routerSetup) return;
  routerSetup = true;

  const run = () => updateNativeVisibility(document);

  document.addEventListener('astro:page-load', run);
  document.addEventListener('astro:after-swap', run);

  onRouteChange(run);

  // Observe DOM changes for new share sections
  const observer = new MutationObserver(() => {
    // debounce a touch
    setTimeout(run, 0);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export function initShareButtons(scope?: Scope) {
  updateNativeVisibility(scope || document);
  setupDelegation();
}

export function autoInit() {
  const run = () => initShareButtons(document);
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
    setTimeout(() => {
      run();
      setupRouterReinit();
    }, 50);
  }
}

export default initShareButtons;
