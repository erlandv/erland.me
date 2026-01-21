/**
 * Breadcrumb Utilities
 *
 * Helper functions and types for generating breadcrumb navigation items.
 * Provides consistent breadcrumb structure across different page types.
 *
 * **Key Features:**
 * - Type-safe breadcrumb item definitions
 * - Helper functions for common breadcrumb patterns
 * - Centralized breadcrumb generation logic
 * - JSON-LD structured data generation for SEO
 *
 * **Usage:**
 * ```typescript
 * import { createBlogPostBreadcrumb } from '@lib/content/breadcrumb';
 *
 * const items = createBlogPostBreadcrumb('My Post Title');
 * // Returns: [{ label: 'Home', href: '/' }, { label: 'Blog', href: '/blog/' }, { label: 'My Post Title' }]
 * ```
 */

import { breadcrumbJsonLd } from '@lib/content/seo';

/**
 * Single breadcrumb item configuration
 * @property label - Display text for the breadcrumb item
 * @property href - URL path (undefined = current page, no link rendered)
 * @property ariaLabel - Optional accessible label for screen readers
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
  ariaLabel?: string;
}

/**
 * Creates breadcrumb items for blog index page
 * Pattern: Home > Blog
 */
export function createBlogIndexBreadcrumb(): BreadcrumbItem[] {
  return [{ label: 'Home', href: '/' }, { label: 'Blog' }];
}

/**
 * Creates breadcrumb items for blog post detail page
 * Pattern: Home > Blog > {Post Title}
 *
 * @param title - Blog post title
 */
export function createBlogPostBreadcrumb(title: string): BreadcrumbItem[] {
  return [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog/' },
    { label: title },
  ];
}

/**
 * Creates breadcrumb items for blog category page
 * Pattern: Home > Blog > Categories > {Category Name}
 *
 * @param category - Category name (display format)
 * @param _categorySlug - Category slug (unused, current page has no link)
 */
export function createBlogCategoryBreadcrumb(
  category: string,
  _categorySlug: string,
): BreadcrumbItem[] {
  return [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog/' },
    { label: 'Categories', href: '/blog/category/' },
    { label: category },
  ];
}

/**
 * Creates breadcrumb items for blog category pagination page
 * Pattern: Home > Blog > Categories > {Category Name} > Page {N}
 *
 * @param category - Category name (display format)
 * @param categorySlug - Category slug for URL
 * @param pageNumber - Current page number
 */
export function createBlogCategoryPageBreadcrumb(
  category: string,
  categorySlug: string,
  pageNumber: number,
): BreadcrumbItem[] {
  return [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog/' },
    { label: 'Categories', href: '/blog/category/' },
    { label: category, href: `/blog/category/${categorySlug}/` },
    { label: `Page ${pageNumber}` },
  ];
}

/**
 * Creates breadcrumb items for blog pagination page
 * Pattern: Home > Blog > Page {N}
 *
 * @param pageNumber - Current page number
 */
export function createBlogPageBreadcrumb(pageNumber: number): BreadcrumbItem[] {
  return [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog/' },
    { label: `Page ${pageNumber}` },
  ];
}

/**
 * Creates breadcrumb items for blog category index page
 * Pattern: Home > Blog > Categories
 */
export function createBlogCategoryIndexBreadcrumb(): BreadcrumbItem[] {
  return [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog/' },
    { label: 'Categories' },
  ];
}

/**
 * Creates breadcrumb items for portfolio index page
 * Pattern: Home > Portfolio
 */
export function createPortfolioIndexBreadcrumb(): BreadcrumbItem[] {
  return [{ label: 'Home', href: '/' }, { label: 'Portfolio' }];
}

/**
 * Creates breadcrumb items for portfolio category page
 * Pattern: Home > Portfolio > {Category Name}
 *
 * @param category - Category display name
 */
export function createPortfolioBreadcrumb(category: string): BreadcrumbItem[] {
  return [
    { label: 'Home', href: '/' },
    { label: 'Portfolio', href: '/portfolio/' },
    { label: category },
  ];
}

/**
 * Creates breadcrumb items for download index page
 * Pattern: Home > Download
 */
export function createDownloadIndexBreadcrumb(): BreadcrumbItem[] {
  return [{ label: 'Home', href: '/' }, { label: 'Download' }];
}

/**
 * Creates breadcrumb items for download detail page
 * Pattern: Home > Download > {Template Heading}
 *
 * @param heading - Download template heading (preferred) or title
 */
export function createDownloadBreadcrumb(heading: string): BreadcrumbItem[] {
  return [
    { label: 'Home', href: '/' },
    { label: 'Download', href: '/download/' },
    { label: heading },
  ];
}

/**
 * Converts breadcrumb items to Schema.org BreadcrumbList JSON-LD
 * for SEO structured data. Only includes items with href (excludes current page).
 *
 * @param items - Array of breadcrumb items
 * @returns Schema.org BreadcrumbList structured data object
 *
 * @example
 * const items = createBlogPostBreadcrumb('My Post');
 * const jsonLd = breadcrumbItemsToJsonLd(items);
 * // Use in page: <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
 */
export function breadcrumbItemsToJsonLd(items: BreadcrumbItem[]) {
  // Filter items with href (exclude current page which has no href)
  const itemsWithLinks = items.filter(
    (item): item is BreadcrumbItem & { href: string } =>
      typeof item.href === 'string' && item.href.length > 0,
  );

  // Convert to format expected by breadcrumbJsonLd
  const jsonLdItems = itemsWithLinks.map(item => ({
    name: item.label,
    url: item.href,
  }));

  return breadcrumbJsonLd(jsonLdItems);
}
