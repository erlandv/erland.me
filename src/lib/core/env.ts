/**
 * Environment Variable Validation & Access
 *
 * Centralized environment configuration with runtime validation and type safety.
 * Provides browser-safe access to environment variables with automatic mode detection.
 *
 * **Features:**
 * - Zod-based runtime validation with detailed error messages
 * - Browser-safe process.env access (guards against client-side errors)
 * - Automatic environment mode detection (development/staging/production)
 * - Type-safe exports for all environment variables
 * - Optional analytics configuration (ads only render when configured)
 *
 * **Environment Modes:**
 * - Development: Relaxed validation, analytics optional, localhost supported
 * - Production: Analytics optional - ads render only if CLIENT/SLOT configured
 * - Staging: Same as development, explicit override available
 *
 * **Mode Detection Priority:**
 * 1. PUBLIC_SITE_ENV explicit override
 * 2. Localhost detection (localhost/127.0.0.1 → development)
 * 3. Production URL + NODE_ENV (erland.me + production → production)
 * 4. Default fallback (development for safety)
 *
 * **Usage:**
 * ```typescript
 * import { SITE_URL, ADSENSE_CLIENT, isProdSite } from '@lib/core/env';
 *
 * const siteUrl = SITE_URL; // Type-safe, validated
 * if (isProdSite()) {
 *   // Production-only logic
 * }
 * ```
 *
 * **Environment Variables:**
 * - Core: SITE_URL, SITE_DOMAIN, PUBLIC_SITE_ENV
 * - Analytics (optional): PUBLIC_GTM_ID, PUBLIC_ADSENSE_CLIENT, PUBLIC_AHREFS_DATA_KEY
 * - AdSense (optional): PUBLIC_ADSENSE_SLOT_START, PUBLIC_ADSENSE_SLOT_END
 *
 * @module env
 */

import { z } from 'zod';

/**
 * Import.meta.env interface for Astro environment variables
 * @internal
 */
interface ImportMetaEnv {
  SITE_URL?: string;
  SITE_DOMAIN?: string;
  PUBLIC_SITE_ENV?: string;
  PUBLIC_GTM_ID?: string;
  PUBLIC_ADSENSE_CLIENT?: string;
  PUBLIC_ADSENSE_SLOT_START?: string;
  PUBLIC_ADSENSE_SLOT_END?: string;
  PUBLIC_AHREFS_DATA_KEY?: string;
  PROD?: boolean;
}

/**
 * Zod validation schema for environment variables
 * Defines structure, types, and validation rules for all env vars
 * @internal
 */
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

  PUBLIC_ADSENSE_SLOT_START: z
    .string()
    .regex(/^\d+$/, 'AdSense slot must be numeric')
    .or(z.literal(''))
    .optional(),

  PUBLIC_ADSENSE_SLOT_END: z
    .string()
    .regex(/^\d+$/, 'AdSense slot must be numeric')
    .or(z.literal(''))
    .optional(),

  // Ahrefs analytics (optional)
  PUBLIC_AHREFS_DATA_KEY: z
    .union([z.string().min(1), z.literal('')])
    .optional(),
});

/**
 * Type-safe environment variables inferred from Zod schema
 * @public
 */
type ValidatedEnv = z.infer<typeof envSchema>;

export type { ValidatedEnv };

/**
 * Cache for validated environment results per mode
 * Prevents redundant validation on repeated imports
 * @internal
 */
const validatedEnvCache: { [key: string]: ValidatedEnv } = {};

/**
 * Cached validation error to re-throw consistently
 * @internal
 */
let validationError: Error | null = null;

/**
 * Validate environment variables against Zod schema
 *
 * Applies uniform validation rules across all environments with optional analytics.
 * Analytics IDs (GTM, AdSense) are optional in all modes - ads only render when configured.
 *
 * Browser-safe: Checks for `window` to avoid accessing `process.env` client-side.
 * Results are cached per mode to prevent redundant validation.
 *
 * @param mode - Environment mode for conditional validation
 * @returns Validated and type-safe environment object
 * @throws {Error} Validation error with detailed field-level messages
 *
 * @example
 * ```typescript
 * const env = validateEnv('production');
 * console.log(env.SITE_URL); // https://erland.me
 * // AdSense optional: validation allows empty string for PUBLIC_ADSENSE_CLIENT.
 * // Note: If PUBLIC_ADSENSE_CLIENT is empty, validation passes but ad rendering logic will not render ads.
 * ```
 *
 * @internal
 */
function validateEnv(
  mode: 'development' | 'production' | 'staging' = 'development'
): ValidatedEnv {
  // Return cached result if validation already succeeded for this mode
  if (validatedEnvCache[mode]) return validatedEnvCache[mode];

  // Re-throw cached validation error if validation failed
  if (validationError) throw validationError;

  try {
    // Check if running in browser (client-side) or Node.js (server-side)
    const isBrowser = typeof window !== 'undefined';
    let processEnv: Record<string, string | undefined> = {};
    if (!isBrowser && typeof process !== 'undefined') {
      processEnv = process.env;
    }

    // Collect environment variables from both sources
    const rawEnv = {
      SITE_URL:
        (import.meta as ImportMeta).env?.SITE_URL || processEnv.SITE_URL,
      SITE_DOMAIN:
        (import.meta as ImportMeta).env?.SITE_DOMAIN || processEnv.SITE_DOMAIN,
      PUBLIC_SITE_ENV:
        (import.meta as ImportMeta).env?.PUBLIC_SITE_ENV ||
        processEnv.PUBLIC_SITE_ENV,
      PUBLIC_GTM_ID:
        (import.meta as ImportMeta).env?.PUBLIC_GTM_ID ||
        processEnv.PUBLIC_GTM_ID,
      PUBLIC_ADSENSE_CLIENT:
        (import.meta as ImportMeta).env?.PUBLIC_ADSENSE_CLIENT ||
        processEnv.PUBLIC_ADSENSE_CLIENT,
      PUBLIC_ADSENSE_SLOT_START:
        (import.meta as ImportMeta).env?.PUBLIC_ADSENSE_SLOT_START ||
        processEnv.PUBLIC_ADSENSE_SLOT_START,
      PUBLIC_ADSENSE_SLOT_END:
        (import.meta as ImportMeta).env?.PUBLIC_ADSENSE_SLOT_END ||
        processEnv.PUBLIC_ADSENSE_SLOT_END,
      PUBLIC_AHREFS_DATA_KEY:
        (import.meta as ImportMeta).env?.PUBLIC_AHREFS_DATA_KEY ||
        processEnv.PUBLIC_AHREFS_DATA_KEY,
    };

    // Validate using base schema (analytics now optional in all modes)
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
 * Resolve environment mode from various detection methods
 *
 * Uses priority-based detection to determine current environment mode:
 * 1. Explicit PUBLIC_SITE_ENV override (highest priority)
 * 2. Localhost/127.0.0.1 detection (auto-development)
 * 3. Production URL + NODE_ENV combination
 * 4. Default fallback (development for safety)
 *
 * Browser-safe: Guards against `process.env` access in client context.
 *
 * @returns Resolved environment mode
 *
 * @example
 * ```typescript
 * const mode = resolveEnvironmentMode();
 * // 'development' | 'production' | 'staging'
 * ```
 *
 * @internal
 */
function resolveEnvironmentMode(): 'development' | 'production' | 'staging' {
  // Check if running in browser (client-side) or Node.js (server-side)
  const isBrowser = typeof window !== 'undefined';
  let processEnv: Record<string, string | undefined> = {};
  if (!isBrowser && typeof process !== 'undefined') {
    processEnv = process.env;
  }

  const siteEnv =
    (import.meta as ImportMeta).env?.PUBLIC_SITE_ENV ||
    processEnv.PUBLIC_SITE_ENV;

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
    (import.meta as ImportMeta).env?.SITE_URL || processEnv.SITE_URL;
  const siteDomain =
    (import.meta as ImportMeta).env?.SITE_DOMAIN || processEnv.SITE_DOMAIN;

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
  const nodeEnv = processEnv.NODE_ENV;
  if (nodeEnv === 'production' && siteUrl && siteUrl.includes('erland.me')) {
    return 'production';
  }

  // Default to development for local builds
  return 'development';
}

/**
 * Current environment mode (auto-detected on module load)
 * @internal
 */
const currentMode = resolveEnvironmentMode();

/**
 * Validated environment variables (validated on module load)
 * @internal
 */
const validatedEnv = validateEnv(currentMode);

/**
 * Extended ImportMeta interface with environment support
 * @internal
 */
interface ImportMeta {
  env?: ImportMetaEnv;
}

/**
 * Site base URL (validated, defaults to localhost:4321 in dev)
 * @public
 * @example 'https://erland.me' or 'http://localhost:4321'
 */
export const SITE_URL: string = validatedEnv.SITE_URL;

/**
 * Site domain name (validated, defaults to localhost in dev)
 * @public
 * @example 'erland.me' or 'localhost'
 */
export const SITE_DOMAIN: string = validatedEnv.SITE_DOMAIN;

/**
 * Check if running on production site (erland.me)
 *
 * Verifies both SITE_URL and SITE_DOMAIN match production values.
 * Checks actual environment variables (not cached validation results) for accuracy.
 *
 * Browser-safe: Guards against `process.env` access in client context.
 * Falls back to currentMode check if env vars are unavailable.
 *
 * @returns True if both URL and domain match production (erland.me)
 *
 * @example
 * ```typescript
 * if (isProdSite()) {
 *   console.log('Running on production!');
 * }
 * ```
 *
 * @public
 */
export function isProdSite(): boolean {
  // Check if running in browser (client-side) or Node.js (server-side)
  const isBrowser = typeof window !== 'undefined';
  let processEnv: Record<string, string | undefined> = {};
  if (!isBrowser && typeof process !== 'undefined') {
    processEnv = process.env;
  }

  // Check actual environment variables, not cached values from validation
  const actualSiteUrl =
    (import.meta as ImportMeta).env?.SITE_URL || processEnv.SITE_URL;
  const actualSiteDomain =
    (import.meta as ImportMeta).env?.SITE_DOMAIN || processEnv.SITE_DOMAIN;

  // If no env vars set, check if current mode resolved to production
  if (!actualSiteUrl && !actualSiteDomain) {
    return currentMode === 'production';
  }

  return (
    actualSiteUrl === 'https://erland.me' && actualSiteDomain === 'erland.me'
  );
}

/**
 * Google Tag Manager container ID
 * Format: GTM-XXXXXXXX (public, non-secret)
 * Optional in all environments
 * @public
 * @example 'GTM-ABC1234'
 */
export const GTM_ID: string = validatedEnv.PUBLIC_GTM_ID || '';

/**
 * Google AdSense publisher client ID
 * Format: ca-pub-XXXXXXXXXX (public identifier)
 * Optional in all environments – ads render only when configured
 * @public
 * @example 'ca-pub-1234567890123456'
 */
export const ADSENSE_CLIENT: string = validatedEnv.PUBLIC_ADSENSE_CLIENT || '';

/**
 * AdSense slot ID for START placement (after first content element)
 * Shared by blog and download pages
 * Numeric string, optional in all environments
 * @public
 * @example '1234567890'
 */
export const ADSENSE_SLOT_START: string =
  validatedEnv.PUBLIC_ADSENSE_SLOT_START || '';

/**
 * AdSense slot ID for END placement (before last content element)
 * Shared by blog and download pages
 * Numeric string, optional in all environments
 * @public
 * @example '0987654321'
 */
export const ADSENSE_SLOT_END: string =
  validatedEnv.PUBLIC_ADSENSE_SLOT_END || '';

/**
 * Ahrefs Web Analytics data key
 * Optional tracking for SEO analytics
 * @public
 * @example 'abc123def456'
 */
export const AHREFS_DATA_KEY: string =
  validatedEnv.PUBLIC_AHREFS_DATA_KEY || '';

/**
 * Re-export validation functions for advanced use cases
 * @internal
 */
export { validateEnv, resolveEnvironmentMode };
