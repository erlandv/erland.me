// Router-safe initializer that injects copy buttons for code blocks
// Works across Astro ClientRouter navigations and DOM swaps

import { copyToClipboard } from './clipboard';
import { showToast } from './toast';
import { onRouteChange } from './router-events';
import '@/styles/features/code-copy.css';

function findCodeBlocks(): NodeListOf<HTMLElement> {
  let list = document.querySelectorAll(
    '.prose pre code'
  ) as NodeListOf<HTMLElement>;
  if (list.length === 0) {
    list = document.querySelectorAll('pre code') as NodeListOf<HTMLElement>;
  }
  if (list.length === 0) {
    list = document.querySelectorAll(
      'pre[class*="language-"] code'
    ) as NodeListOf<HTMLElement>;
  }
  return list;
}

function detectLanguage(pre: HTMLElement, code: HTMLElement): string {
  let language = 'text';
  const classes = `${pre.className} ${code.className}`
    .split(' ')
    .map(c => c.trim())
    .filter(Boolean);

  for (const className of classes) {
    if (className.startsWith('language-')) {
      language = className.replace('language-', '');
      break;
    }
  }
  if (language === 'text') {
    const preClasses = pre.className
      .split(' ')
      .map(c => c.trim())
      .filter(Boolean);
    for (const className of preClasses) {
      if (className.includes('language-') || /^[a-z]+$/.test(className)) {
        if (className.startsWith('language-')) {
          language = className.replace('language-', '');
        } else if (!['shiki', 'highlight', 'prose'].includes(className)) {
          language = className;
        }
        break;
      }
    }
  }
  const dataLang =
    pre.getAttribute('data-language') || pre.getAttribute('lang');
  if (language === 'text' && dataLang) {
    language = dataLang;
  }
  return language;
}

/**
 * Create copy button template HTML
 */
function createCopyButtonTemplate(): string {
  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M7.5 3H14.6C16.8402 3 17.9603 3 18.816 3.43597C19.5686 3.81947 20.1805 4.43139 20.564 5.18404C21 6.03969 21 7.15979 21 9.4V16.5M6.2 21H14.3C15.4201 21 15.9802 21 16.408 20.782C16.7843 20.5903 17.0903 20.2843 17.282 19.908C17.5 19.4802 17.5 18.9201 17.5 17.8V9.7C17.5 8.57989 17.5 8.01984 17.282 7.59202C17.0903 7.21569 16.7843 6.90973 16.408 6.71799C15.9802 6.5 15.4201 6.5 14.3 6.5H6.2C5.0799 6.5 4.51984 6.5 4.09202 6.71799C3.71569 6.90973 3.40973 7.21569 3.21799 7.59202C3 8.01984 3 8.57989 3 9.7V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.0799 21 6.2 21Z"/>
    </svg>
  `;
}

function createCopyButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'code-copy-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Copy code to clipboard');
  btn.innerHTML = createCopyButtonTemplate();
  return btn;
}

function ensureWrapper(pre: HTMLElement): HTMLElement | null {
  const parent = pre.parentElement;
  if (!parent) return null;

  if (parent.classList.contains('code-copy-wrapper')) {
    return parent as HTMLElement;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'code-copy-wrapper';
  parent.insertBefore(wrapper, pre);
  wrapper.appendChild(pre);
  return wrapper;
}

export function initCodeCopy() {
  const blocks = findCodeBlocks();
  blocks.forEach(codeEl => {
    const pre = codeEl.parentElement as HTMLElement | null;
    if (!pre) return;

    const wrapper = ensureWrapper(pre);
    if (!wrapper) return;
    if (wrapper.querySelector('.code-copy-btn')) return;

    const language = detectLanguage(pre, codeEl);
    pre.setAttribute('data-language', language);
    wrapper.setAttribute('data-language', language);

    const btn = createCopyButton();
    btn.addEventListener('click', async () => {
      try {
        const text = codeEl.textContent || '';
        await copyToClipboard(text);
        btn.classList.add('copied');
        showToast('Code copied.', { duration: 2000, type: 'success' });
      } catch {
        btn.classList.add('copied');
      } finally {
        window.setTimeout(() => btn.classList.remove('copied'), 2000);
      }
    });

    wrapper.appendChild(btn);
  });
}

let routerSetup = false;
function setupRouterReinit() {
  if (routerSetup) return;
  routerSetup = true;

  const run = () => initCodeCopy();

  document.addEventListener('astro:page-load', run);
  document.addEventListener('astro:after-swap', run);
  onRouteChange(run);

  const observer = new MutationObserver(() => {
    setTimeout(run, 0);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export function autoInit() {
  const run = () => initCodeCopy();
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

export default initCodeCopy;
