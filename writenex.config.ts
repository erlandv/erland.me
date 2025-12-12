import { defineConfig } from '@writenex/astro';

export default defineConfig({
  images: {
    strategy: 'colocated',
    publicPath: '/assets',
    storagePath: 'public/assets',
  },

  editor: {
    autosave: false,
    autosaveInterval: 10000,
  },
});
