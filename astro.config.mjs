import { defineConfig } from 'astro/config';
import remarkDirective from 'remark-directive';
import remarkGallery from './src/lib/remark-gallery.js';

// https://astro.build/config
export default defineConfig({
  markdown: {
    remarkPlugins: [remarkDirective, remarkGallery],
  },
});
