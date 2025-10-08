import { defineConfig, passthroughImageService } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkDirective from 'remark-directive';
import remarkGallery, { remarkFigure } from './src/lib/remark-gallery';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
// https://astro.build/config
export default defineConfig({
  // Site configuration
  site: process.env.SITE_URL || 'https://erland.me',
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
    remarkPlugins: [remarkDirective, remarkGallery, remarkFigure],
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
    gfm: true,
    smartypants: true,
  },

  // Vite configuration for optimizations
  vite: {
    build: {
      // Prefer esbuild for speed; allow switching to Terser via env
      // MINIFY_ENGINE=terser to enable Terser for advanced cases
      minify: process.env.MINIFY_ENGINE === 'terser' ? 'terser' : 'esbuild',
      terserOptions:
        process.env.MINIFY_ENGINE === 'terser'
          ? {
              compress: {
                drop_console: true,
                drop_debugger: true,
                dead_code: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug'],
              },
              mangle: { safari10: true },
              format: { comments: false },
            }
          : undefined,
      // Optimize chunk splitting
      rollupOptions: {
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
      // Target modern browsers
      target: ['es2020', 'chrome80', 'firefox78', 'safari14'],
    },
    plugins: [],
    // Esbuild options (apply drops only in production)
    esbuild:
      process.env.NODE_ENV === 'production'
        ? {
            drop: ['console', 'debugger'],
            pure: ['console.log', 'console.info', 'console.debug'],
            legalComments: 'none',
          }
        : undefined,
    // CSS optimization
    css: {
      devSourcemap: true,
      postcss: {
        plugins: [
          // Add autoprefixer for better browser compatibility
          autoprefixer({
            overrideBrowserslist: ['last 2 versions', '> 1%', 'not dead'],
          }),
          // Add cssnano for CSS minification when enabled
          ...(process.env.ENABLE_MINIFY === 'true' ||
          process.env.NODE_ENV === 'production'
            ? [
                cssnano({
                  preset: [
                    'default',
                    {
                      discardComments: {
                        removeAll: true,
                      },
                    },
                  ],
                }),
              ]
            : []),
        ],
      },
    },
    // Optimize dependencies
    optimizeDeps: {
      // keep default; explicit include not necessary
      include: [],
    },
    // Server configuration
    server: {
      fs: {
        strict: false,
      },
      // Enable overlay for Vite HMR errors in dev
      hmr: {
        overlay: true,
      },
    },
  },

  // Image optimization
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
    domains: [process.env.SITE_DOMAIN || 'erland.me'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.SITE_DOMAIN || 'erland.me',
      },
    ],
  },

  // Compress configuration for Astro components - enabled in production or when ENABLE_MINIFY is true
  compressHTML:
    process.env.ENABLE_MINIFY === 'true' ||
    process.env.NODE_ENV === 'production',

  // Scoped style strategy
  scopedStyleStrategy: 'where',

  // Dev server configuration
  devToolbar: {
    enabled: true,
  },

  // Integrations for additional features
  integrations: [
    sitemap({
      filter: (page: string) => !page.includes('404'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
});
