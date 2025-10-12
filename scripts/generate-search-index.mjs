// ESM script to generate search-index.json without ts-node

import { readdir, readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const BLOG_DIR = path.resolve('src/content/blog');
const OUTPUT_DIR = path.resolve('public');
const OUTPUT_PATH = path.resolve(OUTPUT_DIR, 'search-index.json');

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function listBlogEntries() {
  const entries = [];
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

function stripMarkdown(md) {
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

function summarize(text, maxChars = 800) {
  const normalized = text.trim();
  if (!normalized) return '';
  const paras = normalized
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);
  const first = paras[0] || normalized;
  if (first.length <= maxChars) return first;
  return first.slice(0, maxChars).trimEnd() + '…';
}

function toDateLabel(input) {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d.valueOf())) return null;
  try {
    return d.toLocaleDateString('id-ID', { dateStyle: 'medium' });
  } catch {
    // Fallback
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy}`;
  }
}

function pickExcerpt(data, bodyPlain) {
  const fallback = summarize(bodyPlain, 280);
  const excerpt =
    typeof data['excerpt'] === 'string' ? data['excerpt'].trim() : '';
  if (excerpt) return excerpt;
  const description =
    typeof data['description'] === 'string' ? data['description'].trim() : '';
  if (description) return description;
  return fallback;
}

async function buildIndex() {
  const entries = await listBlogEntries();
  const out = [];

  for (const { slug, file } of entries) {
    const raw = await readFile(file, 'utf8');
    const parsed = matter(raw);
    const data = parsed.data ?? {};
    const body = parsed.content ?? '';
    const title = data['title'] || '';
    const category = data['category'] || null;
    const dateLabel = toDateLabel(data['publishDate']);

    const plain = stripMarkdown(body);
    const excerpt = pickExcerpt(data, plain);
    const content = plain;

    const item = {
      slug,
      title,
      excerpt,
      category,
      dateLabel,
      content,
    };

    // Draft filtering
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

main().catch(err => {
  console.error('Failed to generate search index:', err);
  process.exitCode = 1;
});
