// PostCSS configuration for CSS processing during build
// Autoprefixer: Adds vendor prefixes based on .browserslistrc targets
// CSS minification is handled by Vite during production builds
// Astro (Vite) will auto-detect this file and apply processing to imported CSS
module.exports = {
  plugins: [require('autoprefixer')()],
};
