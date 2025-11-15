import type { Post } from './blog';
import { markdownToPlainText, summarize } from './search-utils.js';

export interface SearchablePost {
  slug: string;
  title: string;
  excerpt: string;
  category?: string | null;
  dateLabel?: string | null;
  content: string;
  id?: string;
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
  const bodyPlain = markdownToPlainText(post.body);
  return {
    slug: post.slug,
    title: post.data.title || '',
    excerpt:
      post.data?.excerpt ?? post.data?.description ?? summarize(bodyPlain, 280),
    category: post.data?.category ?? null,
    dateLabel: post.date
      ? post.date.toLocaleDateString('id-ID', { dateStyle: 'medium' })
      : null,
    content: bodyPlain,
  };
}
