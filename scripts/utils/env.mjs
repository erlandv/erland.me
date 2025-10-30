import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const LOCAL_PATTERNS = /(localhost|127(?:\.\d+){3}|::1)/i;

export function loadEnv(filePath = join(process.cwd(), '.env')) {
  try {
    if (!filePath || !existsSync(filePath)) return;
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

export function resolveMode() {
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

export function isProd(mode = resolveMode()) {
  const forceProd =
    process.env.FORCE_PRODUCTION === 'true' ||
    process.argv.includes('--force-production');
  return forceProd || mode === 'production';
}

