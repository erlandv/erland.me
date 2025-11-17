import { defineConfig, passthroughImageService } from 'astro/config';
import { fileURLToPath } from 'node:url';
import remarkDirective from 'remark-directive';
import remarkGallery, { remarkFigure } from './src/lib/remark-gallery';
import remarkDownloadFiles from './src/lib/remark-download-files';

// Environment validation at startup
import {
  validateEnv,
  resolveEnvironmentMode,
  type ValidatedEnv,
} from './src/lib/env.js';

import playformCompress from '@playform/compress';

// Validate and get environment configuration
let validatedEnv: ValidatedEnv;
let mode: 'development' | 'production' | 'staging' = 'development';

try {
  mode = resolveEnvironmentMode();
  validatedEnv = validateEnv(mode);

  // Only show validation success in non-CI environments
  if (!process.env.CI && !process.env.GITHUB_ACTIONS) {
    console.log(`Environment validation passed for mode: ${mode}`);
    console.log(`Site: ${validatedEnv.SITE_URL}`);
    console.log(`Domain: ${validatedEnv.SITE_DOMAIN}`);

    if (mode === 'production') {
      console.log(
        `GTM ID: ${validatedEnv.PUBLIC_GTM_ID ? 'Configured' : 'Missing'}`
      );
      console.log(
        `AdSense: ${validatedEnv.PUBLIC_ADSENSE_CLIENT ? 'Configured' : 'Missing'}`
      );
    }
  }
} catch (error) {
  console.error('Environment validation failed at startup:');

  // Safely handle error message extraction
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(errorMessage);
  console.error('Please fix your environment configuration before continuing.');
  console.error('Check your .env file or environment variables.');

  // Provide helpful suggestions based on error type
  if (errorMessage.includes('SITE_DOMAIN')) {
    console.error(
      'Tip: SITE_DOMAIN should be a valid domain like "example.com" (without protocol)'
    );
  }
  if (errorMessage.includes('GTM_ID') && mode === 'production') {
    console.error(
      'Tip: Set PUBLIC_GTM_ID to your Google Tag Manager ID (e.g., GTM-XXXXXXXX)'
    );
  }
  if (errorMessage.includes('ADSENSE_CLIENT') && mode === 'production') {
    console.error(
      'Tip: Set PUBLIC_ADSENSE_CLIENT to your AdSense publisher ID (e.g., ca-pub-XXXXXXXXXX)'
    );
  }

  // Exit with error to prevent build/dev from continuing
  process.exit(1);
}

// https://astro.build/config

export default defineConfig({
  // Site configuration using validated values
  site: validatedEnv.SITE_URL,
  trailingSlash: 'always',

  // Output configuration
  output: 'static',

  // Build configuration
  build: {
    assets: '_astro',
    inlineStylesheets: 'auto',
  },

  // Markdown configuration
  markdown: {
    remarkPlugins: [
      remarkDirective,
      remarkGallery,
      remarkFigure,
      remarkDownloadFiles,
    ],
    shikiConfig: {
      theme: 'material-theme-darker',
      wrap: false,
    },
    gfm: true,
    smartypants: true,
  },

  // Vite configuration for optimizations
  vite: {
    build: {
      // Minification handled by @playform/compress in production
      // Use esbuild for speed in development
      minify: 'esbuild',
      // Optimize chunk splitting
      rollupOptions: {
        onwarn(warning, defaultHandler) {
          if (
            warning.code === 'UNUSED_EXTERNAL_IMPORT' &&
            typeof warning.message === 'string' &&
            warning.message.includes('@astrojs/internal-helpers/remote')
          ) {
            return;
          }
          defaultHandler(warning);
        },
        output: {
          manualChunks: id => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              if (id.includes('astro')) {
                return 'astro';
              }
              if (id.includes('remark') || id.includes('unist')) {
                return 'markdown';
              }
              return 'vendor';
            }
          },
          // Configure asset output locations (dot-separated, cleaned names)
          assetFileNames: assetInfo => {
            const original = (assetInfo.name || '').replace(/\0/g, '');
            const ext = original.includes('.')
              ? original.slice(original.lastIndexOf('.'))
              : '';
            const base = ext
              ? original.slice(0, original.length - ext.length)
              : original;
            const cleanBase = base.replace(/^_+|_+$/g, '');
            // CSS: hashed-only (professional, avoids dynamic route placeholders)
            if (ext === '.css' || original.endsWith('.css')) {
              return 'assets/css/[hash][extname]';
            }
            // Images: keep readable names + hash
            if (
              /\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp|avif)$/i.test(original)
            ) {
              return `assets/images/${cleanBase}.[hash][extname]`;
            }
            // Fonts: keep readable names + hash
            if (/\.(woff2?|eot|ttf|otf)$/i.test(original)) {
              return `assets/fonts/${cleanBase}.[hash][extname]`;
            }
            // Other assets: readable names + hash
            return `assets/${cleanBase}.[hash][extname]`;
          },
          // JS output location: hashed-only to avoid route placeholders
          chunkFileNames: 'assets/js/[hash].js',
          entryFileNames: 'assets/js/[hash].js',
        },
      },
      // Enable source maps for production debugging
      sourcemap: false,
      // Optimize asset handling
      assetsInlineLimit: 4096,
      // Split CSS into separate files
      cssCodeSplit: true,
    },
    plugins: [],
    resolve: {
      alias: {
        '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
      },
    },
    // Esbuild options (compression handled by @playform/compress)
    esbuild:
      mode === 'production'
        ? {
            legalComments: 'none',
          }
        : undefined,
    // Server configuration
    server: {
      fs: {
        strict: true,
      },
      // Enable overlay for Vite HMR errors in dev
      hmr: {
        overlay: true,
      },
    },
  },

  // Image optimization
  // Note: AVIF generation disabled via AVIF=false in build scripts for speed
  // AVIF encoding is ~6s per image; WebP provides 99% of benefits with 10x faster build
  image: {
    // Optional: switch image service via env to avoid native Sharp issues on some hosts
    // IMAGE_SERVICE options:
    // - "squoosh" (WASM) via deep entrypoint (supported)
    // - "passthrough" via passthroughImageService() (no transforms, safe in Astro v5)
    // - unset => default Sharp (if available)
    service:
      process.env.IMAGE_SERVICE === 'squoosh'
        ? { entrypoint: 'astro/assets/services/squoosh' }
        : process.env.IMAGE_SERVICE === 'passthrough'
          ? passthroughImageService()
          : undefined,
    domains: [validatedEnv.SITE_DOMAIN],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: validatedEnv.SITE_DOMAIN,
      },
    ],
  },

  // HTML compression handled by @playform/compress integration
  compressHTML: false,

  // Scoped style strategy
  scopedStyleStrategy: 'where',

  // Dev server configuration
  devToolbar: {
    enabled: true,
  },

  // Integrations for additional features
  // Only apply compression in production to speed up development builds
  integrations:
    mode === 'production' || mode === 'staging'
      ? [
          playformCompress({
            // CSS compression
            CSS: true,
            // HTML compression (compressHTML disabled above, handled here)
            HTML: true,
            // JavaScript/SVG compression
            JavaScript: true,
            SVG: true,
            // Image optimization (disable if using separate image service)
            Image: false,
          }),
        ]
      : [],
});
