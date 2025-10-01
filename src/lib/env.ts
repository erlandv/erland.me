// Centralized environment access for SSR and client
// Astro exposes public env via import.meta.env; server uses process.env.
// Use import.meta.env first, fallback to process.env for scripts.
export const SITE_URL: string =
  (import.meta as any).env?.SITE_URL ||
  process.env.SITE_URL ||
  'https://erland.me';

export const SITE_DOMAIN: string =
  (import.meta as any).env?.SITE_DOMAIN ||
  process.env.SITE_DOMAIN ||
  'erland.me';

export function isProdSite(): boolean {
  return SITE_URL === 'https://erland.me' && SITE_DOMAIN === 'erland.me';
}

// Google Tag Manager container ID (public, non-secret)
// Prefer `PUBLIC_GTM_ID` via `import.meta.env`, fall back to process.env for scripts.
export const GTM_ID: string =
  (import.meta as any).env?.PUBLIC_GTM_ID || process.env.PUBLIC_GTM_ID || '';
