// ESM script to generate ads.txt without ts-node

import { writeFileSync, existsSync, readFileSync, unlinkSync } from 'node:fs';
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

// AdSense publisher/client ID, typically like "ca-pub-XXXXXXXXXXXXXXXX"
const rawClient = process.env.PUBLIC_ADSENSE_CLIENT || '';

// Derive pub ID for ads.txt: "pub-XXXXXXXXXXXXXXXX" (strip optional "ca-")
let pubId = '';
if (rawClient) {
  const match = rawClient.match(/(pub-\d{10,})/);
  pubId = match ? match[1] : rawClient.replace(/^ca-/, '');
}

const adsPath = join(process.cwd(), 'public', 'ads.txt');

if (!isProd) {
  // In non-production builds, ensure ads.txt is absent to avoid serving stale data
  try {
    if (existsSync(adsPath)) unlinkSync(adsPath);
  } catch {
    // ignore
  }
  console.log('Skipping ads.txt generation (non-production environment)');
  process.exit(0);
}

if (!pubId) {
  console.error(
    'PUBLIC_ADSENSE_CLIENT not set or invalid; cannot generate ads.txt'
  );
  process.exit(1);
}

// Google AdSense authorized sellers entry
// Official Google TAG ID: f08c47fec0942fa0
const adsContent = `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`;

writeFileSync(adsPath, adsContent);

console.log(
  `Generated ads.txt for production (publisher: ${pubId}) at ${adsPath}`
);
