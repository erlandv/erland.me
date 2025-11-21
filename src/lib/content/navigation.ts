/**
 * Navigation Configuration
 *
 * Centralizes navigation link configuration for consistent routing across the application.
 * Used primarily in Sidebar component for main navigation menu.
 *
 * **Key Features:**
 * - `navigationLinks`: Array of configured navigation links
 * - `NavLink`: Type definition for navigation link objects
 *
 * **Usage:**
 * ```typescript
 * import { navigationLinks } from '@lib/content/navigation';
 *
 * // Render navigation links
 * navigationLinks.map(link => (
 *   <a href={link.href}>{link.label}</a>
 * ));
 * ```
 */

/**
 * Configuration object for a navigation link
 * @property id - Unique identifier for the link (used for active state matching)
 * @property href - URL path for the navigation link
 * @property label - Display text for the link
 * @property dataLabel - Alternative label for data attributes (defaults to label if not provided)
 * @property icon - Icon name to be used with the Icon component
 * @property ariaLabel - Accessible label for screen readers (defaults to label if not provided)
 */
export interface NavLink {
  id: string;
  href: string;
  label: string;
  dataLabel?: string;
  icon: string;
  ariaLabel?: string;
}

/**
 * List of main navigation links
 * Used to generate navigation menu in Sidebar component.
 * Order in this array determines the display order in the navigation.
 */
export const navigationLinks: NavLink[] = [
  {
    id: 'home',
    href: '/',
    label: 'Home',
    icon: 'navHome',
  },
  {
    id: 'web-development',
    href: '/portfolio/web-development/',
    label: 'Web development',
    dataLabel: 'Web Development',
    icon: 'navWeb',
    ariaLabel: 'Web Development',
  },
  {
    id: 'cloud-infra',
    href: '/portfolio/cloud-infra/',
    label: 'Cloud Infra',
    dataLabel: 'Cloud Infra',
    icon: 'navInfra',
    ariaLabel: 'Cloud Infrastructure',
  },
  {
    id: 'personal-projects',
    href: '/portfolio/personal-projects/',
    label: 'Personal projects',
    dataLabel: 'Personal Projects',
    icon: 'navPersonal',
    ariaLabel: 'Personal Projects',
  },
  {
    id: 'download',
    href: '/download/',
    label: 'Download',
    icon: 'navDownload',
  },
  {
    id: 'blog',
    href: '/blog/',
    label: 'Blog Posts',
    dataLabel: 'Blog Posts',
    icon: 'navBlog',
    ariaLabel: 'Blog Posts',
  },
];
