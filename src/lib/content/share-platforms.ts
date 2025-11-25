/**
 * Share Platform Configurations
 *
 * Centralizes social sharing platform configurations for consistent share button implementation.
 * Each platform defines how to build share URLs with UTM tracking.
 *
 * **Key Features:**
 * - `sharePlatforms`: Array of configured share platforms
 * - `SharePlatform`: Type definition for platform objects
 * - Pre-configured platforms: WhatsApp, Telegram, X/Twitter, Facebook, LinkedIn
 *
 * **Usage:**
 * ```typescript
 * import { sharePlatforms } from '@lib/content/share-platforms';
 *
 * // Render share buttons
 * sharePlatforms.map(platform => (
 *   <a href={platform.buildUrl({ url: '...', title: '...' })}>
 *     {platform.name}
 *   </a>
 * ));
 * ```
 */

/**
 * Parameters for building share URLs
 */
export interface ShareParams {
  /** URL to share (with UTM parameters already added) */
  url: string;
  /** Title/text to share */
  title: string;
  /** Optional description (used by some platforms) */
  text?: string;
}

/**
 * Configuration object for a social sharing platform
 * @property id - Unique identifier for the platform (kebab-case)
 * @property name - Display name of the platform
 * @property icon - Icon name to be used with the Icon component
 * @property ariaLabel - Accessible label for screen readers
 * @property buildUrl - Function to construct the share URL for this platform
 */
export interface SharePlatform {
  id: string;
  name: string;
  icon: string;
  ariaLabel: string;
  buildUrl: (params: ShareParams) => string;
}

/**
 * URL encoder helper
 */
const enc = encodeURIComponent;

/**
 * List of social sharing platforms
 * Used to generate share buttons in ShareButtons component.
 * Order in this array determines the display order.
 */
export const sharePlatforms: SharePlatform[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'socialWhatsapp',
    ariaLabel: 'Share on WhatsApp',
    buildUrl: ({ url, title }) =>
      `https://wa.me/?text=${enc(`${title} — ${url}`)}`,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: 'socialTelegram',
    ariaLabel: 'Share on Telegram',
    buildUrl: ({ url, title }) =>
      `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`,
  },
  {
    id: 'twitter',
    name: 'X/Twitter',
    icon: 'socialX',
    ariaLabel: 'Share on X/Twitter',
    buildUrl: ({ url, title }) =>
      `https://x.com/intent/post?url=${enc(url)}&text=${enc(title)}`,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'socialFacebook',
    ariaLabel: 'Share on Facebook',
    buildUrl: ({ url }) =>
      `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'socialLinkedin',
    ariaLabel: 'Share on LinkedIn',
    buildUrl: ({ url }) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: 'socialPinterest',
    ariaLabel: 'Share on Pinterest',
    buildUrl: ({ url, title, text }) =>
      `https://pinterest.com/pin/create/button/?url=${enc(url)}&description=${enc(text || title)}`,
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: 'socialReddit',
    ariaLabel: 'Share on Reddit',
    buildUrl: ({ url, title }) =>
      `https://reddit.com/submit?url=${enc(url)}&title=${enc(title)}`,
  },
];

/**
 * Get platform configuration by ID
 * @param platformId - Platform identifier (e.g., 'twitter', 'facebook')
 * @returns Platform configuration object
 * @throws Error if platform not found
 * @example
 * const twitter = getPlatformById('twitter');
 * const shareUrl = twitter.buildUrl({ url: '...', title: '...' });
 */
export function getPlatformById(platformId: string): SharePlatform {
  const platform = sharePlatforms.find(p => p.id === platformId);

  if (!platform) {
    throw new Error(
      `Share platform "${platformId}" not found. Available platforms: ${sharePlatforms.map(p => p.id).join(', ')}`,
    );
  }

  return platform;
}
