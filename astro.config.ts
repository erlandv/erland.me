import { defineConfig } from 'astro/config';
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
          // Configure asset output locations
          assetFileNames: assetInfo => {
            const name = assetInfo.name || '';
            if (name.endsWith('.css')) {
              // CSS to assets/css
              return 'assets/css/[name]-[hash][extname]';
            }
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp|avif)$/i.test(name)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(name)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
          // JS output location
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
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
          // Add cssnano for CSS minification in production
          ...(process.env.NODE_ENV === 'production'
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
      // IMAGE_SERVICE options: "squoosh" (WASM), "passthrough" (no transforms)
      service:
        process.env.IMAGE_SERVICE === 'squoosh'
          ? { entrypoint: 'astro/assets/services/squoosh' }
          : process.env.IMAGE_SERVICE === 'passthrough'
            ? { entrypoint: 'astro/assets/services/passthrough' }
            : undefined,
      domains: [process.env.SITE_DOMAIN || 'erland.me'],
      remotePatterns: [
        {
          protocol: 'https',
          hostname: process.env.SITE_DOMAIN || 'erland.me',
        },
      ],
    },

  // Compress configuration
  compressHTML: true,

  // Scoped style strategy
  scopedStyleStrategy: 'where',

  // Dev server configuration
  devToolbar: {
    enabled: true,
  },

  // Integrations for additional features
  integrations: [
    sitemap({
      filter: page => !page.includes('404'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
});
