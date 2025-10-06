import { readdir, readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';

type SearchIndexItem = {
  slug: string;
  title: string;
  excerpt: string;
  category?: string | null;
  dateLabel?: string | null;
  content: string;
  heroSrc?: string | null;
};

const BLOG_DIR = path.resolve('src/content/blog');
const OUTPUT_DIR = path.resolve('public');
const OUTPUT_PATH = path.resolve(OUTPUT_DIR, 'search-index.json');

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function listBlogEntries(): Promise<Array<{ slug: string; file: string }>> {
  const entries: Array<{ slug: string; file: string }> = [];
  const dirs = await readdir(BLOG_DIR, { withFileTypes: true });
  for (const dirent of dirs) {
    if (dirent.isDirectory()) {
      const slug = dirent.name;
      const file = path.join(BLOG_DIR, slug, 'index.md');
      if (await exists(file)) {
        entries.push({ slug, file });
      }
    }
  }
  return entries;
}

function parseFrontmatter(raw: string): { data: Record<string, any>; body: string } {
  let data: Record<string, any> = {};
  let body = raw;

  if (raw.startsWith('---')) {
    const end = raw.indexOf('\n---');
    if (end !== -1) {
      const fm = raw.slice(3, end).trim();
      body = raw.slice(end + '\n---'.length).trim();

      const lines = fm.split('\n');
      for (const line of lines) {
        const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
        if (m) {
          const key = m[1];
          let value = m[2].trim();
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          data[key] = value;
        }
      }
    }
  }

  return { data, body };
}

function stripMarkdown(md: string): string {
  let txt = md;
  // Remove code fences
  txt = txt.replace(/```[\s\S]*?```/g, '');
  // Remove HTML tags
  txt = txt.replace(/<[^>]+>/g, '');
  // Remove images ![alt](url)
  txt = txt.replace(/!\[[^\]]*\]\([^)]+\)/g, '');
  // Replace links [text](url) -> text
  txt = txt.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Remove headings markers
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

function summarize(text: string, maxChars = 800): string {
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const first = paras[0] || text;
  if (first.length <= maxChars) return first;
  return first.slice(0, maxChars) + '…';
}

function toDateLabel(input: string | undefined): string | null {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d.valueOf())) return null;
  try {
    return d.toLocaleDateString('id-ID', { dateStyle: 'medium' } as any);
  } catch {
    // Fallback
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy}`;
  }
}

function pickExcerpt(data: Record<string, any>, bodyPlain: string): string {
  const fallback = summarize(bodyPlain, 280);
  return (data['excerpt'] as string) || (data['description'] as string) || fallback;
}

async function buildIndex(): Promise<SearchIndexItem[]> {
  const entries = await listBlogEntries();
  const out: SearchIndexItem[] = [];

  for (const { slug, file } of entries) {
    const raw = await readFile(file, 'utf8');
    const { data, body } = parseFrontmatter(raw);
    const title = (data['title'] as string) || '';
    const category = (data['category'] as string) || null;
    const dateLabel = toDateLabel(data['publishDate'] as string | undefined);

    const plain = stripMarkdown(body);
    const excerpt = pickExcerpt(data, plain);
    const content = summarize(plain, 1000); // ringkas untuk payload

    const item: SearchIndexItem = {
      slug,
      title,
      excerpt,
      category,
      dateLabel,
      content,
      heroSrc: null, // optional; biarkan null agar komponen menampilkan tanpa thumb bila tidak tersedia
    };

    // Draft filtering: jika ada draft: true, skip
    const draftVal = `${data['draft'] || ''}`.toLowerCase();
    const isDraft = draftVal === 'true';
    if (!isDraft) {
      out.push(item);
    }
  }

  return out;
}

async function main() {
  if (!(await exists(OUTPUT_DIR))) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }
  const items = await buildIndex();
  const json = JSON.stringify(items, null, 2);
  await writeFile(OUTPUT_PATH, json, 'utf8');
  console.log(`Search index written: ${OUTPUT_PATH} (${items.length} items)`);
}

main().catch((err) => {
  console.error('Failed to generate search index:', err);
  process.exitCode = 1;
});