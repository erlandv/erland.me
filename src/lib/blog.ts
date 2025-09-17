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
  const modules = import.meta.glob('../posts/blog/*/index.md');
  const heroMap = import.meta.glob('../posts/blog/*/hero.{jpg,jpeg,png,webp,gif,svg}', {
    as: 'url',
    eager: true,
  });

  const entries = Object.entries(modules) as Array<[string, () => Promise<any>]>;
  const posts: Post[] = [];
  for (const [path, loader] of entries) {
    const mod = await loader();
    const parts = path.split('/');
    const slug = parts[parts.length - 2];
    const hero = (Object.entries(heroMap).find(([p]) => p.startsWith(`../posts/blog/${slug}/hero.`))?.[1] as
      | string
      | undefined) as string | undefined;
    posts.push({
      slug,
      data: mod.frontmatter ?? {},
      date: safeDate(mod.frontmatter?.publishDate),
      hero,
      Content: mod.default,
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

