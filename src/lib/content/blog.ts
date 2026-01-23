/**
 * Blog Content Loading & Pagination Utilities
 *
 * Provides helpers for loading, filtering, and paginating blog posts from Astro content collections.
 * Handles hero image resolution (frontmatter vs. fallback), date normalization, and category slugification.
 *
 * **Key Functions:**
 * - `loadAllPosts()`: Load all published blog posts with rendered Content component
 * - `getTotalPages()`: Calculate pagination based on post count
 * - `slicePage()`: Generic pagination helper for array slicing
 * - `slugifyCategory()`: Convert category names to URL-safe slugs
 *
 * **Post Data Structure:**
 * Posts include both frontmatter data and the rendered Content component from Astro.
 * Hero images are resolved from either frontmatter `hero` field or fallback glob import.
 * Draft posts are automatically filtered out.
 *
 * **Usage:**
 * ```typescript
 * import { loadAllPosts, slicePage } from '@/lib/blog';
 *
 * const allPosts = await loadAllPosts(); // Sorted by publishDate DESC
 * const page1 = slicePage(allPosts, 1, 10); // First 10 posts
 * ```
 */

import { getCollection, render, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';

type BlogEntry = CollectionEntry<'blog'>;
type HeroType = string | ImageMetadata | undefined;

/**
 * Enriched post object with rendered Content component
 * Combines collection entry data with render output and normalized dates
 * @property slug - URL-safe identifier (directory name from content/blog/)
 * @property data - Frontmatter data validated by content.config.ts schema
 * @property date - Normalized publishDate as Date object (null if invalid)
 * @property hero - Hero image (frontmatter ImageMetadata, fallback URL string, or undefined)
 * @property body - Raw markdown body text
 * @property Content - Astro component for rendering markdown content
 */
export type Post = {
  slug: BlogEntry['slug'];
  data: BlogEntry['data'];
  date: Date | null;
  hero?: HeroType;
  body: BlogEntry['body'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Content: any; // Astro component from render()
};

/**
 * Safely parse date value to Date object
 * Handles invalid dates and various input formats
 * @param value - Date-like value (string, number, Date, or undefined)
 * @returns Parsed Date object or null if invalid
 */
const safeDate = (value: unknown): Date | null => {
  if (!value) return null;
  const d = new Date(value as string | number | Date);
  return isNaN(d.valueOf()) ? null : d;
};

/**
 * Load all published blog posts with rendered content
 * Fetches from 'blog' collection, renders markdown, resolves hero images, and sorts by date
 * @returns Array of Post objects sorted by publishDate descending (newest first)
 * @example
 * const posts = await loadAllPosts();
 * const latestPost = posts[0]; // Most recent post
 * const { Content } = latestPost; // Astro component for rendering
 */
export async function loadAllPosts(): Promise<Post[]> {
  const entries = await getCollection('blog');
  const heroMap = import.meta.glob(
    '../content/blog/*/hero.{jpg,jpeg,png,webp,gif,svg}',
    {
      query: '?url',
      import: 'default',
      eager: true,
    },
  );

  const posts: Post[] = [];
  for (const entry of entries) {
    const { Content } = await render(entry);
    const body = entry.body;
    // In Content Layer API, use entry.id as the slug (it's the file path without extension)
    const slug = entry.id;
    const heroEntry = Object.entries(heroMap).find(([p]) =>
      p.startsWith(`../content/blog/${slug}/hero.`),
    );
    const fallbackHero = heroEntry?.[1] as string | undefined;
    const hero = entry.data.hero ?? fallbackHero;
    posts.push({
      slug,
      data: entry.data,
      date: safeDate(entry.data.publishDate),
      hero,
      body,
      Content,
    });
  }

  return posts
    .filter(p => !p.data.draft)
    .sort((a, b) => (b.date?.valueOf() ?? 0) - (a.date?.valueOf() ?? 0));
}

/**
 * Calculate total number of pages for pagination
 * @param pageSize - Number of posts per page (default: 10)
 * @returns Total page count (minimum 1)
 * @example
 * const totalPages = await getTotalPages(10);
 * // Generate page routes 1..totalPages
 */
export async function getTotalPages(pageSize = 10): Promise<number> {
  const total = (await loadAllPosts()).length;
  return Math.max(1, Math.ceil(total / pageSize));
}

/**
 * Generic array pagination helper
 * Slices array based on 1-indexed page number
 * @param arr - Source array to paginate
 * @param page - Page number (1-indexed)
 * @param pageSize - Items per page (default: 10)
 * @returns Sliced array subset for the specified page
 * @example
 * const allPosts = await loadAllPosts();
 * const page2 = slicePage(allPosts, 2, 10); // Posts 11-20
 */
export function slicePage<T>(arr: T[], page: number, pageSize = 10): T[] {
  return arr.slice((page - 1) * pageSize, page * pageSize);
}

/**
 * Convert category name to URL-safe slug
 * Normalizes Unicode, converts to lowercase, replaces special characters with hyphens
 * @param input - Raw category name from frontmatter
 * @returns URL-safe slug (empty string if input is falsy)
 * @example
 * slugifyCategory('Web Development') // 'web-development'
 * slugifyCategory('AI & ML') // 'ai-and-ml'
 * slugifyCategory('Café Tutorials') // 'cafe-tutorials'
 */
export function slugifyCategory(input: string): string {
  if (!input) return '';
  const s = String(input)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s;
}
