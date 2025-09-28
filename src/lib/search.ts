import type { Post } from './blog';

export interface SearchablePost {
  slug: string;
  title: string;
  excerpt: string;
  category?: string | null;
  dateLabel?: string | null;
  content: string; // Will be used for full-text search
  heroSrc?: string | null;
}

export interface SearchResult {
  item: SearchablePost;
  score?: number;
  matches?: Array<{
    indices: [number, number][];
    key: string;
    value: string;
  }>;
}

export interface SearchConfig {
  keys: Array<{
    name: string;
    weight: number;
  }>;
  threshold: number;
  includeScore: boolean;
  includeMatches: boolean;
  minMatchCharLength: number;
  ignoreLocation: boolean;
}

// Web Worker interfaces removed - using client-side search only

// Default search configuration
export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'excerpt', weight: 0.3 },
    { name: 'content', weight: 0.2 },
    { name: 'category', weight: 0.1 },
  ],
  threshold: 0.3,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
};

// Convert Post to SearchablePost
export function postToSearchable(post: Post): SearchablePost {
  // Extract text content from the rendered content for better search
  let content = '';
  try {
    // This is a simplified content extraction
    // In a real implementation, you might want to extract text from the rendered HTML
    content = post.data?.excerpt ?? post.data?.description ?? '';
  } catch (error) {
    // Silent fail for content extraction
  }

  // Try to normalize hero to a usable src string
  let heroSrc: string | null = null;
  try {
    const hero: any = (post as any).hero;
    if (typeof hero === 'string') {
      heroSrc = hero;
    } else if (hero && typeof hero.src === 'string') {
      heroSrc = hero.src as string;
    }
  } catch {
    // ignore hero extraction errors
  }

  return {
    slug: post.slug,
    title: post.data.title || '',
    excerpt: post.data?.excerpt ?? post.data?.description ?? '',
    category: post.data?.category ?? null,
    dateLabel: post.date
      ? post.date.toLocaleDateString('id-ID', { dateStyle: 'medium' })
      : null,
    content: content,
    heroSrc,
  };
}
