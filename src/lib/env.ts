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

// Google AdSense client ID (public)
// Use `PUBLIC_ADSENSE_CLIENT` to expose to client bundles
export const ADSENSE_CLIENT: string =
  (import.meta as any).env?.PUBLIC_ADSENSE_CLIENT ||
  process.env.PUBLIC_ADSENSE_CLIENT ||
  '';

// AdSense slots for blog pages
export const ADSENSE_SLOT_BLOG_MID: string =
  (import.meta as any).env?.PUBLIC_ADSENSE_SLOT_BLOG_MID ||
  process.env.PUBLIC_ADSENSE_SLOT_BLOG_MID ||
  '';
export const ADSENSE_SLOT_BLOG_END: string =
  (import.meta as any).env?.PUBLIC_ADSENSE_SLOT_BLOG_END ||
  process.env.PUBLIC_ADSENSE_SLOT_BLOG_END ||
  '';

// AdSense slots for download pages
export const ADSENSE_SLOT_DL_MID: string =
  (import.meta as any).env?.PUBLIC_ADSENSE_SLOT_DL_MID ||
  process.env.PUBLIC_ADSENSE_SLOT_DL_MID ||
  '';
export const ADSENSE_SLOT_DL_END: string =
  (import.meta as any).env?.PUBLIC_ADSENSE_SLOT_DL_END ||
  process.env.PUBLIC_ADSENSE_SLOT_DL_END ||
  '';

// Ahrefs Web Analytics data-key (public)
export const AHREFS_DATA_KEY: string =
  (import.meta as any).env?.PUBLIC_AHREFS_DATA_KEY ||
  process.env.PUBLIC_AHREFS_DATA_KEY ||
  '';
