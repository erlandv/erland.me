Codefolio (Astro)

Overview
- Personal portfolio and blog built with Astro 5.
- Includes sections for Web Development, DevOps, Personal Projects, and a Markdown‑powered blog.
- Clean, fast, and SEO‑friendly with Astro View Transitions enabled.

Features
- Astro content collections for blog posts with typed frontmatter.
- Reusable components for header, sidebar, and project cards.
- Responsive layout and prebuilt styles in `public/assets/styles.css`.
- Simple author/profile details via the sidebar component.

Tech Stack
- Astro ^5.x
- TypeScript (minimal typings)
- Vanilla CSS (served from `public/assets/styles.css`)

Getting Started
1) Prerequisites
- Node.js 18+ recommended

2) Install
- Run `npm install`

3) Development
- Start dev server: `npm run dev`
- The app runs at `http://localhost:4321` by default.

4) Build & Preview
- Production build: `npm run build`
- Preview build locally: `npm run preview`

Scripts (from package.json)
- `dev` / `start`: run Astro dev server
- `build`: build for production
- `preview`: preview the production build

Project Structure (high level)
- `src/pages` — route pages (home, blog, sections)
- `src/components` — UI components (Header, Sidebar, Project)
- `src/layouts` — base layout(s)
- `src/content` — Markdown content (blog)
- `public/assets` — static assets and global styles

Blog Content
- Posts live in `src/content/blog/` as Markdown files.
- Frontmatter schema is defined in `src/content.config.ts` and supports:
  - `title` (string)
  - `description` (string, optional)
  - `publishDate` (date)
  - `updatedDate` (date, optional)
  - `heroImage` (string, optional)
  - `tags` (string[])
  - `draft` (boolean)

Example post (`src/content/blog/hello-world.md`):
```
---
title: "Hello World"
description: "First post"
publishDate: 2025-09-17
updatedDate: 2025-09-17
tags: ["update", "personal"]
draft: false
---

Your Markdown content here.
```

Key Files
- `package.json` — scripts and dependencies
- `astro.config.mjs` — Astro configuration
- `src/components/Header.astro` — document head, fonts, and view transitions
- `src/components/Sidebar.astro` — navigation, profile/avatar
- `src/components/Project.astro` — project card renderer
- `src/pages/index.astro` — home page
- `src/pages/blog/index.astro` — blog index (lists posts)
- `src/pages/blog/[slug].astro` — blog post page

Customization
- Profile details and avatar: edit `src/components/Sidebar.astro` and images in `public/assets/`.
- Home hero text: edit `src/pages/index.astro`.
- Colors and spacing: adjust `public/assets/styles.css`.

Deployment
- Any static host works. Typical options:
  - Netlify / Vercel: connect repo, set build command `npm run build` and output directory `dist`.
  - Static hosting: run build and upload the `dist` folder.

License
- MIT — see `LICENSE`.
