/**
 * Google AdSense Ad Unit Management
 *
 * Handles dynamic insertion of AdSense ad units and dev placeholders.
 * Supports different ad placements for blog and download pages with
 * intelligent positioning based on content structure.
 *
 * **Features:**
 * - Dynamic ad unit insertion with duplicate prevention
 * - Strategic mid-content and end-content placement
 * - Development placeholders for layout testing
 * - Re-entrancy guards for Astro view transitions
 * - Environment-aware rendering (prod only)
 *
 * **Usage:**
 * ```typescript
 * // Blog page
 * if (shouldRenderAds({ client, slots: [slotMid, slotEnd] })) {
 *   autoInitBlogAds(client, slotMid, slotEnd);
 * } else {
 *   autoInitBlogPlaceholders();
 * }
 *
 * // Download page
 * if (shouldRenderAds({ client, slots: [slotMid, slotEnd] })) {
 *   autoInitDownloadAds(client, slotMid, slotEnd);
 * } else {
 *   autoInitDownloadPlaceholders();
 * }
 * ```
 */

import { createLogger } from './logger';
import { isProdSite } from './env';

const log = createLogger('AdSense');

// Type definitions for Google AdSense
interface WindowWithAds extends Window {
  adsbygoogle?: Array<Record<string, unknown>>;
  __ads_dl_end?: Set<string>;
  __ph_dl_end?: boolean;
}

/**
 * Insert AdSense ad unit into container element
 * Creates responsive ad with auto format and prevents duplicate insertions
 * @param container - Parent element to append ad unit
 * @param client - AdSense client ID (ca-pub-XXXXXXXXXX)
 * @param slot - AdSense slot ID
 */
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
    const w = window as WindowWithAds;
    w.adsbygoogle = w.adsbygoogle || [];
    w.adsbygoogle.push({});
  } catch (e) {
    log.warn('insertAdUnit failed', { error: e, slot });
  }
}

/**
 * Insert placeholder element for development/testing
 * Shows where ad would appear in production without AdSense code
 * @param container - Parent element to append placeholder
 * @param label - Optional custom label text (default: 'Ad Placeholder')
 */
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

/**
 * Insert ad unit after middle content element
 * Analyzes content structure to find strategic mid-point placement
 * Considers paragraphs, headings, lists, code blocks, figures, and galleries
 * @param container - Container with content elements
 * @param client - AdSense client ID
 * @param slot - AdSense slot ID
 */
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
    if (target.parentNode) {
      target.parentNode.insertBefore(ins, target.nextSibling);
    }
    const w = window as WindowWithAds;
    w.adsbygoogle = w.adsbygoogle || [];
    w.adsbygoogle.push({});
  } catch (e) {
    log.warn('insertAdAfterMiddle failed', { error: e, slot });
  }
}

/**
 * Insert placeholder after middle content element (dev mode)
 * Mirrors insertAdAfterMiddle positioning logic for layout testing
 * @param container - Container with content elements
 * @param label - Optional custom label text
 */
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
      if (target.parentNode) {
        target.parentNode.insertBefore(box, target.nextSibling);
      }
    }
  } catch (e) {
    log.warn('insertPlaceholderAfterMiddle failed', { error: e });
  }
}

/**
 * Auto-initialize AdSense ads for blog post pages
 * Inserts mid-content and end-content ads in #blog-content container
 * @param client - AdSense client ID
 * @param slotMid - Optional slot ID for mid-content ad
 * @param slotEnd - Optional slot ID for end-content ad
 */
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

/**
 * Auto-initialize ad placeholders for blog post pages (dev mode)
 * Shows where ads would appear without loading AdSense
 */
export function autoInitBlogPlaceholders() {
  const prose = document.getElementById('blog-content');
  if (!prose) return;
  insertPlaceholderAfterMiddle(prose, 'Ad Placeholder (mid)');
  insertPlaceholderUnit(prose, 'Ad Placeholder (end)');
}

/**
 * Auto-initialize AdSense ads for download pages
 * Complex placement logic with re-entrancy guards for view transitions:
 * - Mid-content: After middle content element
 * - End-content: Before share section or after files section
 * @param client - AdSense client ID
 * @param slotMid - Optional slot ID for mid-content ad
 * @param slotEnd - Optional slot ID for end-content ad
 */
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
  const w = window as WindowWithAds;
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
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
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
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
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
      const w = window as WindowWithAds;
      w.__ads_dl_end?.add(key);
    }
  }
}

/**
 * Auto-initialize ad placeholders for download pages (dev mode)
 * Mirrors autoInitDownloadAds placement logic with re-entrancy guards
 */
export function autoInitDownloadPlaceholders() {
  const container = document.getElementById('download-content');
  if (!container) return;
  insertPlaceholderAfterMiddle(container, 'Ad Placeholder (mid)');
  try {
    const w = window as WindowWithAds;
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

const hasSlotConfigured = (slots?: AdsSlots): boolean =>
  Array.isArray(slots) &&
  slots.some(slot => typeof slot === 'string' && slot.trim().length > 0);

interface AdsRenderConfig {
  client?: string | null;
  slots?: AdsSlots;
}

/**
 * Check if ads should be rendered based on environment and configuration
 * Validates client ID, production environment, and slot configuration
 * @param config - Configuration with client ID and slot IDs
 * @returns True if ads should render (production site with valid config)
 * @example
 * if (shouldRenderAds({ client, slots: [slotMid, slotEnd] })) {
 *   autoInitBlogAds(client, slotMid, slotEnd);
 * }
 */
export function shouldRenderAds(config: AdsRenderConfig = {}): boolean {
  const client = (config.client ?? '').trim();
  if (!client) return false;
  // Use same logic as Header.astro: PROD environment + production site
  if (!import.meta.env.PROD || !isProdSite()) return false;
  if (config.slots && !hasSlotConfigured(config.slots)) {
    return false;
  }
  return true;
}
