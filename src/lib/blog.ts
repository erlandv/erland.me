import { getCollection } from 'astro:content';

export type Post = {
  slug: string;
  data: any;
  date: Date | null;
  hero?: string;
  Content: any;
};

const safeDate = (value: unknown): Date | null => {
  if (!value) return null;
  const d = new Date(value as any);
  return isNaN(d.valueOf()) ? null : d;
};

export async function loadAllPosts(): Promise<Post[]> {
  const entries = await getCollection('blog');
  const heroMap = import.meta.glob('../content/blog/*/hero.{jpg,jpeg,png,webp,gif,svg}', {
    as: 'url',
    eager: true,
  });

  const posts: Post[] = [];
  for (const entry of entries) {
    const { Content } = await entry.render();
    const hero = (Object.entries(heroMap).find(([p]) => p.startsWith(`../content/blog/${entry.slug}/hero.`))?.[1] as
      | string
      | undefined) as string | undefined;
    posts.push({
      slug: entry.slug,
      data: entry.data,
      date: safeDate(entry.data?.publishDate),
      hero,
      Content,
    });
  }

  return posts
    .filter((p) => !p.data?.draft)
    .sort((a, b) => (b.date?.valueOf() ?? 0) - (a.date?.valueOf() ?? 0));
}

export async function getTotalPages(pageSize = 10): Promise<number> {
  const total = (await loadAllPosts()).length;
  return Math.max(1, Math.ceil(total / pageSize));
}

export function slicePage<T>(arr: T[], page: number, pageSize = 10): T[] {
  return arr.slice((page - 1) * pageSize, page * pageSize);
}
