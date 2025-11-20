/**
 * Sidebar Social Links
 *
 * Re-exports social links from centralized site-config with sidebar-specific interface.
 * This module transforms canonical SOCIAL_LINKS to the format expected by Sidebar components.
 *
 * **Note:** This is a compatibility layer. Prefer importing directly from @lib/core/site-config
 * for new code. Kept for backward compatibility with existing Sidebar components.
 */

import { SOCIAL_LINKS } from '@lib/core/site-config';

export interface SidebarSocialLink {
  name: string;
  href: string;
  label: string;
}

/**
 * Social links formatted for Sidebar component
 * Transforms SOCIAL_LINKS from site-config to legacy Sidebar format
 */
export const sidebarSocialLinks: SidebarSocialLink[] = SOCIAL_LINKS.map(
  link => ({
    name: link.icon, // Icon name (e.g., 'socialGithub')
    href: link.url, // Full profile URL
    label: link.label, // Display label
  })
);
