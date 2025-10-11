// PostCSS configuration: Autoprefixer for evergreen + Safari 15, cssnano in production
// Astro (Vite) will auto-detect this file and apply processing to imported CSS.
module.exports = {
  plugins: [
    require('autoprefixer')(),
    ...(process.env.NODE_ENV === 'production'
      ? [
          require('cssnano')({
            preset: 'default',
          }),
        ]
      : []),
  ],
};
