// ESM script to generate search-index.json without ts-node

import { readdir, readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { markdownToPlainText, summarize } from '../src/lib/search-utils.js';

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

    const plain = markdownToPlainText(body);
    const excerpt = pickExcerpt(data, plain);
    // Truncate content to first 1000 chars for search performance
    // Full article text not needed for fuzzy search
    const content = plain.slice(0, 1000);

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
