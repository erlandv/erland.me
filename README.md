# Erland's Personal Web

[![Built with Astro](https://astro.badg.es/v2/built-with-astro/tiny.svg)](https://astro.build)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This repository hosts my personal website with a blog and portfolio built with Astro, a cutting-edge static site builder that combines speed, flexibility, and simplicity. This is my small corner on the interweb where I’ll post my notes, achievements, and whatever I want to post.

## Tech Stack

### Core Framework
- **Astro 5.1.5** — Core framework for static site generation.
- **TypeScript** — Type-safe development across site and scripts.
- **Vite** — Dev server and build tooling (via Astro).
- **Shiki** — Markdown code syntax highlighting.
- **@astrojs/sitemap** — Automatic sitemap generation.
- **Sharp** — Default image optimization service; configurable via `IMAGE_SERVICE` to use Squoosh or passthrough.
- **Terser** — Optional JavaScript minifier toggled via `MINIFY_ENGINE=terser`.

### Content & Styling
- **Markdown (Astro Content Collections)** — Structured content schemas and validation (see `src/content.config.ts`).
- **Vanilla CSS + CSS Modules** — Styles colocated with components where possible.
- **PostCSS** — Autoprefixer and cssnano for CSS optimization.
- **SVG Icons** — Dynamic imports with normalized color for consistent theming.
- **Agave Nerd Font** — Font for code/technical sections.

### Utilities & Configuration
- **@astrojs/check** — Diagnostics, lint hints, and type checks.
- **Prettier** — Code formatting.
- **remark-directive** — Extended Markdown directives support.
- **Custom remark-gallery** — Markdown image gallery support.
- **ts-node** — Run TypeScript-based generators (robots.txt, ads.txt).
- **npm scripts** — Build, preview, lint, format, and validate workflows.
- **Client-side utilities** — Lightbox, code copy, share buttons.

## Production Deployment

Production deployment runs on a GitHub Actions Ubuntu runner and uploads the built static assets from the dist/ directory to the VPS over SSH using rsync. Workflow file: `.github/workflows/deploy.yml`

### Flow

- Trigger on push to `main`, or manually via `workflow_dispatch`.
- CI steps:
  - Check out the repository (`actions/checkout@v4`)
  - Set up Node.js 20 with npm cache (`actions/setup-node@v4`)
  - Install dependencies (`npm install`)
  - Perform a clean full build (`npm run build:clean`)
  - Verify the build output and write release stamps: `.release` (commit SHA), `.built_at` (UTC timestamp), and publish `version.json` with `sha` and `built_at`
  - Start ssh-agent and add the private key (`webfactory/ssh-agent@v0.9.0`)
  - Add the server to known_hosts (`ssh-keyscan -p $SSH_PORT -H $SSH_HOST`)
  - Prepare the remote directory (`mkdir -p $RELEASES_DIR`)
  - Upload the artifact via rsync to `releases/<sha>` (options: `-az --delete-delay --partial --mkpath`; SSH connection `-p $SSH_PORT`)
  - Activate the new release: swap the `current` symlink to point to `releases/<sha>` (`ln -sfn`)
  - Sanity check: ensure `index.html` exists at `$CURRENT_LINK`
  - Validate Nginx configuration and reload (`sudo nginx -t && sudo systemctl reload nginx`)
  - HTTP health checks:
    - Ensure root `$SITE_URL` returns HTTP 200 with explicit cache-bypass
    - Ensure `/version.json` is accessible and contains the current `GITHUB_SHA`
  - Clean up old releases: keep only the last `$KEEP_RELEASES`
  - Upload the artifact to GitHub (`actions/upload-artifact@v4`, name: `dist-<sha>`, retention: 7 days)

### Live Site

You can see live site at [https://erland.me](https://erland.me).

## License & Credits

- License: MIT License. See [LICENSE](./LICENSE) file for details.
- Credit: This project is a derivative of the original theme with customizations to layout, components, build config, and more.
  - Original theme: [Codefolio](https://github.com/danielunited/codefolio) by Daniel Alter.
  - Modified by Erland
