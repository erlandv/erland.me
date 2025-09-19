export function collectionPageJsonLd(name: string, url: string, items: { url: string; name: string; position: number }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url,
    isPartOf: { '@type': 'Blog', name, url },
    itemListElement: items.map((it) => ({ '@type': 'ListItem', ...it })),
  } as const;
}

export function blogPostingJsonLd(opts: {
  title: string;
  canonical: string;
  publishDate?: Date | string | null;
  updatedDate?: Date | string | null;
  image?: string | string[] | null;
}) {
  const datePublished = opts.publishDate ? new Date(opts.publishDate).toISOString() : undefined;
  const dateModified = new Date(opts.updatedDate || opts.publishDate || Date.now()).toISOString();
  const image = Array.isArray(opts.image) ? opts.image : opts.image ? [opts.image] : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: opts.title,
    datePublished,
    dateModified,
    mainEntityOfPage: opts.canonical,
    image,
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
}) {
  const dateModified = opts.lastUpdated ? new Date(opts.lastUpdated).toISOString() : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: opts.title,
    description: opts.description ?? undefined,
    dateModified,
    version: opts.version ?? undefined,
    keywords: opts.tags?.join(', ') || undefined,
    downloadUrl: opts.downloadUrl ?? undefined,
    url: opts.url,
    image: opts.image ?? undefined,
  } as const;
}

