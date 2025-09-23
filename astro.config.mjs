import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkDirective from 'remark-directive';
import remarkGallery, { remarkFigure } from './src/lib/remark-gallery.js';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

// https://astro.build/config
export default defineConfig({
  // Site configuration
  site: 'https://erland.me',
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
      // Enable minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      // Optimize chunk splitting
      rollupOptions: {
        output: {
          manualChunks: id => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              if (id.includes('remark') || id.includes('unist')) {
                return 'markdown';
              }
              return 'vendor';
            }
          },
          // Configure CSS output to dist/assets/css/
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith('.css')) {
              return 'assets/css/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
      // Enable source maps for production debugging
      sourcemap: false,
      // Optimize asset handling
      assetsInlineLimit: 4096,
    },
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
          ...(process.env.NODE_ENV === 'production' ? [
            cssnano({
              preset: ['default', {
                discardComments: {
                  removeAll: true,
                },
              }],
            }),
          ] : []),
        ],
      },
    },
    // Optimize dependencies
    optimizeDeps: {
      include: [],
    },
    // Server configuration
    server: {
      fs: {
        strict: false,
      },
    },
  },

  // Image optimization
  image: {
    domains: ['erland.me'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'erland.me',
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
      customPages: [
        'https://erland.me/',
        'https://erland.me/blog/',
        'https://erland.me/download/',
        'https://erland.me/web-development/',
        'https://erland.me/cloud-infra/',
        'https://erland.me/personal-projects/',
      ],
    }),
  ],
});
