/**
 * Image Utilities for Hero and Open Graph Optimization
 *
 * Provides type-safe helpers for image handling across the site with
 * optimized configurations for different use cases (hero, cards, content).
 *
 * **Features:**
 * - Hero image normalization from frontmatter schema
 * - Open Graph/JSON-LD optimized image URLs
 * - Responsive image configurations matching CSS breakpoints
 * - Multi-format support (AVIF, WebP) with fallbacks
 * - Density-aware srcsets (1x, 1.5x, 2x)
 *
 * **Use Cases:**
 * - Hero images: Profile, post headers (180-640px range)
 * - Card thumbnails: Post listings (128-320px range)
 * - Content images: Article prose (480-1280px range)
 * - Open Graph: Social sharing previews (1200px optimal)
 *
 * **Usage:**
 * ```astro
 * ---
 * import { Image } from 'astro:assets';
 * import { resolveHero, getOgImageUrl, getHeroImageConfig } from './lib/images';
 *
 * const hero = resolveHero(frontmatter.hero);
 * const ogUrl = hero ? await getOgImageUrl(hero, 1200, 'avif') : null;
 * const heroConfig = getHeroImageConfig();
 * ---
 *
 * {hero && (
 *   <Image src={hero} alt="Hero" {...heroConfig} />
 * )}
 * ```
 */

import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

/**
 * Default hero image path for fallback
 * Used when content doesn't have a custom hero image
 */
export const DEFAULT_HERO_PATH = '/assets/content/hero-default.png';

/**
 * Union type for hero image sources.
 * - `string`: absolute URL pointing to R2 (e.g. https://img.erland.me/blog/slug/hero.png)
 * - `ImageMetadata`: local file processed by Astro (legacy / during transition)
 */
export type HeroSource = string | ImageMetadata;

/**
 * Type guard — returns true if the hero is a remote URL string (R2).
 */
export function isRemoteHero(hero: HeroSource | null): hero is string {
  return typeof hero === 'string';
}

/**
 * Normalize optional hero image to stable type.
 *
 * @param hero - Optional hero from frontmatter (now always string URL after R2 migration)
 * @returns HeroSource if present, null otherwise
 */
export function resolveHero(hero?: HeroSource | null): HeroSource | null {
  return hero ?? null;
}

/**
 * Check if hero image exists
 */
export function hasHeroImage(hero?: HeroSource | null): boolean {
  return hero != null;
}

/**
 * Generate optimized image URL for Open Graph and JSON-LD metadata.
 *
 * - Remote URL (R2): returned as-is — Astro cannot transform external images at build time.
 *   The image is already on Cloudflare's CDN, no local optimization needed.
 * - Local ImageMetadata: processed via Astro's getImage() as before.
 *
 * @param hero - HeroSource (string URL or ImageMetadata)
 * @param targetWidth - Target width in pixels (default: 1200)
 * @param preferFormat - Format preference (default: 'avif')
 * @returns Absolute-or-relative image URL string
 */
export async function getOgImageUrl(
  hero: HeroSource,
  targetWidth = 1200,
  preferFormat: 'avif' | 'webp' = 'avif',
): Promise<string> {
  if (isRemoteHero(hero)) {
    // Remote R2 URL — return as-is, already on Cloudflare CDN
    return hero;
  }
  // Local ImageMetadata — optimize via Astro
  const optimized = await getImage({
    src: hero,
    width: targetWidth,
    format: preferFormat,
  });
  return optimized.src;
}

/**
 * Generate multiple image format URLs for fallback support (local images only).
 * For remote images, returns the same URL for both formats.
 */
export async function getOgImageUrls(
  hero: HeroSource,
  targetWidth = 1200,
): Promise<{ avif: string; webp: string }> {
  if (isRemoteHero(hero)) {
    return { avif: hero, webp: hero };
  }
  const [avif, webp] = await Promise.all([
    getImage({ src: hero, width: targetWidth, format: 'avif' }),
    getImage({ src: hero, width: targetWidth, format: 'webp' }),
  ]);
  return { avif: avif.src, webp: webp.src };
}

/**
 * Get responsive image configuration for hero images
 *
 * **CSS Breakpoints Match:**
 * - Mobile (<640px): `clamp(180px, 60vw, 320px)` - responsive 60% viewport width
 * - Desktop (≥640px): `clamp(220px, 45vw, 320px)` - responsive 45% viewport width
 *
 * **Density Coverage:**
 * - 1x: 180-320px (standard displays)
 * - 1.5x: 270-480px (mid-density)
 * - 2x: 360-640px (Retina/high-DPI)
 *
 * @returns Configuration object with widths array and sizes attribute
 * @example
 * import { Image } from 'astro:assets';
 * const config = getHeroImageConfig();
 * <Image src={hero} alt="Hero" {...config} />
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
 * Get responsive image configuration for post card thumbnails
 *
 * **CSS Layout:**
 * - Mobile (≤600px): ~260px large thumbnail for better visibility
 * - Desktop (>600px): ~128px compact thumbnail for grid layouts
 *
 * **Density Coverage:**
 * - Mobile: 260px (1x), 320px (1.2x)
 * - Desktop: 128px (1x), 256px (2x)
 *
 * @returns Configuration object with widths array and sizes attribute
 * @example
 * import { Image } from 'astro:assets';
 * const config = getCardImageConfig();
 * <Image src={thumbnail} alt="Post thumbnail" {...config} />
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
 * Get responsive image configuration for prose/content images
 *
 * **Content Width Strategy:**
 * - Small screens: 100% viewport width (480-720px)
 * - Desktop (≥720px): Fixed 720px max content width
 *
 * **Density Coverage:**
 * - 480px: Mobile portrait
 * - 720px: Tablet/desktop 1x
 * - 1024px: Desktop 1.5x
 * - 1280px: Desktop 2x/Retina
 *
 * Optimized for article content images, gallery items, and embedded media.
 *
 * @returns Configuration object with widths array and sizes attribute
 * @example
 * import { Image } from 'astro:assets';
 * const config = getContentImageConfig();
 * <Image src={contentImage} alt="Article illustration" {...config} />
 */
export function getContentImageConfig() {
  return {
    // Cover mobile to desktop content width
    widths: [480, 720, 1024, 1280],
    // Max content width is typically 720px, but allow 100vw on smaller screens
    sizes: '(min-width: 720px) 720px, 100vw',
  };
}
