# CSS Modules Migration Guide

This document describes the new CSS structure, conventions, and practical tips used in this project after migrating from a single global stylesheet to CSS Modules, with pixel‑perfect parity maintained.

## Overview

- Components use local CSS modules alongside their `.astro` files.
- Pages use shared page‑level modules under `src/styles/pages/*` for layout blocks reused across routes.
- True globals remain for base resets, theme, utilities, prose, and Sidebar behavior.

## Directory Structure

- Global styles
  - `src/styles/base.css`: resets (box‑sizing, element defaults)
  - `src/styles/variables.css`: CSS custom properties
  - `src/styles/styles.css`: global utilities + dark theme
  - `src/styles/gallery.css`: markdown gallery grid (global)
- Page modules (`src/styles/pages/*`)
  - `download.module.css`: Download index/detail
  - `blog.module.css`: Blog detail header/meta
  - `listing.module.css`: Listing layout (items/resouce grid)
  - `portfolio.module.css`: Home + Portfolio project sections
  - `fold.module.css`: Fold/lead blocks (home, portfolio, privacy, 404)
  - `button.module.css`: Shared button styles
  - `error.module.css`: 404 page visuals
  - `hero.module.css`: Shared hero image (used by Blog; Download pending)
- Component modules
  - `src/components/*/*.module.css` (e.g., `PostCard/post-card.module.css`)

## What Stays Global (by design)

- Theme + layout core: `body` dark theme, `.content`, `.main`, `.container`
- Utilities and Webflow‑derived classes: `.w-*`, `.w-nav*`
- Prose/Markdown stack: `.prose`, code blocks
- Sidebar (stateful + responsive): left global to preserve behavior
- Gallery grids: kept global in `gallery.css` for consistency across markdown outputs

## Conventions

- Naming
  - Components: BEM‑like class names in module files (e.g., `post-card__title`)
  - Page modules: descriptive, route‑focused names (`download-hero`, `error-content`)
- Imports & ownership
  - Global CSS imported once at layout level: `SiteLayout.astro`
  - Page/Component modules imported where they are used
- Specificity & tokens
  - Prefer `class:list` to compose classes and preserve required global tokens (e.g., `w-inline-block`, `w--current`)
  - Avoid `!important`; if a global utility overrides module rules, either:
    - Increase specificity (e.g., `.error-actions .homepage-button`), or
    - Drop the conflicting global token from the element when safe

## Using `class:list`

- Combine module classes with global tokens without losing script selectors or state classes:
  ```astro
  <a class:list={[styles.button, 'w-button', selected && 'w--current']}>...</a>
  ```
- For script‑driven selectors (e.g., `.share__native`), keep the literal token:
  ```astro
  <div class:list={[styles['share__native'], 'share__native']} />
  ```

## Migration Workflow (repeatable)

1. Identify a scoped block (component or page section)
2. Create `.module.css` and copy styles from `styles.css`
3. Import module in the `.astro` file; map `class` → module keys
4. Preserve required global tokens via `class:list`
5. Verify parity (desktop/mobile)
6. Remove migrated rules from `styles.css` (globals)

## Parity Checklist

- Spacing: margins/padding identical (check headings & cards)
- Typography: font sizes, weights, colors
- Hover/focus: links and buttons
- Responsive: breakpoints behave the same
- Script selectors: native share, copy buttons, mobile overlays

## Notes & Decisions

- Sidebar: high coupling with `html[data-sidebar]` selectors; left global
- Download hero: temporarily left global to keep exact parity; migrate later with a wrapper if needed
- 404 page: now module‑based (`error.module.css`), ensuring rounded buttons via specificity and no `!important`

## Troubleshooting

- “Could not import … module.css”: verify path under `src/styles/pages/*` and module name
- Global overrides winning: increase selector specificity or remove conflicting global class
- Lint/format: run `npm run validate` and `npm run format`

## Examples

- Preserving state tokens (Sidebar nav):
  ```astro
  <a class:list={[navStyles['nav-link-container'], 'w-inline-block', selected && 'w--current']}>...</a>
  ```
- Container‑scoped overrides (404):
  ```css
  .error-actions .homepage-button {
    border-radius: 8px;
  }
  .error-actions .secondary-button {
    border-radius: 8px;
  }
  ```

## Maintenance

- Prefer modules for page/component changes; only add globals when truly cross‑cutting
- Keep imports centralized in `SiteLayout.astro`
- Document any exceptions or script‑dependent selectors in this doc
