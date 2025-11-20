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

import { createLogger } from '@lib/core/logger';
import { isProdSite } from '@lib/core/env';

const log = createLogger('Ads');

// Type definitions for Google AdSense
interface WindowWithAds extends Window {
  adsbygoogle?: Array<Record<string, unknown>>;
  __ads_dl_end?: Set<string>;
  __ph_dl_end?: boolean;
}

/**
 * Insert AdSense ad unit into container element
 * Creates responsive ad with auto format and prevents duplicate insertions
 * Inserts before last content element (paragraph, heading, etc.) for better integration
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

    // Find last substantial content element to insert before it
    const candidates = Array.from(
      container.querySelectorAll(
        'p, h2, h3, ul, ol, pre, blockquote, figure, div.content-image-grid'
      )
    ).filter(el => !el.closest('.toc'));

    const lastElement = candidates[candidates.length - 1];

    if (lastElement && lastElement.parentNode) {
      // Insert before last content element
      lastElement.parentNode.insertBefore(ins, lastElement);
    } else {
      // Fallback: append to container if no suitable element found
      container.appendChild(ins);
    }

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
 * Inserts before last content element for better integration
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

  // Find last substantial content element to insert before it
  const candidates = Array.from(
    container.querySelectorAll(
      'p, h2, h3, ul, ol, pre, blockquote, figure, div.content-image-grid'
    )
  ).filter(el => !el.closest('.toc'));

  const lastElement = candidates[candidates.length - 1];

  if (lastElement && lastElement.parentNode) {
    // Insert before last content element
    lastElement.parentNode.insertBefore(box, lastElement);
  } else {
    // Fallback: append to container if no suitable element found
    container.appendChild(box);
  }
}

/**
 * Insert ad unit after first content element (START placement)
 * Places ad after the first substantial content element (paragraph, heading, list, code block, etc.)
 * Considers paragraphs, headings, lists, code blocks, figures, and galleries
 * @param container - Container with content elements
 * @param client - AdSense client ID
 * @param slot - AdSense slot ID
 */
export function insertAdAfterFirst(
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
    ).filter(el => {
      // Skip TOC elements - look for elements that are not part of TOC
      return !el.closest('.toc');
    });
    const ref = candidates[0]; // First content element (excluding TOC)
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
    log.warn('insertAdAfterFirst failed', { error: e, slot });
  }
}

/**
 * Insert placeholder after first content element (dev mode)
 * Mirrors insertAdAfterFirst positioning logic for layout testing
 * @param container - Container with content elements
 * @param label - Optional custom label text
 */
export function insertPlaceholderAfterFirst(
  container: Element,
  label?: string
) {
  if (!container) return;
  try {
    // Prevent duplicate placeholder for start position
    const existing = container.querySelector(
      `.ad-placeholder[data-ad-pos="start"]`
    );
    if (existing) return;

    const candidates = Array.from(
      container.querySelectorAll(
        'p, h2, h3, ul, ol, pre, blockquote, figure, div.content-image-grid'
      )
    ).filter(el => {
      // Skip TOC elements - look for elements that are not part of TOC
      return !el.closest('.toc');
    });

    const ref = candidates[0]; // First content element (excluding TOC)
    const box = document.createElement('div');
    box.className = 'ad-placeholder';
    box.setAttribute('data-ad-pos', 'start');
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
  } catch {
    // Silent fail - placeholder insertion is non-critical
  }
}

/**
 * Auto-initialize AdSense ads for content pages (blog and download)
 * Uses unified START and END slot placement logic
 * @param containerId - Container element ID ('blog-content' or 'download-content')
 * @param client - AdSense client ID
 * @param slotStart - Optional slot ID for start placement (after first content element)
 * @param slotEnd - Optional slot ID for end placement (before last content element)
 */
export function autoInitContentAds(
  containerId: string,
  client: string,
  slotStart?: string,
  slotEnd?: string
) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (slotStart) insertAdAfterFirst(container, client, slotStart);
  if (slotEnd) insertAdUnit(container, client, slotEnd);
}

/**
 * Auto-initialize ad placeholders for content pages (dev mode)
 * Shows where ads would appear without loading AdSense
 * @param containerId - Container element ID ('blog-content' or 'download-content')
 */
export function autoInitContentPlaceholders(containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) return;
  insertPlaceholderAfterFirst(container, 'Ad-Placeholder (start)');
  insertPlaceholderUnit(container, 'Ad-Placeholder (end)');
}

/**
 * Auto-initialize AdSense ads for blog post pages
 * Wrapper for backward compatibility - delegates to unified content ads function
 * @param client - AdSense client ID
 * @param slotStart - Optional slot ID for start placement (after first content element)
 * @param slotEnd - Optional slot ID for end placement (before last content element)
 */
export function autoInitBlogAds(
  client: string,
  slotStart?: string,
  slotEnd?: string
) {
  autoInitContentAds('blog-content', client, slotStart, slotEnd);
}

/**
 * Auto-initialize ad placeholders for blog post pages (dev mode)
 * Wrapper for backward compatibility - delegates to unified content placeholders function
 */
export function autoInitBlogPlaceholders() {
  autoInitContentPlaceholders('blog-content');
}

/**
 * Auto-initialize AdSense ads for download pages
 * Uses unified START and END slot placement logic
 * END placement: before last content element (same as blog)
 * @param client - AdSense client ID
 * @param slotStart - Optional slot ID for start placement (after first content element)
 * @param slotEnd - Optional slot ID for end placement (before last content element)
 */
export function autoInitDownloadAds(
  client: string,
  slotStart?: string,
  slotEnd?: string
) {
  const container = document.getElementById('download-content');
  if (!container) return;

  // Use unified START placement
  if (slotStart) insertAdAfterFirst(container, client, slotStart);

  // Use unified END placement (same as blog)
  if (slotEnd) insertAdUnit(container, client, slotEnd);
}

/**
 * Auto-initialize ad placeholders for download pages (dev mode)
 * Uses unified START and END placement (same as blog)
 */
export function autoInitDownloadPlaceholders() {
  const container = document.getElementById('download-content');
  if (!container) return;

  // Use unified START placement
  insertPlaceholderAfterFirst(container, 'Ad Placeholder (start)');

  // Use unified END placement (same as blog)
  insertPlaceholderUnit(container, 'Ad Placeholder (end)');
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
 * if (shouldRenderAds({ client, slots: [slotStart, slotEnd] })) {
 *   autoInitBlogAds(client, slotStart, slotEnd);
 * } else {
 *   autoInitBlogPlaceholders();
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

/**
 * Check if placeholders should be rendered (for development/staging)
 * Shows placeholders in dev mode OR on non-production domains (staging/preview)
 * This ensures staging builds show placeholders instead of broken ad slots
 * @returns True if placeholders should render (dev mode or non-production domain)
 */
export function shouldRenderPlaceholders(): boolean {
  // Show placeholders in non-production builds OR non-production domains
  // Ensures staging/preview environments show placeholders instead of empty ad slots
  return !import.meta.env.PROD || !isProdSite();
}
