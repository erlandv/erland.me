/**
 * Client-Side Search Utilities for Fuse.js Integration
 *
 * Provides type-safe configuration and transformation utilities for fuzzy search.
 * Works with pre-generated search index from `scripts/generate-search-index.mjs`.
 *
 * **Architecture:**
 * - Server-side: Build script generates `public/search-index.json` from content collections
 * - Client-side: Fetch index + initialize Fuse.js with weighted search keys
 * - Real-time: Fuzzy matching across title, excerpt, content, and category
 *
 * **Search Strategy:**
 * - Title: 40% weight (most important)
 * - Excerpt: 30% weight (summary relevance)
 * - Content: 20% weight (full-text search)
 * - Category: 10% weight (taxonomy)
 *
 * **Usage:**
 * ```typescript
 * import Fuse from 'fuse.js';
 * import { DEFAULT_SEARCH_CONFIG, type SearchablePost } from './search';
 *
 * const response = await fetch('/search-index.json');
 * const data: SearchablePost[] = await response.json();
 * const fuse = new Fuse(data, DEFAULT_SEARCH_CONFIG);
 * const results = fuse.search('query');
 * ```
 */

import type { Post } from './blog';
import { markdownToPlainText, summarize } from './search-utils.js';

/**
 * Searchable post structure optimized for Fuse.js
 * Flattened representation of blog post with plain text content
 * @property slug - URL-safe post identifier
 * @property title - Post title (40% search weight)
 * @property excerpt - Summary text (30% search weight)
 * @property category - Post category/taxonomy (10% search weight)
 * @property dateLabel - Formatted date for display (not searchable)
 * @property content - Full plain text content (20% search weight)
 * @property id - Optional unique identifier
 */
export interface SearchablePost {
  slug: string;
  title: string;
  excerpt: string;
  category?: string | null;
  dateLabel?: string | null;
  content: string;
  id?: string;
}

/**
 * Fuse.js search result with scoring and match highlighting
 * @property item - The matched searchable post
 * @property score - Relevance score (0 = perfect match, 1 = no match)
 * @property matches - Array of matched text segments with character indices
 */
export interface SearchResult {
  item: SearchablePost;
  score?: number;
  matches?: Array<{
    indices: [number, number][];
    key: string;
    value: string;
  }>;
}

/**
 * Fuse.js search configuration with weighted keys
 * Defines search behavior, scoring, and match highlighting
 * @property keys - Weighted search fields (name + weight)
 * @property threshold - Match threshold (0-1, lower = stricter)
 * @property includeScore - Whether to include relevance scores
 * @property includeMatches - Whether to include match indices for highlighting
 * @property minMatchCharLength - Minimum character length for matches
 * @property ignoreLocation - Ignore match position in text (true = search entire text)
 */
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

/**
 * Default Fuse.js configuration for blog search
 *
 * **Weighted Search Keys:**
 * - Title: 0.4 (40%) - Highest priority for title matches
 * - Excerpt: 0.3 (30%) - Summary/description relevance
 * - Content: 0.2 (20%) - Full-text search weight
 * - Category: 0.1 (10%) - Taxonomy filtering
 *
 * **Search Behavior:**
 * - Threshold: 0.3 (balanced - not too strict, not too loose)
 * - Ignore location: true (matches anywhere in text)
 * - Include score + matches: Enables relevance sorting and highlighting
 * - Min match length: 2 characters (prevents single-char noise)
 *
 * @example
 * const fuse = new Fuse(searchData, DEFAULT_SEARCH_CONFIG);
 * const results = fuse.search('astro framework');
 * // Returns weighted matches with scores and highlight indices
 */
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

/**
 * Transform blog post to searchable format
 * Converts markdown content to plain text and extracts searchable fields
 *
 * **Transformations:**
 * - Body: Markdown → Plain text (strips HTML/formatting)
 * - Excerpt: Uses frontmatter excerpt → description → auto-generated summary
 * - Date: Formats as Indonesian locale medium date string
 * - Category: Preserves taxonomy for filtering
 *
 * @param post - Raw blog post from content collection
 * @returns Flattened searchable post structure
 * @example
 * const posts = await getCollection('blog');
 * const searchableData = posts.map(postToSearchable);
 * await fs.writeFile('search-index.json', JSON.stringify(searchableData));
 */
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
