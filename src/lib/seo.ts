// Base site configuration
import { SITE_URL, SITE_DOMAIN, isProdSite } from './env';

const SITE_CONFIG = {
  name: 'Erland Ramdhani',
  description:
    'Web Developer based in Jakarta, Indonesia. Building scalable web applications and sharing knowledge about web development, cloud infrastructure, and open source.',
  url: SITE_URL,
  author: {
    name: 'Erland Ramdhani',
    email: `hello@${SITE_DOMAIN}`,
    jobTitle: 'Web Developer',
    url: SITE_URL,
    sameAs: [
      'https://github.com/erlandv',
      'https://twitter.com/erlandzz',
      'https://www.instagram.com/erlandramdhani',
      'https://www.facebook.com/erlandramdhani',
      'https://bsky.app/profile/erland.me',
    ],
  },
} as const;

// Environment helpers
export const isProductionSite = isProdSite;

export function collectionPageJsonLd(
  name: string,
  url: string,
  items: { url: string; name: string; position: number }[]
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
    opts.updatedDate || opts.publishDate || Date.now()
  ).toISOString();
  const image = Array.isArray(opts.image)
    ? opts.image
    : opts.image
      ? [opts.image]
      : undefined;
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

export function creativeWorkJsonLd(opts: {
  title: string;
  description?: string | null;
  version?: string | null;
  tags?: string[] | null;
  downloadUrl?: string | null;
  url: string;
  image?: string | null;
  lastUpdated?: Date | string | null;
  fileSize?: string | null;
  fileFormat?: string | null;
}) {
  const dateModified = opts.lastUpdated
    ? new Date(opts.lastUpdated).toISOString()
    : undefined;
  const fullUrl = `${SITE_CONFIG.url}${opts.url}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: opts.title,
    description: opts.description ?? undefined,
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
    inLanguage: 'id-ID',
    isAccessibleForFree: true,
    license: 'https://creativecommons.org/licenses/by/4.0/',
  } as const;
}

// Helper functions for structured data
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

export function organizationJsonLd() {
  return {
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_CONFIG.url}/assets/erland-icon.svg`,
      width: 512,
      height: 512,
    },
    founder: personJsonLd(),
    description: SITE_CONFIG.description,
  } as const;
}

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

// Enhanced meta tags generator
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
  const imageUrl = opts.image
    ? opts.image.startsWith('http')
      ? opts.image
      : `${SITE_CONFIG.url}${opts.image}`
    : `${SITE_CONFIG.url}/assets/erland-icon.svg`;

  return {
    title: `${opts.title} | ${SITE_CONFIG.name}`,
    description: opts.description || SITE_CONFIG.description,
    canonical: fullUrl,
    openGraph: {
      title: opts.title,
      description: opts.description || SITE_CONFIG.description,
      url: fullUrl,
      type: opts.type || 'website',
      image: imageUrl,
      imageAlt: opts.description || `${opts.title} – ${SITE_CONFIG.name}`,
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
      imageAlt: opts.description || `${opts.title} – ${SITE_CONFIG.name}`,
      creator: '@erlandzz',
      site: '@erlandzz',
    },
  };
}
