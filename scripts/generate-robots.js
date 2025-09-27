#!/usr/bin/env node

import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Basic .env loader so this script respects root .env in local/dev
function loadEnvFromFile(filePath) {
  try {
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    content.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      // Strip surrounding quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key && !(key in process.env)) {
        process.env[key] = value;
      }
    });
  } catch (_) {}
}

// Attempt to load from .env in project root
loadEnvFromFile(join(process.cwd(), '.env'));

// Get site URL and domain from environment variables (with sensible defaults)
const siteUrl = process.env.SITE_URL || 'https://erland.me';
const siteDomain = process.env.SITE_DOMAIN || 'erland.me';

const isProd = siteUrl === 'https://erland.me' && siteDomain === 'erland.me';

const robotsContent = isProd
  ? `User-agent: *
Allow: /

# Sitemap
Sitemap: ${siteUrl}/sitemap-index.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Disallow admin or private areas (if any)
Disallow: /admin/
Disallow: /private/
Disallow: /_astro/

# Allow all other content
Allow: /blog/
Allow: /download/
Allow: /portfolio/
Allow: /portfolio/web-development/
Allow: /portfolio/cloud-infra/
Allow: /portfolio/personal-projects/
`
  : `User-agent: *
Disallow: /
`;

// Write robots.txt to public directory
const robotsPath = join(process.cwd(), 'public', 'robots.txt');
writeFileSync(robotsPath, robotsContent);

console.log(
  `✅ Generated robots.txt for ${isProd ? 'production' : 'staging/testing'} (site URL: ${siteUrl})`
);
