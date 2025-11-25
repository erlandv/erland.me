// ESM script to generate robots.txt without ts-node

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv, resolveMode, isProd as isProdMode } from './utils/env.mjs';

loadEnv();

const mode = resolveMode();
const isProd = isProdMode(mode);

const defaults = isProd
  ? { siteUrl: 'https://erland.me', siteDomain: 'erland.me' }
  : { siteUrl: 'http://localhost:4321', siteDomain: 'localhost' };

const siteUrl = process.env.SITE_URL || defaults.siteUrl;
const siteDomain = process.env.SITE_DOMAIN || defaults.siteDomain;

const robotsContent = isProd
  ? `User-agent: *
Allow: /

# Sitemap
Sitemap: ${siteUrl}/sitemap_index.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Allow all other content
Allow: /blog/
Allow: /download/
Allow: /portfolio/
Allow: /portfolio/web-development/
Allow: /portfolio/cloud-infra/
Allow: /portfolio/personal-projects/
Allow: /privacy-policy/
`
  : `User-agent: *
Disallow: /
`;

const robotsPath = join(process.cwd(), 'public', 'robots.txt');
writeFileSync(robotsPath, robotsContent);

console.log(
  `Generated robots.txt for ${isProd ? 'production' : 'staging/testing'} (site URL: ${siteUrl})`,
);
