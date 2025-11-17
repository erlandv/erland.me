// Centralized environment access for SSR and client
// Astro exposes public env via import.meta.env; server uses process.env.
// Use import.meta.env first, fallback to process.env for scripts.

import { z } from 'zod';

interface ImportMetaEnv {
  SITE_URL?: string;
  SITE_DOMAIN?: string;
  PUBLIC_SITE_ENV?: string;
  PUBLIC_GTM_ID?: string;
  PUBLIC_ADSENSE_CLIENT?: string;
  PUBLIC_ADSENSE_SLOT_BLOG_MID?: string;
  PUBLIC_ADSENSE_SLOT_BLOG_END?: string;
  PUBLIC_ADSENSE_SLOT_DL_MID?: string;
  PUBLIC_ADSENSE_SLOT_DL_END?: string;
  PUBLIC_AHREFS_DATA_KEY?: string;
  PROD?: boolean;
}

// Environment validation schema
const envSchema = z.object({
  // Core site configuration (required)
  SITE_URL: z
    .string()
    .url('SITE_URL must be a valid URL')
    .default('http://localhost:4321'),
  SITE_DOMAIN: z
    .string()
    .min(1, 'SITE_DOMAIN cannot be empty')
    .refine(
      val => {
        // Allow localhost and IP addresses for development
        if (
          /^127\.0\.0\.1(:\d+)?$/.test(val) ||
          /^localhost(:\d+)?$/.test(val)
        ) {
          return true;
        }
        // Require proper domain format for others
        return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(val);
      },
      {
        message:
          'SITE_DOMAIN must be a valid domain (or localhost for development)',
      }
    )
    .default('localhost'),

  // Site environment indicator
  PUBLIC_SITE_ENV: z
    .enum(['production', 'staging', 'development', 'preview'])
    .default('development'),

  // Analytics & tracking (optional for development)
  PUBLIC_GTM_ID: z
    .string()
    .regex(/^GTM-[A-Z0-9]+$/, 'PUBLIC_GTM_ID must match GTM-XXXXXXXX format')
    .or(z.literal(''))
    .optional(),

  // AdSense configuration (optional)
  PUBLIC_ADSENSE_CLIENT: z
    .string()
    .regex(
      /^ca-pub-\d+$/,
      'PUBLIC_ADSENSE_CLIENT must match ca-pub-XXXXXXXXXX format'
    )
    .or(z.literal(''))
    .optional(),

  PUBLIC_ADSENSE_SLOT_BLOG_MID: z
    .string()
    .regex(/^\d+$/, 'AdSense slot must be numeric')
    .or(z.literal(''))
    .optional(),

  PUBLIC_ADSENSE_SLOT_BLOG_END: z
    .string()
    .regex(/^\d+$/, 'AdSense slot must be numeric')
    .or(z.literal(''))
    .optional(),

  PUBLIC_ADSENSE_SLOT_DL_MID: z
    .string()
    .regex(/^\d+$/, 'AdSense slot must be numeric')
    .or(z.literal(''))
    .optional(),

  PUBLIC_ADSENSE_SLOT_DL_END: z
    .string()
    .regex(/^\d+$/, 'AdSense slot must be numeric')
    .or(z.literal(''))
    .optional(),

  // Ahrefs analytics (optional)
  PUBLIC_AHREFS_DATA_KEY: z
    .union([z.string().min(1), z.literal('')])
    .optional(),
});

type ValidatedEnv = z.infer<typeof envSchema>;

// Export type for external use
export type { ValidatedEnv };

// Cache for validated environment
const validatedEnvCache: { [key: string]: ValidatedEnv } = {};
let validationError: Error | null = null;

/**
 * Validate environment variables against schema
 * @param mode - Environment mode for conditional validation
 * @returns Validated environment object
 */
function validateEnv(
  mode: 'development' | 'production' | 'staging' = 'development'
): ValidatedEnv {
  // Return cached result if validation already succeeded for this mode
  if (validatedEnvCache[mode]) return validatedEnvCache[mode];

  // Re-throw cached validation error if validation failed
  if (validationError) throw validationError;

  try {
    // Collect environment variables from both sources
    const rawEnv = {
      SITE_URL:
        (import.meta as ImportMeta).env?.SITE_URL || process.env.SITE_URL,
      SITE_DOMAIN:
        (import.meta as ImportMeta).env?.SITE_DOMAIN || process.env.SITE_DOMAIN,
      PUBLIC_SITE_ENV:
        (import.meta as ImportMeta).env?.PUBLIC_SITE_ENV ||
        process.env.PUBLIC_SITE_ENV,
      PUBLIC_GTM_ID:
        (import.meta as ImportMeta).env?.PUBLIC_GTM_ID ||
        process.env.PUBLIC_GTM_ID,
      PUBLIC_ADSENSE_CLIENT:
        (import.meta as ImportMeta).env?.PUBLIC_ADSENSE_CLIENT ||
        process.env.PUBLIC_ADSENSE_CLIENT,
      PUBLIC_ADSENSE_SLOT_BLOG_MID:
        (import.meta as ImportMeta).env?.PUBLIC_ADSENSE_SLOT_BLOG_MID ||
        process.env.PUBLIC_ADSENSE_SLOT_BLOG_MID,
      PUBLIC_ADSENSE_SLOT_BLOG_END:
        (import.meta as ImportMeta).env?.PUBLIC_ADSENSE_SLOT_BLOG_END ||
        process.env.PUBLIC_ADSENSE_SLOT_BLOG_END,
      PUBLIC_ADSENSE_SLOT_DL_MID:
        (import.meta as ImportMeta).env?.PUBLIC_ADSENSE_SLOT_DL_MID ||
        process.env.PUBLIC_ADSENSE_SLOT_DL_MID,
      PUBLIC_ADSENSE_SLOT_DL_END:
        (import.meta as ImportMeta).env?.PUBLIC_ADSENSE_SLOT_DL_END ||
        process.env.PUBLIC_ADSENSE_SLOT_DL_END,
      PUBLIC_AHREFS_DATA_KEY:
        (import.meta as ImportMeta).env?.PUBLIC_AHREFS_DATA_KEY ||
        process.env.PUBLIC_AHREFS_DATA_KEY,
    };

    // Apply mode-specific validation rules
    if (mode === 'production') {
      // Production requires GTM and AdSense for analytics
      const productionSchema = z.object({
        ...envSchema.shape,
        PUBLIC_GTM_ID: z
          .string()
          .regex(/^GTM-[A-Z0-9]+$/, 'GTM ID is required for production'),
        PUBLIC_ADSENSE_CLIENT: z
          .string()
          .regex(/^ca-pub-\d+$/, 'AdSense client is required for production'),
      });

      const result = productionSchema.parse(rawEnv);
      validatedEnvCache[mode] = result;
      return result;
    }

    // Validate and cache result
    const result = envSchema.parse(rawEnv);
    validatedEnvCache[mode] = result;
    return result;
  } catch (error) {
    const validationErr = new Error(
      `Environment validation failed: ${
        error instanceof z.ZodError
          ? error.errors
              .map(e => `${e.path.join('.')}: ${e.message}`)
              .join(', ')
          : String(error)
      }`
    );

    validationError = validationErr;
    throw validationErr;
  }
}

/**
 * Get environment mode from various sources
 */
function resolveEnvironmentMode(): 'development' | 'production' | 'staging' {
  const siteEnv =
    (import.meta as ImportMeta).env?.PUBLIC_SITE_ENV ||
    process.env.PUBLIC_SITE_ENV;

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
  const siteUrl =
    (import.meta as ImportMeta).env?.SITE_URL || process.env.SITE_URL;
  const siteDomain =
    (import.meta as ImportMeta).env?.SITE_DOMAIN || process.env.SITE_DOMAIN;

  // If using localhost or development URLs, prefer development mode
  if (
    siteUrl &&
    (siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1'))
  ) {
    return 'development';
  }
  if (
    siteDomain &&
    (siteDomain === 'localhost' || siteDomain.includes('127.0.0.1'))
  ) {
    return 'development';
  }

  // Fallback to NODE_ENV or production URL detection
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production' && siteUrl && siteUrl.includes('erland.me')) {
    return 'production';
  }

  // Default to development for local builds
  return 'development';
}

// Validate environment on module load
const currentMode = resolveEnvironmentMode();
const validatedEnv = validateEnv(currentMode);

interface ImportMeta {
  env?: ImportMetaEnv;
}

// Type-safe environment exports using validated values
export const SITE_URL: string = validatedEnv.SITE_URL;
export const SITE_DOMAIN: string = validatedEnv.SITE_DOMAIN;

export function isProdSite(): boolean {
  // Check actual environment variables, not cached values from validation
  const actualSiteUrl =
    (import.meta as ImportMeta).env?.SITE_URL ||
    (typeof process !== 'undefined' ? process.env.SITE_URL : undefined);
  const actualSiteDomain =
    (import.meta as ImportMeta).env?.SITE_DOMAIN ||
    (typeof process !== 'undefined' ? process.env.SITE_DOMAIN : undefined);

  // If no env vars set, check if current mode resolved to production
  if (!actualSiteUrl && !actualSiteDomain) {
    return currentMode === 'production';
  }

  return (
    actualSiteUrl === 'https://erland.me' && actualSiteDomain === 'erland.me'
  );
}

// Google Tag Manager container ID (public, non-secret)
export const GTM_ID: string = validatedEnv.PUBLIC_GTM_ID || '';

// Google AdSense client ID (public)
export const ADSENSE_CLIENT: string = validatedEnv.PUBLIC_ADSENSE_CLIENT || '';

// AdSense slots for blog pages
export const ADSENSE_SLOT_BLOG_MID: string =
  validatedEnv.PUBLIC_ADSENSE_SLOT_BLOG_MID || '';
export const ADSENSE_SLOT_BLOG_END: string =
  validatedEnv.PUBLIC_ADSENSE_SLOT_BLOG_END || '';

// AdSense slots for download pages
export const ADSENSE_SLOT_DL_MID: string =
  validatedEnv.PUBLIC_ADSENSE_SLOT_DL_MID || '';
export const ADSENSE_SLOT_DL_END: string =
  validatedEnv.PUBLIC_ADSENSE_SLOT_DL_END || '';

// Ahrefs Web Analytics data-key (public)
export const AHREFS_DATA_KEY: string =
  validatedEnv.PUBLIC_AHREFS_DATA_KEY || '';

// Export validation functions for external use
export { validateEnv, resolveEnvironmentMode };
