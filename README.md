# Erland's Personal Web

[![Built with Astro](https://astro.badg.es/v2/built-with-astro/tiny.svg)](https://astro.build)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This repository hosts my personal website with a blog and portfolio built with **Astro**, a cutting-edge static site builder that combines speed, flexibility, and simplicity. This is my small corner on the interweb where I’ll post my notes, achievements, and whatever I want to post.

## Tech Stack

A lean, performance-first toolkit that keeps builds fast and maintenance simple.

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

Production builds run on **GitHub Actions (Ubuntu runner)** and are uploaded to the VPS over SSH using **`rsync`**. The workflow file lives at: `.github/workflows/deploy.yml`.

### Prod Flow

- **Trigger & context**: push to `main` or manual `workflow_dispatch`; Environment **Production** (`$SITE_URL`); timeout **30m**.
- **Build**: checkout (`actions/checkout@v4`), Node.js **20.18.x** (`actions/setup-node@v4`), `npm ci`, then `npm run build:clean`.
- **Release metadata**: write `.release` (SHA) & `.built_at` (UTC); publish `version.json` with `{ sha, built_at }`.
- **SSH & upload**: start ssh-agent + add key; add `known_hosts`; ensure `$RELEASES_DIR`; `rsync` `dist/` → `releases/<sha>` with `-az --delete-delay --partial --mkpath --info=stats2,progress2` (over SSH with hardened options).
- **Activate & verify**: `ln -sfn` `releases/<sha>` → `current`; ensure `$CURRENT_LINK/index.html`; reload Nginx only if `vars.RELOAD_NGINX == 'true'` (validate first); health checks: HEAD/GET `/`=200, key assets=200, `version.json` contains `GITHUB_SHA`.
- **Housekeeping**: keep last **`$KEEP_RELEASES`** (default **5**); upload artifact `dist-<sha>` via `actions/upload-artifact@v4` (retention **7 days**).

The production site is available at **[https://erland.me](https://erland.me)**.

## Staging Deployment

Staging builds run on GitHub Actions and publish to Cloudflare Pages via `cloudflare/pages-action`. The workflow file lives at: `.github/workflows/staging.yml`.

### Staging Flow

- **Trigger & context**: push to branches `staging` or `testing`, or manual `workflow_dispatch`; Environment: Staging; concurrency group `pages-staging-${{ github.ref }}`; paths filter to only run on relevant changes (`src/**`, `public/**`, `astro.config.ts`, `package.json`, `package-lock.json`, `scripts/**`, `.github/workflows/staging.yml`).
- **Build**: checkout (`actions/checkout@v4`), set up Node.js `20.18.x` (`actions/setup-node@v4`) with npm cache, install dependencies deterministically (`npm ci`), then build (`npm run build`).
- **Verify build output**: ensure `dist/` exists and has files before publishing (fails fast if empty).
- **Publish to Cloudflare Pages**: `cloudflare/pages-action@v1` with `apiToken` = `secrets.CLOUDFLARE_API_TOKEN`, `accountId` = `secrets.CLOUDFLARE_ACCOUNT_ID`, `projectName` = `vars.CLOUDFLARE_PROJECT_NAME`, `directory` = `./dist`, `gitHubToken` = `${{ secrets.GITHUB_TOKEN }}`, `branch` = `${{ github.ref_name }}` (maps `staging`/`testing` to Cloudflare preview).
- **Summary**: append deployment summary (project, branch, commit) to `GITHUB_STEP_SUMMARY` for quick reference in the Actions UI.

The staging/testing site is available at **[https://staging.erland.pages.dev](https://staging.erland.pages.dev)**.

## License & Credits

- License: MIT License. See [LICENSE](./LICENSE) file for details.
- Credit: This project is a derivative of the original theme with customizations to layout, components, build config, and more.
  - Original theme: [Codefolio](https://github.com/danielunited/codefolio) by Daniel Alter.
  - Modified by Erland
