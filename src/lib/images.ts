/**
 * Image utilities for hero and Open Graph/JSON-LD usage.
 * - resolveHero: normalize optional hero from frontmatter schema(image()) to a stable type.
 * - getOgImageUrl: produce an optimized asset URL suitable for meta tags and JSON-LD.
 * - Responsive image configuration helpers for consistent sizing across components.
 */

import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

/**
 * Normalize optional hero metadata.
 * Frontmatter already validated with schema image() so when present it's ImageMetadata.
 */
export function resolveHero(hero?: ImageMetadata | null): ImageMetadata | null {
  return hero ?? null;
}

/**
 * Generate optimized image URL for Open Graph / JSON-LD.
 * Returns a site-root relative URL (e.g., "/_astro/hero-1200.avif") that will be prefixed by SITE_URL inside seo utils.
 *
 * @param hero       ImageMetadata from content schema
 * @param targetWidth Default 1200px to match common OG dimensions (1200x630). Height auto-preserves aspect ratio.
 * @param preferFormat Default "avif" as requested; fallbacks may be applied by consumers if needed.
 */
export async function getOgImageUrl(
  hero: ImageMetadata,
  targetWidth = 1200,
  preferFormat: 'avif' | 'webp' = 'avif'
): Promise<string> {
  const optimized = await getImage({
    src: hero,
    width: targetWidth,
    format: preferFormat,
  });
  return optimized.src;
}

/**
 * Convenience helper to produce multiple formats if needed by callers.
 */
export async function getOgImageUrls(
  hero: ImageMetadata,
  targetWidth = 1200
): Promise<{ avif: string; webp: string }> {
  const [avif, webp] = await Promise.all([
    getImage({ src: hero, width: targetWidth, format: 'avif' }),
    getImage({ src: hero, width: targetWidth, format: 'webp' }),
  ]);
  return { avif: avif.src, webp: webp.src };
}

/**
 * Responsive image configuration for hero images.
 * Matches CSS: .hero-image uses clamp(220px, 45vw, 320px) on desktop, clamp(180px, 60vw, 320px) on mobile (<640px)
 *
 * @returns Configuration object with widths and sizes for Astro Image component
 */
export function getHeroImageConfig() {
  return {
    // Cover common densities: 1x (180-320px), 1.5x (270-480px), 2x (360-640px)
    widths: [180, 220, 270, 320, 480, 640],
    // Match CSS breakpoints: mobile (60vw max 320px), desktop (45vw max 320px)
    sizes: '(max-width: 640px) min(60vw, 320px), min(45vw, 320px)',
  };
}

/**
 * Responsive image configuration for post card thumbnails.
 * Matches PostCard CSS: ~128px on desktop, ~260px on mobile
 *
 * @returns Configuration object with widths and sizes for Astro Image component
 */
export function getCardImageConfig() {
  return {
    // 1x and 2x densities for mobile and desktop sizes
    widths: [128, 256, 260, 320],
    // Mobile gets larger thumbnail (~260px), desktop gets compact size (~128px)
    sizes: '(max-width: 600px) 260px, 128px',
  };
}

/**
 * Responsive image configuration for prose/content images.
 * Optimized for article content width with common breakpoints.
 *
 * @returns Configuration object with widths and sizes for Astro Image component
 */
export function getContentImageConfig() {
  return {
    // Cover mobile to desktop content width
    widths: [480, 720, 1024, 1280],
    // Max content width is typically 720px, but allow 100vw on smaller screens
    sizes: '(min-width: 720px) 720px, 100vw',
  };
}
