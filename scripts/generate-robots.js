#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { join } from 'path';

// Get site URL from environment variable
const siteUrl = process.env.SITE_URL || 'https://erland.me';

const robotsContent = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${siteUrl}/sitemap-index.xml
Sitemap: ${siteUrl}/sitemap-0.xml

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
`;

// Write robots.txt to public directory
const robotsPath = join(process.cwd(), 'public', 'robots.txt');
writeFileSync(robotsPath, robotsContent);

console.log(`✅ Generated robots.txt with site URL: ${siteUrl}`);
