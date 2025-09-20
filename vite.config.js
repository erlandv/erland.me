import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
    },
    
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: (id) => {
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
        // Optimize asset names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `assets/css/[name]-[hash].${ext}`;
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash].${ext}`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    
    // Source maps for production debugging
    sourcemap: false,
    
    // Asset inline limit
    assetsInlineLimit: 4096,
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Target modern browsers
    target: ['es2020', 'chrome80', 'firefox78', 'safari14'],
  },
  
  // CSS optimization
  css: {
    devSourcemap: true,
    postcss: {
      plugins: [
        // Add autoprefixer for better browser compatibility
        require('autoprefixer')({
          overrideBrowserslist: [
            'last 2 versions',
            '> 1%',
            'not dead',
          ],
        }),
      ],
    },
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['astro'],
    exclude: ['@astrojs/sitemap'],
  },
  
  // Server configuration
  server: {
    fs: {
      strict: false,
    },
    // Enable HMR for better development experience
    hmr: {
      overlay: true,
    },
  },
  
  // Preview server configuration
  preview: {
    port: 4321,
    host: true,
  },
  
  // Define global constants
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@layouts': '/src/layouts',
      '@lib': '/src/lib',
      '@content': '/src/content',
    },
  },
  
  // Plugin configuration
  plugins: [],
});
