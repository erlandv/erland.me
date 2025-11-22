// ESM script to generate ads.txt without ts-node

import { writeFileSync, existsSync, unlinkSync } from 'node:fs';
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
  // PUBLIC_ADSENSE_CLIENT is optional - skip generation if not configured
  try {
    if (existsSync(adsPath)) unlinkSync(adsPath);
  } catch {
    // ignore
  }
  console.log(
    'Skipping ads.txt generation (PUBLIC_ADSENSE_CLIENT not configured)'
  );
  process.exit(0);
}

// Google AdSense authorized sellers entry
// Official Google TAG ID: f08c47fec0942fa0
const adsContent = `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`;

writeFileSync(adsPath, adsContent);

console.log(
  `Generated ads.txt for production (publisher: ${pubId}) at ${adsPath}`
);
