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

/**
 * Resolve environment mode from various sources
 * Matches logic from src/lib/env.ts for consistency
 * @returns {'development' | 'production' | 'staging'}
 */
export function resolveMode() {
  const siteEnv = process.env.PUBLIC_SITE_ENV;

  // Explicit environment override takes highest priority
  if (siteEnv) {
    const normalized = siteEnv.trim().toLowerCase();
    if (normalized === 'production') {
      return 'production';
    }
    if (normalized === 'staging') {
      return 'staging';
    }
    return 'development';
  }

  // Check for local development indicators
  const siteUrl = process.env.SITE_URL || '';
  const siteDomain = process.env.SITE_DOMAIN || '';

  // If using localhost or development URLs, prefer development mode
  if (LOCAL_PATTERNS.test(siteUrl) || LOCAL_PATTERNS.test(siteDomain)) {
    return 'development';
  }

  // Fallback to NODE_ENV or production URL detection
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production' && siteUrl.includes('erland.me')) {
    return 'production';
  }

  // Default to development for local builds
  return 'development';
}

/**
 * Check if current mode is production
 * @param {string} [mode] - Optional mode override
 * @returns {boolean}
 */
export function isProd(mode = resolveMode()) {
  return mode === 'production';
}
