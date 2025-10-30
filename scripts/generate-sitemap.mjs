#!/usr/bin/env node

/**
 * Custom sitemap generator for production environment only
 * Generates:
 * - sitemap_index.xml (main index)
 * - post-sitemap.xml (blog posts & downloads)
 * - page-sitemap.xml (static pages, categories, pagination)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = process.env.SITE_URL || 'https://erland.me';
const DIST_DIR = path.join(__dirname, '../dist');
const CONTENT_DIR = path.join(__dirname, '../src/content');

// Environment detection
const LOCAL_PATTERNS = /(localhost|127(?:\.\d+){3}|::1)/i;

function resolveMode() {
  const siteEnvRaw =
    process.env.PUBLIC_SITE_ENV ||
    process.env.SITE_ENV ||
    process.env.DEPLOYMENT_ENV ||
    '';
  const siteEnv = siteEnvRaw.trim().toLowerCase();
  if (siteEnv) {
    if (['production', 'prod', 'live'].includes(siteEnv)) return 'production';
    return 'preview';
  }

  const arg = process.argv.find(a => a.startsWith('--mode='));
  if (arg) {
    const value = arg.split('=')[1]?.trim().toLowerCase();
    if (value) return value;
  }

  const envMode =
    process.env.ASTRO_MODE || process.env.MODE || process.env.NODE_ENV || '';
  if (envMode) return envMode.toLowerCase();

  const url = process.env.SITE_URL || '';
  if (url && !LOCAL_PATTERNS.test(url)) {
    return 'production';
  }
  const domain = process.env.SITE_DOMAIN || '';
  if (domain && !LOCAL_PATTERNS.test(domain)) {
    return 'production';
  }

  return 'development';
}

const mode = resolveMode();
const forceProd =
  process.env.FORCE_PRODUCTION === 'true' ||
  process.argv.includes('--force-production');
const isProd = forceProd || mode === 'production';

// Pretty print XML with proper indentation
function formatXML(xml) {
  let formatted = '';
  let indent = '';
  const tab = '  ';

  xml.split(/>\s*</).forEach((node, index, arr) => {
    if (index > 0) {
      node = '<' + node;
    }
    if (index < arr.length - 1) {
      node = node + '>';
    }

    if (/^\/\w/.test(node) || /\/>$/.test(node)) {
      // Closing tag or self-closing
      indent = indent.substring(tab.length);
    }

    formatted += indent + node + '\n';

    if (/^<?\w[^>]*[^\/]>.*$/.test(node)) {
      // Opening tag
      indent += tab;
    }
  });

  return formatted.trim();
}

// Create XML declaration and urlset wrapper
function createURLSet(urls) {
  const urlEntries = urls
    .map(url => {
      const { loc, lastmod, changefreq, priority } = url;
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

// Create sitemap index
function createSitemapIndex(sitemaps) {
  const sitemapEntries = sitemaps
    .map(sitemap => {
      return `  <sitemap>
    <loc>${sitemap.loc}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;
}

// Get all HTML files recursively
async function getHTMLFiles(dir, baseDir = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip assets and other non-page directories
      if (!['assets', 'fonts', '_astro'].includes(entry.name)) {
        files.push(...(await getHTMLFiles(fullPath, baseDir)));
      }
    } else if (entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Convert file path to URL
function filePathToURL(filePath, distDir) {
  const relativePath = path.relative(distDir, filePath);
  let url = relativePath
    .replace(/\\/g, '/')
    .replace(/index\.html$/, '')
    .replace(/\.html$/, '/');

  if (!url.startsWith('/')) {
    url = '/' + url;
  }

  return SITE_URL + url;
}

// Determine page type and configuration
function getPageConfig(url) {
  const pathname = new URL(url).pathname;

  // Homepage
  if (pathname === '/') {
    return {
      type: 'page',
      priority: '1.0',
      changefreq: 'daily',
    };
  }

  // Blog posts (individual articles)
  if (
    pathname.startsWith('/blog/') &&
    !pathname.endsWith('/blog/') &&
    !pathname.includes('/page/') &&
    !pathname.includes('/category/')
  ) {
    return {
      type: 'post',
      priority: '0.8',
      changefreq: 'weekly',
    };
  }

  // Blog list and pagination
  if (pathname === '/blog/' || pathname.match(/^\/blog\/page\/\d+\/$/)) {
    return {
      type: 'page',
      priority: pathname === '/blog/' ? '0.9' : '0.85',
      changefreq: 'daily',
    };
  }

  // Category pages
  if (pathname.includes('/category/')) {
    return {
      type: 'page',
      priority: '0.7',
      changefreq: 'weekly',
    };
  }

  // Download pages (individual)
  if (pathname.startsWith('/download/') && !pathname.endsWith('/download/')) {
    return {
      type: 'post',
      priority: '0.8',
      changefreq: 'weekly',
    };
  }

  // Portfolio pages
  if (pathname.startsWith('/portfolio/')) {
    return {
      type: 'page',
      priority: pathname === '/portfolio/' ? '0.7' : '0.6',
      changefreq: 'monthly',
    };
  }

  // All other pages (privacy-policy, etc.)
  return {
    type: 'page',
    priority: '0.5',
    changefreq: 'monthly',
  };
}

const DATE_FIELDS = ['updatedDate', 'publishDate', 'date', 'modifiedDate'];

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function pickLatestDate(...dates) {
  return dates
    .filter(Boolean)
    .reduce((latest, current) => {
      if (!latest) return current;
      return current.valueOf() > latest.valueOf() ? current : latest;
    }, null);
}

async function findContentEntryFile(baseDir, slug) {
  const candidates = [
    path.join(baseDir, 'index.md'),
    path.join(baseDir, 'index.mdx'),
    path.join(baseDir, 'index.mdoc'),
    path.join(baseDir, `${slug}.md`),
    path.join(baseDir, `${slug}.mdx`),
    path.join(baseDir, `${slug}.mdoc`),
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Ignore missing files and continue checking candidates
    }
  }

  return null;
}

async function loadCollectionDates(collectionName, urlPrefix) {
  const collectionDir = path.join(CONTENT_DIR, collectionName);
  const map = new Map();

  let entries;
  try {
    entries = await fs.readdir(collectionDir, { withFileTypes: true });
  } catch {
    return map;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const slug = entry.name;
    const entryDir = path.join(collectionDir, slug);
    const contentFile = await findContentEntryFile(entryDir, slug);
    if (!contentFile) continue;

    try {
      const raw = await fs.readFile(contentFile, 'utf8');
      const { data } = matter(raw);
      if (data?.draft) continue;

      const candidateDates = DATE_FIELDS.map(field => parseDate(data?.[field]));
      const lastmodDate = pickLatestDate(...candidateDates);
      if (lastmodDate) {
        map.set(`${urlPrefix}${slug}/`, lastmodDate);
      }
    } catch {
      // Ignore parsing errors and continue with other entries
    }
  }

  return map;
}

async function buildContentDateIndex() {
  const index = new Map();
  const collections = [
    { name: 'blog', prefix: '/blog/' },
    { name: 'downloads', prefix: '/download/' },
  ];

  for (const { name, prefix } of collections) {
    const map = await loadCollectionDates(name, prefix);
    for (const [url, date] of map.entries()) {
      index.set(url, date);
    }
  }

  return index;
}

function getLatestLastmod(pages) {
  return pages.reduce((latest, page) => {
    const date = parseDate(page.lastmod);
    if (!date) return latest;
    if (!latest) return date;
    return date.valueOf() > latest.valueOf() ? date : latest;
  }, null);
}

async function generateSitemaps() {
  // Skip sitemap generation in non-production environments
  if (!isProd) {
    console.log('Skipping sitemap generation (non-production environment)');
    console.log(`Environment: ${mode}`);
    console.log('Sitemaps are only generated for production builds');
    return;
  }

  console.log('Generating sitemaps...');

  const nowDate = new Date();

  try {
    const contentDateIndex = await buildContentDateIndex();

    // Get all HTML files
    const htmlFiles = await getHTMLFiles(DIST_DIR);

    // Convert to URLs and categorize
    const allPages = await Promise.all(
      htmlFiles.map(async file => {
        const url = filePathToURL(file, DIST_DIR);
        const config = getPageConfig(url);
        const pathname = new URL(url).pathname;

        let lastmodDate = contentDateIndex.get(pathname) || null;
        if (!lastmodDate) {
          try {
            const stat = await fs.stat(file);
            if (stat?.mtime) {
              lastmodDate = stat.mtime;
            }
          } catch {
            // Ignore stat errors and fallback to current timestamp
          }
        }

        const lastmod = (lastmodDate || nowDate).toISOString();
        return {
          loc: url,
          lastmod,
          changefreq: config.changefreq,
          priority: config.priority,
          type: config.type,
        };
      })
    );

    // Filter out 404 and offline pages from sitemap
    const validPages = allPages.filter(page => {
      const pathname = new URL(page.loc).pathname;
      return !pathname.includes('/404') && pathname !== '/offline/';
    });

    // Split into posts and pages
    const posts = validPages.filter(page => page.type === 'post');
    const pages = validPages.filter(page => page.type === 'page');

    console.log(`Found ${posts.length} posts and ${pages.length} pages`);

    const latestPostLastmod = getLatestLastmod(posts) || nowDate;
    const latestPageLastmod = getLatestLastmod(pages) || nowDate;

    // Generate post-sitemap.xml
    const postSitemapContent = createURLSet(posts);
    await fs.writeFile(
      path.join(DIST_DIR, 'post-sitemap.xml'),
      postSitemapContent,
      'utf8'
    );
    console.log('Generated post-sitemap.xml');

    // Generate page-sitemap.xml
    const pageSitemapContent = createURLSet(pages);
    await fs.writeFile(
      path.join(DIST_DIR, 'page-sitemap.xml'),
      pageSitemapContent,
      'utf8'
    );
    console.log('Generated page-sitemap.xml');

    // Generate sitemap_index.xml
    const sitemapIndex = createSitemapIndex([
      {
        loc: `${SITE_URL}/post-sitemap.xml`,
        lastmod: latestPostLastmod.toISOString(),
      },
      {
        loc: `${SITE_URL}/page-sitemap.xml`,
        lastmod: latestPageLastmod.toISOString(),
      },
    ]);
    await fs.writeFile(
      path.join(DIST_DIR, 'sitemap_index.xml'),
      sitemapIndex,
      'utf8'
    );
    console.log('Generated sitemap_index.xml');

    console.log('Sitemaps generated successfully!');
    console.log('Main index: sitemap_index.xml');
    console.log('Posts: post-sitemap.xml');
    console.log('Pages: page-sitemap.xml');
  } catch (error) {
    console.error('Error generating sitemaps:', error);
    process.exit(1);
  }
}

generateSitemaps();
