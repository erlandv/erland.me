# erland.me — Astro 5 Project Documentation

A static site built with Astro 5 and TypeScript. This repository powers a personal website, blog, portfolio, and a small download hub, with a focus on performance, minimal client-side JavaScript, accessible UI, and a smooth developer experience.

- Output: Static (no SSR)
- Styling: CSS Modules + global CSS
- Content: Astro Content Collections with strict schemas
- Build tooling: Vite, esbuild/Terser, PostCSS, Astro integrations
- Scripts: robots.txt and ads.txt generators via ts-node

-------------------------------------------------------------------------------

## Table of Contents

- Overview
- Features
- Requirements
- Quick Start (Local Development)
- Scripts & Workflow
- Project Structure
- Content Collections
- Pages & Routing
- Components & Layouts
- Styles & Assets
- Markdown & Remark Plugins
- SEO & Sitemap
- Configuration & Environment Variables
- Build & Preview
- Deployment
- Performance & Optimization
- Troubleshooting
- Contributing
- License & Credits

-------------------------------------------------------------------------------

## Overview

This codebase uses Astro’s content collections for structured Markdown content, a single shared layout, and a set of reusable components. The site is generated as a static export and can be deployed to any static host (e.g., Netlify, Vercel, Cloudflare Pages, GitHub Pages, or Nginx).

-------------------------------------------------------------------------------

## Features

- Astro 5 with static output and minimal client JS
- Blog engine powered by Markdown content collections
- Portfolio sections: Web Development, Cloud Infra, Personal Projects
- Download hub with templated detail pages
- Custom remark plugins for directives, galleries, and figures
- SEO-friendly metadata and JSON‑LD
- Responsive, accessible UI with CSS Modules
- Image lightbox on blog and download pages (including `:::gallery` directive)
- Strong DX: TypeScript, Prettier, Astro checks, PostCSS optimizations
- Sitemap integration for search engines

-------------------------------------------------------------------------------

## Requirements

- Node.js 18+ (recommended latest LTS)
- npm (bundled with Node) or alternative package managers (npm scripts are provided)

Optional (for development or CI):
- Git
- A modern browser for dev/preview

-------------------------------------------------------------------------------

## Quick Start (Local Development)

1) Clone and install dependencies:
```
git clone https://github.com/erlandv/erland.me.git
cd erland.me
npm install
```

2) Create your environment file:
```
cp .env.example .env
```
Update values as needed (see “Configuration & Environment Variables”).

3) Start the dev server:
```
npm run dev
```
Astro dev server will start and provide a local URL. Hot Module Replacement (HMR) is enabled with overlay for errors.

-------------------------------------------------------------------------------

## Scripts & Workflow

Core scripts (see package.json):
- Development:
  - `npm run dev` — start local dev server (predev runs robots generator)
- Build & Preview:
  - `npm run build` — generate robots.txt, ads.txt, then build to `dist/`
  - `npm run build:clean` — remove `dist/` then perform full build (robots + ads)
  - `npm run preview` — preview the built site locally
- Quality:
  - `npm run lint` — Astro diagnostics (types, config, accessibility hints)
  - `npm run lint:fix` — attempt to fix issues
  - `npm run type-check` — TypeScript-only checks
  - `npm run format` — Prettier write
  - `npm run format:check` — Prettier check
  - `npm run validate` — run lint, type-check, and format:check
- Generators:
  - `npm run generate:robots` — robots.txt via ts-node loader
  - `npm run generate:ads` — ads.txt via ts-node loader

-------------------------------------------------------------------------------

## Project Structure

Top-level overview:
```
.
├─ astro.config.ts
├─ package.json
├─ .env.example
├─ public/
│  ├─ assets/favicon/...
│  ├─ assets/social/og-default-1200x630.png
│  └─ fonts/agave-nerd/*.woff2
├─ scripts/
│  ├─ generate-ads.ts
│  ├─ generate-robots.ts
│  └─ tsconfig.scripts.json
├─ src/
│  ├─ components/ (UI components + CSS modules)
│  ├─ content/ (Markdown/data entries for collections)
│  ├─ icons/ (SVG icons)
│  ├─ layouts/ (shared layouts)
│  ├─ lib/ (utilities like remark plugins)
│  ├─ pages/ (Astro routes)
│  ├─ styles/ (global and page-scoped CSS)
│  ├─ content.config.ts (collections schemas)
│  └─ env.d.ts (Astro TS env)
└─ dist/ (build output; generated)
```

Key files:
- `astro.config.ts` — site configuration, Vite build options, PostCSS, image handling, sitemap integration
- `src/content.config.ts` — Astro collections and schemas
- `scripts/generate-robots.ts`, `scripts/generate-ads.ts` — generators run before build
- `src/layouts/SiteLayout.astro` — primary layout
- `src/pages/...` — all routes (blog, portfolio, downloads, 404, privacy policy)
- `src/components/...` — reusable UI
- `src/styles/base.css`, `src/styles/gallery.css`, `src/styles/lightbox.css` — global stylesheets

-------------------------------------------------------------------------------

## Content Collections

Configured in `src/content.config.ts` using `defineCollection` and `zod` schemas.

- Blog (`src/content/blog/**`):
  Fields:
  - `title` (string)
  - `description` (string, optional, ≤160 chars)
  - `excerpt` (string, optional, ≤200 chars)
  - `publishDate` (date)
  - `updatedDate` (date, optional)
  - `hero` (image, optional)
  - `heroAlt` (string, optional)
  - `tags` (string[])
  - `category` (string, optional)
  - `draft` (boolean, default false)

  Example frontmatter:
  ```
  ---
  title: "My First Post"
  description: "Short SEO description."
  excerpt: "A short content teaser."
  publishDate: 2025-01-01
  updatedDate: 2025-01-10
  hero: ./hero.png
  heroAlt: "Sunset over mountains"
  tags: ["astro", "webdev"]
  category: "guides"
  draft: false
  ---
  ```

- Downloads (`src/content/download/**`):
  Fields:
  - `title` (string)
  - `description` (string)
  - `excerpt` (string, optional, ≤200 chars)
  - `hero` (image, optional)
  - `heroAlt` (string, optional)
  - `file` (string)
  - `version` (string, optional)
  - `lastUpdated` (date, optional)
  - `ctaLabel` (string, default "Download sekarang")
  - `order` (number, default 0)
  - `tags` (string[])
  - `draft` (boolean, default false)
  - `downloadFiles` (array of { label, href, size? }, optional)
  - `downloadNote` (string, optional)
  - `downloadIntro` (string[], optional)

  Example frontmatter:
  ```
  ---
  title: "Tooling Bundle"
  description: "CLI tools and configs."
  file: "tooling-bundle.zip"
  version: "1.2.3"
  lastUpdated: 2025-02-08
  ctaLabel: "Download now"
  order: 1
  tags: ["tools", "zip"]
  downloadFiles:
    - label: "Linux x64"
      href: "https://example.com/linux-x64.zip"
      size: "12MB"
    - label: "Windows x64"
      href: "https://example.com/win-x64.zip"
      size: "10MB"
  ---
  ```

- Portfolio (`src/content/portfolio/**`):
  Type `data` collection with fields:
  - `title` (string)
  - `category` (one of: `web-development`, `cloud-infra`, `personal-projects`)
  - `desc` (string)
  - `highlights` (string[], default [])
  - `tech` (string[])
  - `order` (number, default 0)

  Example (JSON):
  ```
  {
    "title": "Static Site Generator",
    "category": "web-development",
    "desc": "A fast, accessible site generator.",
    "highlights": ["MDX support", "Fast builds"],
    "tech": ["Astro", "TypeScript"],
    "order": 2
  }
  ```

-------------------------------------------------------------------------------

## Pages & Routing

Astro page routes live under `src/pages/`:

- `/` → `src/pages/index.astro`
- `/blog/` → `src/pages/blog/index.astro`
- `/blog/[slug]/` → dynamic article route
- `/blog/category/[category]/` → category listing
- `/portfolio/` and nested pages (e.g., `portfolio/web-development.astro`)
- `/download/` → `src/pages/download/index.astro`
- `/download/[slug]/` → dynamic download detail
- `/privacy-policy/` → static page
- `/404/` → custom not-found

Trailing slash is enforced (`trailingSlash: "always"` in config).

-------------------------------------------------------------------------------

## Components & Layouts

Common components:
- `Header.astro`, `Footer.astro`, `Sidebar.astro`, `BackNav.astro`
- Content helpers: `PostCard.astro`, `Pagination.astro`, `ShareButtons.astro`, `SearchInput.astro`, `ScrollTopButton.astro`, `Project.astro`
- Hero and images: `HeroImage.astro`, `ContentImage.astro`, `Icon.astro`

Layout:
- `src/layouts/SiteLayout.astro` — shared site layout with head tags, metadata, and global styles. All routes typically use this layout to ensure consistent SEO and UI.

-------------------------------------------------------------------------------

## Styles & Assets

- Global CSS:
  - `src/styles/base.css` — base variables and global resets
  - `src/styles/gallery.css` — gallery-specific styles
  - `src/styles/lightbox.css` — lightbox animations and overlay
- Component-scoped CSS Modules:
  - colocated under `src/components/*/*.module.css`
- Icons:
  - `src/icons/*.svg`
- Public assets:
  - Favicons under `public/assets/favicon/`
  - OG images under `public/assets/social/`
  - Fonts under `public/fonts/`

-------------------------------------------------------------------------------

## Markdown & Remark Plugins

Configured in `astro.config.ts`:
- `remark-directive` — enables `:::` directives in Markdown
- Custom `remark-gallery` and `remarkFigure` (from `src/lib/remark-gallery`)
- Shiki syntax highlighting (`github-dark-dimmed`, wrapped lines)
- GFM enabled and smartypants set for typography

Directives support galleries like:
```
:::gallery
![Alt text](./images/pic-1.webp)
![Alt text](./images/pic-2.webp)
:::
```
Images and single figures can open a lightbox overlay on click.

-------------------------------------------------------------------------------

## SEO & Sitemap

- Comprehensive meta tags and JSON‑LD handled in the layout and components
- `@astrojs/sitemap` integration in `astro.config.ts`:
  - Excludes `404`
  - `changefreq: "weekly"`
  - `priority: 0.7`

Ensure `SITE_URL` and `SITE_DOMAIN` are correctly set in environment variables for proper canonical and sitemap URLs.

-------------------------------------------------------------------------------

## Configuration & Environment Variables

See `.env.example` and set values in `.env`:
- Site config:
  - `SITE_URL` — full site URL (e.g., `https://erland.me`)
  - `SITE_DOMAIN` — domain (e.g., `erland.me`)
- Analytics & monetization (public):
  - `PUBLIC_GTM_ID` — Google Tag Manager (production only)
  - `PUBLIC_ADSENSE_CLIENT` — AdSense client (production only)
  - Optional AdSense slots:
    - `PUBLIC_ADSENSE_SLOT_BLOG_MID`, `PUBLIC_ADSENSE_SLOT_BLOG_END`
    - `PUBLIC_ADSENSE_SLOT_DL_MID`, `PUBLIC_ADSENSE_SLOT_DL_END`
- Image service:
  - `IMAGE_SERVICE` — set to `"squoosh"` for WASM image processing or `"passthrough"` to disable transforms (default uses Sharp if available)
- Minification:
  - `MINIFY_ENGINE` — set to `terser` to switch Vite minification from `esbuild` to `terser`

-------------------------------------------------------------------------------

## Build & Preview

- Build:
```
npm run build
```
Artifacts output to `dist/`. Robots and ads files are generated before the build.

- Preview:
```
npm run preview
```
Starts a local server to serve files from `dist/`.

-------------------------------------------------------------------------------

## Deployment

Because output is static, you can deploy `dist/` to any static host.

Common options:

- Netlify:
  - Build command: `npm run build`
  - Publish directory: `dist`
  - Environment variables: set `SITE_URL`, `SITE_DOMAIN`, analytics variables as needed

- Vercel:
  - Framework preset: Astro
  - Build command: `npm run build`
  - Output directory: `dist`
  - Set environment variables in Project Settings

- Cloudflare Pages:
  - Build command: `npm run build`
  - Output directory: `dist`
  - Add env vars under “Environment Variables”

- GitHub Pages:
  - Build in CI, then deploy `dist/` to `gh-pages` branch
  - Configure custom domain if desired

- Nginx:
  - Copy `dist/` to web root and serve statically
  - Example server block:
  ```
  server {
    listen 80;
    server_name erland.me;
    root /var/www/erland.me/dist;

    location / {
      try_files $uri $uri/ =404;
    }
  }
  ```
  Note `trailingSlash: "always"` is enabled. Ensure `try_files` serves folder indexes.

--------------------------------------------------------------------------------

## CI: Auto Deploy to VPS via GitHub Actions

This pipeline builds on a GitHub Actions runner (Ubuntu) and uploads static build artifacts in `dist/` to the VPS via SSH + rsync. Workflow file: [".github/workflows/deploy.yml"](./.github/workflows/deploy.yml).

### Flow
- Trigger on push to `main`, or manually via `workflow_dispatch`.
- CI steps:
  - Checkout repository
  - Setup Node 20 with npm cache
  - `npm ci`
  - `npm run build:clean` (generates robots.txt and ads.txt, then builds Astro)
  - Add SSH key to agent
  - `ssh-keyscan` the remote host (populate known_hosts)
  - Ensure target directory exists on the server
  - `rsync -az --delete` from `./dist/` to `/var/www/astro/dist/` on the VPS (remote `rsync` runs as `sudo`)

### Required GitHub Repository Secrets
Configure at: Repository Settings → Secrets and variables → Actions → New repository secret.

- `SSH_HOST` — VPS IP/domain (e.g., `123.45.67.89` or `erland.me`)
- `SSH_PORT` — SSH port (e.g., `1313`)
- `SSH_USER` — SSH user (e.g., `erland`)
- `SSH_PRIVATE_KEY` — OpenSSH private key for VPS login (PEM/OPENSSH multiline). Example:
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  ...
  -----END OPENSSH PRIVATE KEY-----
  ```

Build-time env (optional, based on site needs):
- `SITE_URL`, `SITE_DOMAIN`
- `PUBLIC_GTM_ID`, `PUBLIC_ADSENSE_CLIENT`
- `PUBLIC_ADSENSE_SLOT_BLOG_MID`, `PUBLIC_ADSENSE_SLOT_BLOG_END`
- `PUBLIC_ADSENSE_SLOT_DL_MID`, `PUBLIC_ADSENSE_SLOT_DL_END`
- `IMAGE_SERVICE` (e.g., `passthrough` if the runner lacks native sharp)
- `MINIFY_ENGINE` (e.g., `terser` for Terser-based minification)

Note: Secrets are exposed as job `env` as defined in [".github/workflows/deploy.yml"](./.github/workflows/deploy.yml).

### VPS Preparation
- `sudo NOPASSWD` for user `erland` is configured (`erland ALL=(ALL) NOPASSWD:ALL` via `visudo`).
- Ensure the web root target exists:
  - `sudo mkdir -p /var/www/astro/dist`
- Optional: restrict sudoers to allow only `rsync`, `mkdir`, `chown`, `chmod` for specific paths.

### Upload Mechanics
- CI invokes `rsync` with:
  - `-a` (archive, preserve)
  - `-z` (compress)
  - `--delete` (sync; removes files not present in source)
- Remote `rsync` via `--rsync-path="sudo rsync"` to write to `/var/www/astro/dist/` owned by root.
- Remote directory is ensured before upload.

### Manual Test
- Open the Actions tab in GitHub → select the "Deploy to VPS" workflow → `Run workflow`.
- Inspect job logs to confirm build and upload succeeded.
- Verify on VPS: `ls -la /var/www/astro/dist/` should reflect the latest build contents.

### Troubleshooting
- SSH failures: verify `SSH_HOST`, `SSH_PORT`, `SSH_USER`, and that `SSH_PRIVATE_KEY` matches the public key on the VPS (`~/.ssh/authorized_keys`).
- Known hosts: if `ssh-keyscan` fails due to firewall, add the host fingerprint manually or ensure the port is open.
- Build errors due to `sharp`: set `IMAGE_SERVICE=squoosh` in secrets to use WASM-based image transforms.
- Permissions: if writing to `/var/www/astro/dist/` is denied, ensure `NOPASSWD` works (test `ssh erland@host -p 1313` then run `sudo ls /var/www/astro` without a password).

-------------------------------------------------------------------------------

## Performance & Optimization

Configured in `astro.config.ts`:
- Minify via `esbuild` by default; switch to `terser` with `MINIFY_ENGINE=terser` for advanced compression
- PostCSS with `autoprefixer` and conditional `cssnano` in production
- Rollup chunking strategy: vendor split for `astro`, `markdown`, and others
- Asset file naming under `assets/css`, `assets/images`, `assets/fonts`, `assets/js`
- Modern build targets and CSS code splitting
- Optional production drops of `console` and `debugger` via esbuild in prod

Image service:
- Use `squoosh` on hosts without native Sharp support (e.g., older CPUs or Alpine), or `passthrough` to disable transforms.

-------------------------------------------------------------------------------

## Troubleshooting

- Sharp missing / image errors:
  - Set `IMAGE_SERVICE=passthrough` in `.env` (WASM-based image transforms)
- Broken links or incorrect canonical:
  - Verify `SITE_URL` and `SITE_DOMAIN` in environment
- Excessive JS bundle size:
  - Ensure minimal client-side JS; use Astro islands only where needed
  - Keep remark plugins pure; avoid heavy runtime libs
- HMR overlay errors during dev:
  - Fix markdown frontmatter to match schemas
  - Run `npm run lint` and `npm run type-check` for diagnostics
- Formatting differences:
  - Run `npm run format` before commits to minimize diffs

-------------------------------------------------------------------------------

## Contributing

- Coding style:
  - TypeScript, ESM, two-space indentation
  - Components in PascalCase (`Component.astro`)
  - Helpers in `src/lib` use camelCase exports
  - Pages use kebab-case routes (`blog/my-post.astro`)
  - Content entries follow collection schemas; filenames kebab-case
- Validation:
  - Run `npm run validate` (lint, types, format check) before PRs
- Commits:
  - Conventional style: `feat(scope): message`, `fix(scope): message`, `chore|refactor|docs: ...`
  - Use scopes like `blog`, `portfolio`, `scripts`, `seo`
- PRs should include:
  - Clear summary and motivation; link issues when applicable
  - Screenshots for UI changes and a preview link if available
  - Checklist: `npm run validate` passes; no console noise; routes build

-------------------------------------------------------------------------------

## License & Credits

- License: MIT — see `LICENSE`
- Credits:
  - Original theme by [Daniel Alter](https://github.com/danielunited)
  - Modified and maintained by [Erland](https://github.com/erlandv)
