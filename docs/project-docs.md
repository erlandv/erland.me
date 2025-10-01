# erland.me Astro Project Documentation

## Overview

This documentation provides a comprehensive guide for developers to run, develop, and maintain the `erland.me` Astro project. It covers project structure, setup, development workflow, coding conventions, CSS modules, build commands, and best practices.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Setup & Installation](#setup--installation)
3. [Development Workflow](#development-workflow)
4. [Build & Test Commands](#build--test-commands)
5. [Coding Style & Conventions](#coding-style--conventions)
6. [CSS Modules Guide](#css-modules-guide)
7. [Content Management](#content-management)
8. [Configuration & Environment](#configuration--environment)
9. [Commit & PR Guidelines](#commit--pr-guidelines)
10. [Troubleshooting](#troubleshooting)
11. [Maintenance](#maintenance)

---

## 1. Project Structure

- `src/pages`: Astro routes (e.g., `blog/[slug].astro`, `download/[slug].astro`).
- `src/components`: Reusable UI components in PascalCase (e.g., `Header.astro`, `PostCard.astro`).
- `src/layouts`: Shared layouts (`SiteLayout.astro`).
- `src/lib`: Utilities and custom plugins (`env.ts`, `seo.ts`, `remark-gallery.ts`).
- `src/content`: Markdown content and assets, configured via `src/content.config.ts`.
- `public`: Static files (fonts, icons, JS) served as-is.
- `scripts/`: Build helpers (e.g., `generate-robots.ts`).
- `docs/`: Project documentation (this file, CSS Modules guide).
- Root config: `astro.config.ts`, `tsconfig.json`, `.prettierrc`, `package.json`.

---

## 2. Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/erlandv/erland.me.git
   cd erland.me
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Run the development server:**
   ```bash
   npm run dev
   ```
   The site will be available at `http://localhost:4321` (default Astro port).

---

## 3. Development Workflow

- Use `npm run dev` for local development with hot-reload.
- Edit content in `src/content` (Markdown) and components in `src/components`.
- For new pages, add `.astro` files in `src/pages`.
- Use TypeScript for utilities and configs in `src/lib`.
- CSS Modules are preferred for styling components/pages.
- Validate changes with `npm run lint` and `npm run preview`.

---

## 4. Build & Test Commands

- `npm run dev` / `npm start`: Start local dev server.
- `npm run build`: Build static site to `dist/`.
- `npm run preview`: Serve built site for verification.
- `npm run lint`: Run Astro diagnostics (syntax + types).
- `npm run type-check`: Type-only validation.
- `npm run format`: Format code with Prettier.
- `npm run format:check`: Check formatting.
- `npm run validate`: Lint + type-check + format check.
- `npm run generate:robots`: Generate robots.txt

---

## 5. Coding Style & Conventions

- **Formatting:** Prettier; 2-space indent; LF line endings; ESM (`"type": "module"`).
- **Components:** PascalCase; **Pages:** kebab-case; dynamic routes in brackets (`[slug]`).
- **TypeScript:** Preferred in `src/lib/*` and configs; add explicit types where reasonable.
- **CSS:** Use CSS Modules for components/pages; keep selectors minimal and reusable.

---

## 6. CSS Modules Guide

See [CSS Modules Migration Guide](./css-modules.md) for:

- Directory structure for global, page, and component styles
- Naming conventions (BEM-like, descriptive route-focused)
- How to use `class:list` for combining module and global classes
- Migration workflow and parity checklist
- Troubleshooting common issues
- Maintenance tips

---

## 7. Content Management

- Markdown content is stored in `src/content` (e.g., `blog/`, `downloads/`).
- Configure content collections in `src/content.config.ts`.
- Assets (images, files) are placed in `public/assets`.
- For new blog posts or downloads, add Markdown files in the respective folders.

---

## 8. Configuration & Environment

- Main config: `astro.config.ts` (site, build, markdown, Vite, integrations).
- Environment variables: Use `src/lib/env.ts` and `import.meta.env`.
- Never hardcode secrets; use `.env` files if needed.
- Update config files cautiously; always validate with `npm run validate` and `npm run preview`.

---

## 9. Commit & PR Guidelines

- Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):
  - `feat`, `fix`, `chore`, `refactor(scope)`, `docs` (e.g., `fix(astro): remove hydration directive from SidebarController`).
- PRs should include:
  - Concise summary
  - Linked issue (if any)
  - Screenshots for UI changes
  - Commands run (`npm run validate`)
- Keep diffs focused; avoid unrelated refactors.

---

## 10. Troubleshooting

- **Build errors:** Run `npm run validate` to check lint, types, and formatting.
- **CSS module import issues:** Verify path and module name.
- **Global overrides:** Increase selector specificity or remove conflicting global class.
- **Content not rendering:** Check Markdown file location and frontmatter.
- **Dev server issues:** Ensure dependencies are installed and port is available.

---

## 11. Maintenance

- Prefer CSS modules for new/changed components/pages.
- Keep global styles minimal and only for cross-cutting concerns.
- Centralize global imports in `SiteLayout.astro`.
- Document exceptions or script-dependent selectors in `docs/css-modules.md`.
- Regularly run `npm run validate` to ensure code quality.

---

## References

- [Astro Documentation](https://docs.astro.build/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prettier](https://prettier.io/)
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

---

For further details on CSS Modules and migration, see [docs/css-modules.md](./css-modules.md).
