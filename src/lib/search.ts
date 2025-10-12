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

function markdownToPlainText(md: string | null | undefined): string {
  if (!md) return '';
  let txt = md;
  // Remove code fences
  txt = txt.replace(/```[\s\S]*?```/g, '');
  // Remove HTML tags
  txt = txt.replace(/<[^>]+>/g, '');
  // Remove images ![alt](url)
  txt = txt.replace(/!\[[^\]]*\]\([^)]+\)/g, '');
  // Replace links [text](url) -> text
  txt = txt.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Remove heading markers
  txt = txt.replace(/^#{1,6}\s+/gm, '');
  // Remove emphasis and inline code markers
  txt = txt.replace(/[*_~`]/g, '');
  // Normalize whitespace
  txt = txt.replace(/\r/g, '');
  txt = txt.replace(/\t/g, ' ');
  txt = txt.replace(/[ ]{2,}/g, ' ');
  txt = txt.replace(/\n{3,}/g, '\n\n');
  return txt.trim();
}

function summarize(text: string, maxChars = 280): string {
  const normalized = text.trim();
  if (!normalized) return '';
  if (normalized.length <= maxChars) return normalized;
  const paragraphs = normalized
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);
  const first = paragraphs[0] || normalized;
  if (first.length <= maxChars) return first;
  return first.slice(0, maxChars).trimEnd() + '…';
}

// Convert Post to SearchablePost
export function postToSearchable(post: Post): SearchablePost {
  const bodyPlain = markdownToPlainText(post.body);

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
    excerpt:
      post.data?.excerpt ?? post.data?.description ?? summarize(bodyPlain, 280),
    category: post.data?.category ?? null,
    dateLabel: post.date
      ? post.date.toLocaleDateString('id-ID', { dateStyle: 'medium' })
      : null,
    content: bodyPlain,
    heroSrc,
  };
}
