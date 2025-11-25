/**
 * SEO & Structured Data Utilities
 *
 * Provides helpers for generating Schema.org JSON-LD structured data and Open Graph meta tags.
 * All URLs are automatically prefixed with SITE_URL for absolute paths.
 *
 * **Structured Data Types:**
 * - `blogPostingJsonLd()`: Article/blog post with author, publisher, dates
 * - `creativeWorkJsonLd()`: Downloads/resources with ratings and file info
 * - `collectionPageJsonLd()`: Collection pages (blog listing, category pages)
 * - `categoriesIndexJsonLd()`: Category index pages
 * - `websiteJsonLd()`: Site-level metadata with search action
 * - `breadcrumbJsonLd()`: Navigation breadcrumbs
 * - `personJsonLd()`: Author/person entity
 * - `organizationJsonLd()`: Site as organization
 *
 * **Meta Tags:**
 * - `generateMetaTags()`: Complete meta tag object for Astro SEO component
 *   Includes Open Graph, Twitter Card, and canonical URL
 *
 * **Usage:**
 * ```typescript
 * import { blogPostingJsonLd, generateMetaTags } from '@/lib/seo';
 *
 * const jsonLd = blogPostingJsonLd({
 *   title: 'My Post',
 *   canonical: '/blog/my-post',
 *   publishDate: new Date(),
 * });
 *
 * const metaTags = generateMetaTags({
 *   title: 'My Post',
 *   description: 'Post description',
 *   canonical: '/blog/my-post',
 * });
 * ```
 */

import { isProdSite } from '@lib/core/env';
import { SITE_CONFIG } from '@lib/core/site-config';

// Environment helpers
export const isProductionSite = isProdSite;

/**
 * Generate CollectionPage JSON-LD for blog listing pages
 * Used for main blog index and paginated pages
 * @param name - Page title (e.g., 'Blog', 'Page 2')
 * @param url - Page path (e.g., '/blog/', '/blog/page/2')
 * @param items - Array of posts with url, name, and 1-indexed position
 * @returns Schema.org CollectionPage structured data object
 * @example
 * collectionPageJsonLd('Blog', '/blog/', [
 *   { url: '/blog/post-1', name: 'Post Title', position: 1 },
 *   { url: '/blog/post-2', name: 'Another Post', position: 2 },
 * ])
 */
export function collectionPageJsonLd(
  name: string,
  url: string,
  items: { url: string; name: string; position: number }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url: `${SITE_CONFIG.url}${url}`,
    description: `Collection of ${name.toLowerCase()} posts by ${SITE_CONFIG.author.name}`,
    isPartOf: {
      '@type': 'Blog',
      name: `${SITE_CONFIG.name} Blog`,
      url: `${SITE_CONFIG.url}/blog/`,
      author: personJsonLd(),
    },
    author: personJsonLd(),
    publisher: organizationJsonLd(),
    itemListElement: items.map(it => ({
      '@type': 'ListItem',
      position: it.position,
      item: {
        '@type': 'BlogPosting',
        name: it.name,
        url: `${SITE_CONFIG.url}${it.url}`,
      },
    })),
  } as const;
}

/**
 * Generate CollectionPage JSON-LD for category index pages
 * Similar to collectionPageJsonLd but for listing category pages instead of posts
 * @param name - Page title (e.g., 'Categories')
 * @param url - Page path (e.g., '/blog/category/')
 * @param items - Array of categories with url, name, and 1-indexed position
 * @returns Schema.org CollectionPage structured data object
 */
export function categoriesIndexJsonLd(
  name: string,
  url: string,
  items: { url: string; name: string; position: number }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url: `${SITE_CONFIG.url}${url}`,
    description: `Categories of blog posts by ${SITE_CONFIG.author.name}`,
    isPartOf: {
      '@type': 'Blog',
      name: `${SITE_CONFIG.name} Blog`,
      url: `${SITE_CONFIG.url}/blog/`,
      author: personJsonLd(),
    },
    author: personJsonLd(),
    publisher: organizationJsonLd(),
    itemListElement: items.map(it => ({
      '@type': 'ListItem',
      position: it.position,
      item: {
        '@type': 'WebPage',
        name: it.name,
        url: `${SITE_CONFIG.url}${it.url}`,
      },
    })),
  } as const;
}

/**
 * Generate BlogPosting JSON-LD for blog post detail pages
 * Includes full article metadata, authorship, dates, images, and reading time
 * @param opts - Post metadata options
 * @param opts.title - Article headline
 * @param opts.canonical - Page path (e.g., '/blog/my-post')
 * @param opts.publishDate - Original publication date
 * @param opts.updatedDate - Last modified date (defaults to publishDate)
 * @param opts.image - Hero image URL (string or array for multiple images)
 * @param opts.description - Article summary (falls back to excerpt)
 * @param opts.excerpt - Short excerpt if description not provided
 * @param opts.tags - Article tags/keywords
 * @param opts.category - Article category/section
 * @param opts.wordCount - Total word count
 * @param opts.readingTime - Estimated reading time in minutes
 * @returns Schema.org BlogPosting structured data object
 */
export function blogPostingJsonLd(opts: {
  title: string;
  canonical: string;
  publishDate?: Date | string | null;
  updatedDate?: Date | string | null;
  image?: string | string[] | null;
  description?: string | null;
  excerpt?: string | null;
  tags?: string[] | null;
  category?: string | null;
  wordCount?: number | null;
  readingTime?: number | null;
}) {
  const datePublished = opts.publishDate
    ? new Date(opts.publishDate).toISOString()
    : undefined;
  const dateModified = new Date(
    opts.updatedDate || opts.publishDate || Date.now(),
  ).toISOString();

  let image: string[] | undefined;
  if (Array.isArray(opts.image)) {
    image = opts.image;
  } else if (opts.image) {
    image = [opts.image];
  } else {
    image = undefined;
  }
  const fullUrl = `${SITE_CONFIG.url}${opts.canonical}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: opts.title,
    description: opts.description || opts.excerpt || undefined,
    datePublished,
    dateModified,
    url: fullUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': fullUrl,
    },
    author: personJsonLd(),
    publisher: organizationJsonLd(),
    image: image?.map(img => ({
      '@type': 'ImageObject',
      url: img.startsWith('http') ? img : `${SITE_CONFIG.url}${img}`,
      width: 1200,
      height: 630,
    })),
    keywords: opts.tags?.join(', ') || undefined,
    articleSection: opts.category || undefined,
    wordCount: opts.wordCount || undefined,
    timeRequired: opts.readingTime ? `PT${opts.readingTime}M` : undefined,
    inLanguage: 'id-ID',
    isPartOf: {
      '@type': 'Blog',
      name: `${SITE_CONFIG.name} Blog`,
      url: `${SITE_CONFIG.url}/blog/`,
    },
  } as const;
}

/**
 * Generate CreativeWork JSON-LD for downloadable resources
 * Includes version info, download links, file metadata, and ratings
 * @param opts - Resource metadata options
 * @param opts.title - Resource name
 * @param opts.description - Resource description
 * @param opts.version - Version string (e.g., '1.0.0')
 * @param opts.tags - Resource tags/keywords
 * @param opts.downloadUrl - Direct download link
 * @param opts.url - Resource detail page path
 * @param opts.image - Preview image URL
 * @param opts.lastUpdated - Last modification date
 * @param opts.publishDate - Original release date
 * @param opts.fileSize - Human-readable file size (e.g., '2.5 MB')
 * @param opts.fileFormat - MIME type (e.g., 'application/zip')
 * @param opts.rating - Aggregate rating object with value and count
 * @returns Schema.org CreativeWork structured data object
 */
export function creativeWorkJsonLd(opts: {
  title: string;
  description?: string | null;
  version?: string | null;
  tags?: string[] | null;
  downloadUrl?: string | null;
  url: string;
  image?: string | null;
  lastUpdated?: Date | string | null;
  publishDate?: Date | string | null;
  fileSize?: string | null;
  fileFormat?: string | null;
  rating?: {
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
    worstRating?: number;
  } | null;
}) {
  const datePublished = opts.publishDate
    ? new Date(opts.publishDate).toISOString()
    : undefined;

  let dateModified: string | undefined;
  if (opts.lastUpdated) {
    dateModified = new Date(opts.lastUpdated).toISOString();
  } else if (opts.publishDate) {
    dateModified = new Date(opts.publishDate).toISOString();
  } else {
    dateModified = undefined;
  }
  const fullUrl = opts.url.startsWith('http')
    ? opts.url
    : `${SITE_CONFIG.url}${opts.url}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: opts.title,
    description: opts.description ?? undefined,
    datePublished,
    dateModified,
    version: opts.version ?? undefined,
    keywords: opts.tags?.join(', ') || undefined,
    url: fullUrl,
    author: personJsonLd(),
    publisher: organizationJsonLd(),
    image: opts.image
      ? {
          '@type': 'ImageObject',
          url: opts.image.startsWith('http')
            ? opts.image
            : `${SITE_CONFIG.url}${opts.image}`,
          width: 1200,
          height: 630,
        }
      : undefined,
    downloadUrl: opts.downloadUrl
      ? {
          '@type': 'DataDownload',
          url: opts.downloadUrl.startsWith('http')
            ? opts.downloadUrl
            : `${SITE_CONFIG.url}${opts.downloadUrl}`,
          fileFormat: opts.fileFormat || 'application/zip',
          contentSize: opts.fileSize,
        }
      : undefined,
    aggregateRating: opts.rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: opts.rating.ratingValue,
          reviewCount: opts.rating.reviewCount,
          bestRating: opts.rating.bestRating ?? 5,
          worstRating: opts.rating.worstRating ?? 1,
          itemReviewed: {
            '@type': 'MediaObject',
            name: opts.title,
            url: fullUrl,
            description: opts.description ?? undefined,
          },
        }
      : undefined,
    inLanguage: 'id-ID',
    isAccessibleForFree: true,
    license: 'https://creativecommons.org/licenses/by/4.0/',
  } as const;
}

/**
 * Generate Person JSON-LD for site author
 * Used in BlogPosting, CreativeWork, and Organization structured data
 * @returns Schema.org Person entity for site author
 */
export function personJsonLd() {
  return {
    '@type': 'Person',
    name: SITE_CONFIG.author.name,
    email: SITE_CONFIG.author.email,
    jobTitle: SITE_CONFIG.author.jobTitle,
    url: SITE_CONFIG.author.url,
    sameAs: SITE_CONFIG.author.sameAs,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Jakarta',
      addressCountry: 'ID',
    },
  } as const;
}

/**
 * Generate Organization JSON-LD for site publisher
 * Used as publisher in BlogPosting and CreativeWork
 * @returns Schema.org Organization entity for the site
 */
export function organizationJsonLd() {
  return {
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_CONFIG.url}/assets/profile/logo.svg`,
      width: 512,
      height: 512,
    },
    founder: personJsonLd(),
    description: SITE_CONFIG.description,
  } as const;
}

/**
 * Generate WebSite JSON-LD for site-level metadata
 * Includes search action for blog search functionality
 * Typically used on homepage and main navigation pages
 * @returns Schema.org WebSite structured data object
 */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    author: personJsonLd(),
    publisher: organizationJsonLd(),
    inLanguage: 'id-ID',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/blog/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  } as const;
}

/**
 * Generate BreadcrumbList JSON-LD for navigation trail
 * Shows hierarchical page position in site structure
 * @param items - Breadcrumb items in order (root to current page)
 * @returns Schema.org BreadcrumbList structured data object
 * @example
 * breadcrumbJsonLd([
 *   { name: 'Home', url: '/' },
 *   { name: 'Blog', url: '/blog/' },
 *   { name: 'Post Title', url: '/blog/post-slug' },
 * ])
 */
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_CONFIG.url}${item.url}`,
    })),
  } as const;
}

/**
 * Generate complete meta tags object for Astro SEO component
 * Includes Open Graph, Twitter Card, and canonical URL
 * @param opts - Meta tag options
 * @param opts.title - Page title (will be suffixed with site name)
 * @param opts.description - Page description
 * @param opts.canonical - Page path (converted to absolute URL)
 * @param opts.image - Social share image URL
 * @param opts.type - Open Graph type (default: 'website')
 * @param opts.publishedTime - Article published date (for type: 'article')
 * @param opts.modifiedTime - Article modified date (for type: 'article')
 * @param opts.tags - Article tags (for type: 'article')
 * @param opts.author - Article author name (for type: 'article')
 * @returns Object with title, description, canonical, openGraph, and twitter properties
 * @example
 * generateMetaTags({
 *   title: 'My Blog Post',
 *   description: 'A great post about...',
 *   canonical: '/blog/my-post',
 *   image: '/images/hero.jpg',
 *   type: 'article',
 *   publishedTime: new Date(),
 * })
 */
export function generateMetaTags(opts: {
  title: string;
  description?: string | null;
  canonical?: string | null;
  image?: string | null;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: Date | string | null;
  modifiedTime?: Date | string | null;
  tags?: string[] | null;
  author?: string | null;
}) {
  const fullUrl = opts.canonical
    ? `${SITE_CONFIG.url}${opts.canonical}`
    : SITE_CONFIG.url;

  let imageUrl: string;
  if (opts.image) {
    imageUrl = opts.image.startsWith('http')
      ? opts.image
      : `${SITE_CONFIG.url}${opts.image}`;
  } else {
    imageUrl = `${SITE_CONFIG.url}/assets/social/og-default-1200x630.png`;
  }
  const imageAlt = opts.description || `${opts.title} – ${SITE_CONFIG.name}`;

  return {
    title: `${opts.title} - ${SITE_CONFIG.name}`,
    description: opts.description || SITE_CONFIG.description,
    canonical: fullUrl,
    openGraph: {
      title: opts.title,
      description: opts.description || SITE_CONFIG.description,
      url: fullUrl,
      type: opts.type || 'website',
      image: imageUrl,
      imageAlt: imageAlt,
      siteName: SITE_CONFIG.name,
      locale: 'id_ID',
      ...(opts.publishedTime && {
        publishedTime: new Date(opts.publishedTime).toISOString(),
      }),
      ...(opts.modifiedTime && {
        modifiedTime: new Date(opts.modifiedTime).toISOString(),
      }),
      ...(opts.tags && { tags: opts.tags }),
      ...(opts.author && { authors: [opts.author] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description || SITE_CONFIG.description,
      image: imageUrl,
      imageAlt: imageAlt,
      creator: '@erlandzz',
      site: '@erlandzz',
    },
  };
}
