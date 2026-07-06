/**
 * Stories Data Loader
 *
 * Handles fetching, validating, and caching of stories data from JSON.
 *
 * **Security:**
 * - All `src` URLs are validated to be relative paths or same-origin to
 *   prevent open redirect / SSRF risks from a tampered stories.json.
 * - All string fields are validated for type before use.
 *
 * **Caching:**
 * - In-memory cache prevents repeated network requests within the same session.
 * - Cache is invalidated on module re-load (e.g., HMR).
 */

import { createLogger } from '@lib/core/logger';
import type { Story, Music, StoriesData } from './types';

const log = createLogger('Stories:Loader');

/**
 * URL of the stories JSON data file
 */
const STORIES_DATA_URL = '/data/stories.json';

/**
 * In-memory cache for loaded stories data.
 * Prevents multiple fetches within the same page session.
 */
let storiesDataCache: StoriesData | null = null;

// ─── Validation helpers ───────────────────────────────────────────────────────

/**
 * Validate that a story image `src` is a safe URL.
 *
 * Allows:
 * - Relative paths starting with `/` (same-origin)
 * - Relative paths without a scheme (e.g. `assets/img.jpg`)
 *
 * Rejects:
 * - Absolute URLs with any scheme (http, https, data, javascript, etc.)
 *   to prevent loading images from arbitrary external hosts.
 *
 * @param src - Raw src value from JSON
 * @returns true if the src is considered safe
 */
function isSafeSrc(src: unknown): src is string {
  if (typeof src !== 'string' || src.trim() === '') return false;
  // Reject anything that looks like a scheme (e.g. https://, data:, javascript:)
  // A safe src must not contain "://" and must not start with "//" (protocol-relative)
  const trimmed = src.trim();
  if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(trimmed)) return false; // has scheme
  if (trimmed.startsWith('//')) return false; // protocol-relative
  return true;
}

/**
 * Validate and sanitise a single raw story object from JSON.
 * Returns null if the object fails validation.
 *
 * @param raw - Untyped value from JSON parse
 * @returns Validated Story or null
 */
function validateStory(raw: unknown): Story | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const obj = raw as Record<string, unknown>;

  const src = obj['src'];
  const alt = obj['alt'];

  if (!isSafeSrc(src)) {
    log.warn(`Story skipped — invalid or unsafe src: ${String(src)}`);
    return null;
  }

  return {
    src: (src as string).trim(),
    alt: typeof alt === 'string' ? alt.trim() : '',
  };
}

/**
 * Validate and sanitise the optional music object from JSON.
 * Returns undefined if the object is absent or fails validation.
 *
 * @param raw - Untyped value from JSON parse
 * @returns Validated Music or undefined
 */
function validateMusic(raw: unknown): Music | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const obj = raw as Record<string, unknown>;

  const src = obj['src'];
  const title = obj['title'];

  if (!isSafeSrc(src)) {
    log.warn(`Music skipped — invalid or unsafe src: ${String(src)}`);
    return undefined;
  }

  return {
    src: (src as string).trim(),
    title: typeof title === 'string' ? title.trim() : '',
    artist:
      typeof obj['artist'] === 'string' ? obj['artist'].trim() : undefined,
  };
}

/**
 * Validate the raw JSON payload returned from the stories endpoint.
 * Filters out any story items that fail individual validation.
 *
 * @param raw - Parsed JSON value (unknown shape)
 * @returns Validated StoriesData with safe items only
 * @throws {Error} if the top-level shape is not an object with a `stories` array
 */
function validateStoriesData(raw: unknown): StoriesData {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Stories data is not an object');
  }

  const obj = raw as Record<string, unknown>;

  if (!Array.isArray(obj['stories'])) {
    throw new Error('stories field is missing or not an array');
  }

  const stories: Story[] = (obj['stories'] as unknown[])
    .map(validateStory)
    .filter((s): s is Story => s !== null);

  const music = validateMusic(obj['music']);

  return { stories, music };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Load, validate, and cache stories data from the JSON endpoint.
 *
 * Returns an empty stories array as a safe fallback on any error so
 * callers never receive null/undefined.
 *
 * @returns Promise resolving to a validated StoriesData object
 */
export async function loadStoriesData(): Promise<StoriesData> {
  if (storiesDataCache !== null) {
    return storiesDataCache;
  }

  try {
    const response = await fetch(STORIES_DATA_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const raw: unknown = await response.json();
    const data = validateStoriesData(raw);

    if (data.stories.length === 0) {
      log.warn('No valid stories found in stories.json');
    }

    storiesDataCache = data;
    return storiesDataCache;
  } catch (error) {
    log.error('Failed to load stories', error instanceof Error ? error : new Error(String(error)));
    return { stories: [] };
  }
}

/**
 * Clear the in-memory stories cache.
 * Useful in tests or when stories data needs to be re-fetched.
 */
export function clearStoriesCache(): void {
  storiesDataCache = null;
}
