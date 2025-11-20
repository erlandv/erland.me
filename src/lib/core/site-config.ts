/**
 * Site Configuration
 *
 * Centralized site metadata, author information, and social links.
 * Single source of truth for all site-wide configuration used across:
 * - SEO & structured data (JSON-LD, meta tags)
 * - Footer copyright
 * - Sidebar social links
 * - Email contact links
 *
 * **Key Features:**
 * - Type-safe configuration interfaces
 * - Environment-aware URLs (uses SITE_URL, SITE_DOMAIN from env)
 * - Canonical social profile URLs
 * - Reusable author metadata
 *
 * **Usage:**
 * ```typescript
 * import { SITE_CONFIG, SOCIAL_LINKS } from '@lib/core/site-config';
 *
 * // Access site metadata
 * console.log(SITE_CONFIG.name); // 'erland.me'
 * console.log(SITE_CONFIG.author.name); // 'Erland Ramdhani'
 *
 * // Use in Schema.org Person
 * const person = {
 *   '@type': 'Person',
 *   name: SITE_CONFIG.author.name,
 *   sameAs: SOCIAL_LINKS.map(link => link.url),
 * };
 * ```
 */

import { SITE_URL, SITE_DOMAIN } from '@lib/core/env';

/**
 * Social media platform configuration
 */
export interface SocialLink {
  /** Platform identifier (e.g., 'github', 'twitter') */
  id: string;
  /** Display name of the platform */
  name: string;
  /** Full profile URL */
  url: string;
  /** Icon name for Icon component (e.g., 'socialGithub') */
  icon: string;
  /** Accessible label for screen readers */
  label: string;
}

/**
 * Author metadata configuration
 */
export interface AuthorConfig {
  /** Full name */
  name: string;
  /** Contact email address */
  email: string;
  /** Job title/role */
  jobTitle: string;
  /** Personal website URL */
  url: string;
  /** Array of social profile URLs for Schema.org sameAs */
  sameAs: string[];
}

/**
 * Site metadata configuration
 */
export interface SiteConfig {
  /** Site name/title */
  name: string;
  /** Site tagline/description */
  description: string;
  /** Base URL of the site */
  url: string;
  /** Author information */
  author: AuthorConfig;
}

/**
 * Canonical social media links
 * Single source of truth for all social profiles
 * Used in sidebar, footer, and Schema.org structured data
 */
export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com/erlandv',
    icon: 'socialGithub',
    label: 'GitHub',
  },
  {
    id: 'twitter',
    name: 'X',
    url: 'https://twitter.com/erlandzz',
    icon: 'socialX',
    label: 'X',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    url: 'https://www.instagram.com/erlandramdhani',
    icon: 'socialInstagram',
    label: 'Instagram',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    url: 'https://www.facebook.com/erlandramdhani',
    icon: 'socialFacebook',
    label: 'Facebook',
  },
  {
    id: 'bluesky',
    name: 'Bluesky',
    url: 'https://bsky.app/profile/erland.me',
    icon: 'socialBluesky',
    label: 'Bluesky',
  },
];

/**
 * Site configuration object
 * Centralized metadata for SEO, JSON-LD, and site-wide components
 */
export const SITE_CONFIG: SiteConfig = {
  name: 'erland.me',
  description:
    'Hello world! I am Erland. I build things for the web. I help teams turn ideas into production-ready, scalable web products that customers genuinely value.',
  url: SITE_URL,
  author: {
    name: 'Erland Ramdhani',
    email: `hello@${SITE_DOMAIN}`,
    jobTitle: 'Web Developer',
    url: SITE_URL,
    sameAs: SOCIAL_LINKS.map(link => link.url),
  },
};

/**
 * Get social link by platform ID
 * @param id - Platform identifier (e.g., 'github', 'twitter')
 * @returns Social link configuration object
 * @throws Error if platform not found
 * @example
 * const github = getSocialLinkById('github');
 * console.log(github.url); // 'https://github.com/erlandv'
 */
export function getSocialLinkById(id: string): SocialLink {
  const link = SOCIAL_LINKS.find(l => l.id === id);

  if (!link) {
    throw new Error(
      `Social link "${id}" not found. Available links: ${SOCIAL_LINKS.map(l => l.id).join(', ')}`
    );
  }

  return link;
}
