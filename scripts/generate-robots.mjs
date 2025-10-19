// ESM script to generate robots.txt without ts-node

import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

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
  `Generated robots.txt for ${isProd ? 'production' : 'staging/testing'} (site URL: ${siteUrl})`
);
