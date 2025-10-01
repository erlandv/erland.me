import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

function loadEnvFromFile(filePath: string): void {
  try {
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
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
  } catch {
    // ignore
  }
}

// Attempt to load from .env in project root
loadEnvFromFile(join(process.cwd(), '.env'));

const siteUrl: string = process.env.SITE_URL || 'https://erland.me';
const siteDomain: string = process.env.SITE_DOMAIN || 'erland.me';

const isProd: boolean = siteUrl === 'https://erland.me' && siteDomain === 'erland.me';

const robotsContent: string = isProd
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

const robotsPath = join(process.cwd(), 'public', 'robots.txt');
writeFileSync(robotsPath, robotsContent);

console.log(
  `✅ Generated robots.txt for ${isProd ? 'production' : 'staging/testing'} (site URL: ${siteUrl})`
);

