/**
 * Image utilities for hero and Open Graph/JSON-LD usage.
 * - resolveHero: normalize optional hero from frontmatter schema(image()) to a stable type.
 * - getOgImageUrl: produce an optimized asset URL suitable for meta tags and JSON-LD.
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
