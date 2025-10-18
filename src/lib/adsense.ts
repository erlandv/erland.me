import { createLogger } from './logger';

const log = createLogger('AdSense');

export function insertAdUnit(container: Element, client: string, slot: string) {
  if (!container || !client || !slot) return;
  try {
    const existing = container.querySelector(
      `ins.adsbygoogle[data-ad-client="${client}"][data-ad-slot="${slot}"]`
    );
    if (existing) return;

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', client);
    ins.setAttribute('data-ad-slot', slot);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');

    container.appendChild(ins);
    // Initialize this unit
    (window as any).adsbygoogle = (window as any).adsbygoogle || [];
    (window as any).adsbygoogle.push({});
  } catch (e) {
    log.warn('insertAdUnit failed', { error: e, slot });
  }
}

export function insertPlaceholderUnit(container: Element, label?: string) {
  if (!container) return;
  // Prevent duplicate placeholder for end position
  const existing = container.querySelector(
    `.ad-placeholder[data-ad-pos="end"]`
  );
  if (existing) return;
  const box = document.createElement('div');
  box.className = 'ad-placeholder';
  box.setAttribute('data-ad-pos', 'end');
  box.textContent = label || 'Ad Placeholder';
  container.appendChild(box);
}

export function insertAdAfterMiddle(
  container: Element,
  client: string,
  slot: string
) {
  if (!container || !client || !slot) return;
  try {
    const candidates = Array.from(
      container.querySelectorAll(
        'p, h2, h3, ul, ol, pre, blockquote, figure, div.content-image-grid'
      )
    );
    const n = candidates.length;
    const index = n > 4 ? Math.floor(n / 2) : Math.max(n - 1, 0);
    const ref = candidates[index];
    if (!ref || !ref.parentNode) {
      insertAdUnit(container, client, slot);
      return;
    }

    // Prevent duplicate for same slot
    const dup = container.querySelector(
      `ins.adsbygoogle[data-ad-client="${client}"][data-ad-slot="${slot}"]`
    );
    if (dup) return;

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', client);
    ins.setAttribute('data-ad-slot', slot);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');

    const target =
      (ref.closest && (ref.closest('.content-image-grid') as Element)) ||
      (ref.closest && (ref.closest('figure') as Element)) ||
      ref;
    target.parentNode!.insertBefore(ins, target.nextSibling);
    (window as any).adsbygoogle = (window as any).adsbygoogle || [];
    (window as any).adsbygoogle.push({});
  } catch (e) {
    log.warn('insertAdAfterMiddle failed', { error: e, slot });
  }
}

export function insertPlaceholderAfterMiddle(
  container: Element,
  label?: string
) {
  if (!container) return;
  try {
    // Prevent duplicate placeholder for mid position
    const existing = container.querySelector(
      `.ad-placeholder[data-ad-pos="mid"]`
    );
    if (existing) return;
    const candidates = Array.from(
      container.querySelectorAll(
        'p, h2, h3, ul, ol, pre, blockquote, figure, div.content-image-grid'
      )
    );
    const n = candidates.length;
    const index = n > 4 ? Math.floor(n / 2) : Math.max(n - 1, 0);
    const ref = candidates[index];
    const box = document.createElement('div');
    box.className = 'ad-placeholder';
    box.setAttribute('data-ad-pos', 'mid');
    box.textContent = label || 'Ad Placeholder';
    if (!ref || !ref.parentNode) {
      container.appendChild(box);
    } else {
      const target =
        (ref.closest && (ref.closest('.content-image-grid') as Element)) ||
        (ref.closest && (ref.closest('figure') as Element)) ||
        ref;
      target.parentNode!.insertBefore(box, target.nextSibling);
    }
  } catch (e) {
    log.warn('insertPlaceholderAfterMiddle failed', { error: e });
  }
}

export function autoInitBlogAds(
  client: string,
  slotMid?: string,
  slotEnd?: string
) {
  const prose = document.getElementById('blog-content');
  if (!prose) return;
  if (slotMid) insertAdAfterMiddle(prose, client, slotMid);
  if (slotEnd) insertAdUnit(prose, client, slotEnd);
}

export function autoInitBlogPlaceholders() {
  const prose = document.getElementById('blog-content');
  if (!prose) return;
  insertPlaceholderAfterMiddle(prose, 'Ad Placeholder (mid)');
  insertPlaceholderUnit(prose, 'Ad Placeholder (end)');
}

export function autoInitDownloadAds(
  client: string,
  slotMid?: string,
  slotEnd?: string
) {
  const container = document.getElementById('download-content');
  if (!container) return;
  if (slotMid) insertAdAfterMiddle(container, client, slotMid);
  if (!slotEnd) return;

  // Re-entrancy guard to avoid race duplicates across multiple events
  const w = window as any;
  w.__ads_dl_end = w.__ads_dl_end || new Set<string>();
  const key = `${client}:${slotEnd}`;
  if (w.__ads_dl_end.has(key)) return;

  try {
    const existingGlobal = document.querySelector(
      `ins.adsbygoogle[data-ad-client="${client}"][data-ad-slot="${slotEnd}"]`
    );
    if (existingGlobal) {
      w.__ads_dl_end.add(key);
      return;
    }

    // Target: between files section and share -> insert before share if present
    const share = document.querySelector('section.share');
    if (share && share.parentNode) {
      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', client);
      ins.setAttribute('data-ad-slot', slotEnd);
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
      share.parentNode.insertBefore(ins, share);
      (w.adsbygoogle = w.adsbygoogle || []).push({});
      w.__ads_dl_end.add(key);
      return;
    }

    // Fallback: after files section if present
    const filesSection = document.getElementById('download-files-section');
    if (filesSection && filesSection.parentNode) {
      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', client);
      ins.setAttribute('data-ad-slot', slotEnd);
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
      filesSection.parentNode.insertBefore(ins, filesSection.nextSibling);
      (w.adsbygoogle = w.adsbygoogle || []).push({});
      w.__ads_dl_end.add(key);
      return;
    }

    // Final fallback: append inside content container
    insertAdUnit(container, client, slotEnd);
    w.__ads_dl_end.add(key);
  } catch (e) {
    log.warn('autoInitDownloadAds end placement failed', {
      error: e,
      slot: slotEnd,
    });
    const exists = document.querySelector(
      `ins.adsbygoogle[data-ad-client="${client}"][data-ad-slot="${slotEnd}"]`
    );
    if (!exists) {
      insertAdUnit(container, client, slotEnd);
      (window as any).__ads_dl_end.add(key);
    }
  }
}

export function autoInitDownloadPlaceholders() {
  const container = document.getElementById('download-content');
  if (!container) return;
  insertPlaceholderAfterMiddle(container, 'Ad Placeholder (mid)');
  try {
    const w = window as any;
    w.__ph_dl_end = w.__ph_dl_end || false;
    if (w.__ph_dl_end) return;

    const phExists = document.querySelector(
      '.ad-placeholder[data-ad-pos="end"]'
    );
    if (phExists) {
      w.__ph_dl_end = true;
      return;
    }

    const share = document.querySelector('section.share');
    if (share && share.parentNode) {
      const box = document.createElement('div');
      box.className = 'ad-placeholder';
      box.setAttribute('data-ad-pos', 'end');
      box.textContent = 'Ad Placeholder (end)';
      share.parentNode.insertBefore(box, share);
      w.__ph_dl_end = true;
      return;
    }

    const filesSection = document.getElementById('download-files-section');
    if (filesSection && filesSection.parentNode) {
      const box = document.createElement('div');
      box.className = 'ad-placeholder';
      box.setAttribute('data-ad-pos', 'end');
      box.textContent = 'Ad Placeholder (end)';
      filesSection.parentNode.insertBefore(box, filesSection.nextSibling);
      w.__ph_dl_end = true;
      return;
    }

    insertPlaceholderUnit(container, 'Ad Placeholder (end)');
    w.__ph_dl_end = true;
  } catch (e) {
    log.warn('autoInitDownloadPlaceholders end placement failed', { error: e });
    insertPlaceholderUnit(container, 'Ad Placeholder (end)');
  }
}

type AdsSlots = Array<string | null | undefined>;

function getProductionHosts(): string[] {
  const envHosts =
    ((import.meta as any).env?.PUBLIC_PRODUCTION_HOSTS as string | undefined) ||
    '';
  const parsed = envHosts
    .split(',')
    .map(h => h.trim().toLowerCase())
    .filter(Boolean);
  if (parsed.length > 0) return parsed;
  return ['erland.me', 'www.erland.me'];
}

function resolveRuntimeEnvironment(): 'production' | 'preview' {
  if (!(import.meta as any).env?.PROD) return 'preview';

  const siteEnv =
    ((import.meta as any).env?.PUBLIC_SITE_ENV as string | undefined) || '';
  if (siteEnv) {
    return siteEnv.toLowerCase() === 'production' ? 'production' : 'preview';
  }

  if (typeof window === 'undefined') return 'preview';
  const host = window.location.hostname?.toLowerCase() ?? '';
  if (!host) return 'preview';
  const allowed = getProductionHosts();
  return allowed.includes(host) ? 'production' : 'preview';
}

const hasSlotConfigured = (slots?: AdsSlots): boolean =>
  Array.isArray(slots) &&
  slots.some(slot => typeof slot === 'string' && slot.trim().length > 0);

interface AdsRenderConfig {
  client?: string | null;
  slots?: AdsSlots;
}

export function shouldRenderAds(config: AdsRenderConfig = {}): boolean {
  const client = (config.client ?? '').trim();
  if (!client) return false;
  if (resolveRuntimeEnvironment() !== 'production') return false;
  if (config.slots && !hasSlotConfigured(config.slots)) {
    return false;
  }
  return true;
}
