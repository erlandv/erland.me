/**
 * UTM Parameter Utilities
 *
 * Provides helpers for adding UTM tracking parameters to URLs.
 * Used for tracking traffic sources, campaigns, and conversions across marketing channels.
 *
 * **Key Features:**
 * - `addUTMParams()`: Add UTM parameters to any URL
 * - Type-safe UTM parameter interface
 * - Automatic URL encoding
 *
 * **Usage:**
 * ```typescript
 * import { addUTMParams } from '@lib/tracking/utm';
 *
 * const trackedUrl = addUTMParams('https://example.com/page', {
 *   source: 'twitter',
 *   medium: 'social',
 *   campaign: 'share-button'
 * });
 * // Returns: https://example.com/page?utm_source=twitter&utm_medium=social&utm_campaign=share-button
 * ```
 */

/**
 * UTM tracking parameters
 * Based on Google Analytics UTM conventions
 * @see https://support.google.com/analytics/answer/1033863
 */
export interface UTMParams {
  /** Traffic source (e.g., 'google', 'twitter', 'newsletter') */
  source: string;
  /** Marketing medium (e.g., 'cpc', 'email', 'social') */
  medium?: string;
  /** Campaign name (e.g., 'summer-sale', 'product-launch') */
  campaign?: string;
  /** Paid keywords (for paid search) */
  term?: string;
  /** Ad creative variant (for A/B testing) */
  content?: string;
}

/**
 * Add UTM tracking parameters to a URL
 * Preserves existing query parameters and adds utm_* params
 * @param baseUrl - URL to add parameters to (must be valid URL)
 * @param params - UTM parameters to add
 * @returns URL with UTM parameters appended
 * @throws Error if baseUrl is invalid
 * @example
 * addUTMParams('https://example.com', { source: 'facebook', medium: 'social' })
 * // Returns: 'https://example.com?utm_source=facebook&utm_medium=social'
 */
export function addUTMParams(baseUrl: string, params: UTMParams): string {
  try {
    const url = new URL(baseUrl);

    // Add each UTM parameter if provided
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(`utm_${key}`, value);
      }
    });

    return url.toString();
  } catch (error) {
    throw new Error(
      `Invalid URL provided to addUTMParams: ${baseUrl}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Preset UTM configurations for common use cases
 */
export const UTM_PRESETS = {
  /** Share button tracking */
  shareButton: {
    medium: 'social',
    campaign: 'share-button',
  },
  /** Email newsletter links */
  newsletter: {
    medium: 'email',
    campaign: 'newsletter',
  },
  /** Organic social media posts */
  socialOrganic: {
    medium: 'social',
    campaign: 'organic',
  },
} as const;
