/**
 * Page Metadata Configuration
 *
 * Centralized SEO metadata for all static pages.
 * Single source of truth for titles and descriptions to ensure consistency
 * and enable easy A/B testing of meta descriptions.
 *
 * **Key Features:**
 * - Type-safe page metadata interfaces
 * - Centralized descriptions for all static routes
 * - Template functions for dynamic pages (blog categories, pagination)
 * - Easy to review and update SEO copy
 * - A/B testing friendly (change description in one place)
 *
 * **Usage:**
 * ```typescript
 * import { PAGE_METADATA, generateBlogPageMeta } from '@lib/content/page-metadata';
 *
 * // Static pages
 * const meta = PAGE_METADATA.home;
 * console.log(meta.title); // 'Personal Web'
 * console.log(meta.description); // Full description
 *
 * // Dynamic pages
 * const blogMeta = generateBlogPageMeta(2);
 * console.log(blogMeta.description); // 'Page 2: Arsip blog...'
 * ```
 */

import { SITE_CONFIG } from '@lib/core/site-config';

/**
 * Page metadata structure
 */
export interface PageMetadata {
  /** Page title (will be suffixed with site name by SiteLayout) */
  title: string;
  /** Meta description for SEO */
  description: string;
}

/**
 * Static page metadata
 * Contains all hardcoded page titles and descriptions
 */
export const PAGE_METADATA = {
  /** Homepage metadata */
  home: {
    title: 'Personal Web',
    description: `Hello world! I am ${SITE_CONFIG.author.name}. I build things for the web. I help teams turn ideas into production-ready, scalable web products that customers genuinely value.`,
  },

  /** Portfolio pages */
  portfolio: {
    index: {
      title: 'All Portfolio',
      description:
        'Explore projects across web, cloud, and side gigs, a snapshot of what I have built and learned. I deliver end-to-end builds with uptime-first architectures and lean cloud costs.',
    },
    webDevelopment: {
      title: 'Web Development Portfolio',
      description:
        'Showcase of web builds from landing pages and blogs to dashboards. I turn web into fast, accessible sites with clean UI, solid SEO, and maintainable code.',
    },
    cloudInfra: {
      title: 'Cloud Infra Portfolio',
      description:
        'Uptime-first infrastructure work across VMs, containers, load balancers, backups, and CDNs. IaC, monitoring, and cost controls to keep things reliable and lean.',
    },
    personalProjects: {
      title: 'Personal Projects Portfolio',
      description:
        'Weekend experiments and open-source toys—small tools, prototypes, and notes where I test ideas, learn new stacks, and ship for fun.',
    },
  },

  /** Blog pages */
  blog: {
    index: {
      title: 'Personal Blog Posts',
      description: `Halaman blog pribadi milik ${SITE_CONFIG.author.name}. Berisi berbagai artikel yang ditulis untuk menyalurkan hobi walau tak tentu waktu publikasi.`,
    },
    categoryIndex: {
      title: 'All Blog Categories',
      description: `Daftar kategori blog posts by ${SITE_CONFIG.author.name}. Cek berbagai topik menarik yang telah dibahas di blog ini.`,
    },
  },

  /** Download pages */
  download: {
    index: {
      title: 'Download Templates and Files',
      description:
        'Download berbagai macam file yang saya bagikan secara gratis. Download dengan mudah hanya dengan sekali klik, file akan otomatis terunduh ke perangkat kalian tanpa perlu melewati halaman safelink.',
    },
  },

  /** Utility pages */
  notFound: {
    title: 'Page Not Found',
    description:
      "Page Not Found! That path doesn't exist, but your journey still does. Let's find your way back.",
  },

  forbidden: {
    title: 'Access Forbidden',
    description:
      "You don't have permission to access this resource. If you believe this is an error, please contact the administrator.",
  },

  offline: {
    title: 'Offline',
    description:
      'This page is shown when you are offline. Please check your internet connection and try again.',
  },

  privacyPolicy: {
    title: 'Privacy Policy',
    description:
      'Dengan mengakses dan/atau menggunakan layanan di situs ini, Anda dianggap telah membaca, memahami, menyetujui, dan terikat oleh kebijakan privasi ini.',
  },
} as const;

/**
 * Generate metadata for blog pagination pages
 * @param page - Page number (2, 3, 4, ...)
 * @returns Page metadata with page number in title and description
 * @example
 * const meta = generateBlogPageMeta(2);
 * // { title: 'Page 2: Blog Archives', description: 'Page 2: Arsip blog...' }
 */
export function generateBlogPageMeta(page: number): PageMetadata {
  return {
    title: `Page ${page}: Blog Archives`,
    description: `Page ${page}: Arsip blog yang berisi berbagai artikel oleh ${SITE_CONFIG.author.name}. Baca artikel menarik di blog ini.`,
  };
}

/**
 * Generate metadata for blog category pages
 * @param category - Category display name (e.g., 'Info', 'Tutorial')
 * @param page - Optional page number for pagination
 * @returns Page metadata with category in title and description
 * @example
 * const meta = generateCategoryPageMeta('Info');
 * // { title: 'Info Blog Posts', description: 'Arsip blog berdasarkan kategori Info...' }
 *
 * const paginatedMeta = generateCategoryPageMeta('Info', 2);
 * // { title: 'Page 2: Info Blog Posts', description: 'Page 2: Arsip blog berdasarkan kategori Info...' }
 */
export function generateCategoryPageMeta(
  category: string,
  page?: number
): PageMetadata {
  const titlePrefix = page ? `Page ${page}: ` : '';
  const descPrefix = page ? `Page ${page}: ` : '';

  return {
    title: `${titlePrefix}${category} Blog Posts`,
    description: `${descPrefix}Arsip blog berdasarkan kategori ${category}. Baca artikel terkait ${category} di blog ${SITE_CONFIG.author.name}.`,
  };
}

/**
 * Get full page title with site name suffix
 * Helper function to generate complete page title (mirrors SiteLayout behavior)
 * @param baseTitle - Base page title
 * @returns Full title with site name suffix
 * @example
 * getFullPageTitle('Personal Web'); // 'Personal Web by Erland Ramdhani - erland.me'
 */
export function getFullPageTitle(baseTitle: string): string {
  return `${baseTitle} by ${SITE_CONFIG.author.name} - ${SITE_CONFIG.name}`;
}
