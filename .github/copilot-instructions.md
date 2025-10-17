# Copilot Instructions for erland.me

## Project Overview

Static-first Astro personal website with type-safe content collections, minimal JavaScript, aggressive build optimizations, and a sarcastic README. Routes in `src/pages/` map directly to URLs; `[slug].astro` patterns consume content from `src/content/` collections validated by Zod schemas in `content.config.ts`.

## Architecture Essentials

### Content Collections System

- **Collections**: Three collections in `src/content/` — `blog/`, `downloads/`, `portfolio/` — each with frontmatter validated by schemas in `content.config.ts`
- **Blog & Downloads**: Type `'content'` with markdown files; supports hero images via `image()` schema helper (paths relative to markdown)
- **Portfolio**: Type `'data'` using JSON/YAML for structured project metadata (no markdown rendering)
- **Search index**: Client-side fuzzy search powered by Fuse.js; **always regenerate** via `npm run generate:search` after content changes
- **Markdown extensions**: Custom remark plugins add `:::gallery` directives (`remark-gallery.ts`) and download file tables (`remark-download-files.ts`)

### Styling Architecture

- **Global CSS**: `src/styles/styles.css` defines `.prose` typography, table layouts, and ad containers
- **CSS Modules**: Component-specific scoped styles co-located (e.g., `Sidebar/sidebar-local.module.css`)
- **Shared layouts**: `src/styles/components/article-detail.css` for patterns used by both blog and download pages
- **Design tokens**: `src/styles/variables.css` centralizes CSS custom properties; never hardcode colors/spacing

### Client-Side JavaScript Pattern

- **Lazy initialization via gates**: `src/lib/ui-init.ts` conditionally imports features only when DOM selectors match (check `hasTarget(SELECTORS.feature)` before loading)
- **Critical cache-but-reinit pattern**: Cache imported module once but **always re-execute initializer** on Astro view transitions (`astro:page-load`, `astro:after-swap`)

  ```typescript
  // WRONG: Early return blocks re-execution after navigation
  if (loaded.feature) return;
  const mod = await import('./feature');
  loaded.feature = true;

  // CORRECT: Cache module, always run initializer
  if (!loaded.feature) {
    const mod = await import('./feature');
    window.__featureInit = mod.init;
    loaded.feature = true;
  }
  window.__featureInit?.(); // Execute on every page load
  ```

- **Table responsive requirement**: `initResponsiveTables()` must run on every page to inject `data-label` attributes for mobile vertical layout

### Build & Deployment

- **Production pipeline**: GitHub Actions on `main` → build → rsync to VPS → atomic symlink swap (`current` → `releases/<sha>`) → health checks
- **Staging**: Push to `staging`/`testing` branches → Cloudflare Pages (auto-preview)
- **Metadata generation**: `predev` hook auto-runs scripts before `npm run dev`; `build` commands regenerate robots.txt, ads.txt, search-index.json
- **Environment-aware**: Use `import.meta.env.SITE` (Astro components), `process.env.SITE_URL` (config files), or `SITE_URL` env var

## Critical Commands

```bash
npm run dev          # Dev server (auto-generates metadata first via predev hook)
npm run build        # Production build with fresh metadata
npm run build:clean  # Force clean dist/ cache before build
npm run preview      # Serve built site locally for QA
npm run validate     # Lint + type-check + format:check (must pass before PR)

# Individual checks
npm run lint         # Astro check for errors/warnings
npm run type-check   # TypeScript validation only
npm run format       # Apply Prettier formatting
npm run format:check # Verify Prettier compliance

# Regenerate artifacts (usually automatic via build commands)
npm run generate:search  # Rebuild search-index.json from content
npm run generate:robots  # Rebuild robots.txt (env-aware)
npm run generate:ads     # Rebuild ads.txt (prod only)
```

## Astro Component Patterns

### Dynamic Routes with `getStaticPaths()`

**Basic pattern** (single post by slug):

```typescript
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(p => ({ params: { slug: p.slug } }));
}

const { slug } = Astro.params;
const entry = (await getCollection('blog')).find(e => e.slug === slug);
if (!entry) return Astro.redirect('/blog/');
const { Content } = await entry.render();
```

**Pagination pattern** (generate pages 2..N):

```typescript
export async function getStaticPaths() {
  const posts = await loadAllPosts();
  const pageSize = 10;
  const totalPages = Math.ceil(posts.length / pageSize);
  // Skip page 1 (handled by index.astro)
  return Array.from({ length: Math.max(0, totalPages - 1) }).map((_, i) => ({
    params: { page: String(i + 2) },
  }));
}
```

**Category filtering pattern**:

```typescript
export async function getStaticPaths() {
  const posts = await loadAllPosts();
  const categories = Array.from(
    new Set(posts.map(p => p.data?.category?.trim()).filter(Boolean))
  );
  return categories.map(c => ({ params: { category: slugifyCategory(c) } }));
}

// Filter at render time
const filtered = allPosts.filter(
  p => slugifyCategory(p.data?.category) === categoryParam
);
```

### Content Collection Rendering

Always call `entry.render()` to get the `Content` component and use it for markdown rendering:

```astro
const { Content } = await entry.render();
// In template:
<Content />
```

### Image Handling Pattern

Use `resolveHero()` from `src/lib/images.ts` to handle both frontmatter images and fallback hero images from glob imports:

```typescript
const hero = resolveHero(frontmatter.hero);
const optimizedHero = hero
  ? await getOgImageUrl(hero, 1200, 'avif')
  : undefined;
```

## Adding New Content Collections

### 1. Define Schema in `content.config.ts`

```typescript
const newCollection = defineCollection({
  type: 'content', // or 'data' for JSON/YAML only
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().max(160).optional(),
      publishDate: z.coerce.date(),
      hero: image().optional(), // For type: 'content' only
      draft: z.boolean().default(false),
      // Add custom fields
    }),
});

export const collections = { blog, downloads, portfolio, newCollection };
```

### 2. Create Content Directory

```bash
mkdir -p src/content/newCollection
# For 'content' type (markdown):
mkdir src/content/newCollection/first-entry
echo "---\ntitle: First Entry\n---\n# Content" > src/content/newCollection/first-entry/index.md
```

### 3. Create Route Pages

```astro
// src/pages/newCollection/[slug].astro
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const entries = await getCollection('newCollection');
  return entries.map((e) => ({ params: { slug: e.slug } }));
}
```

### 4. Update Search Index (if needed)

Modify `scripts/generate-search-index.mjs` to include the new collection in search results.

## Testing View Transitions

### Key Event Hooks

Astro provides two critical navigation events:

- **`astro:page-load`**: Fires on initial page load AND after view transition completes
- **`astro:after-swap`**: Fires immediately after DOM swap but before new scripts run

### Testing Pattern

```typescript
// Setup listeners
document.addEventListener('astro:page-load', () => {
  console.log('[TEST] Page loaded, DOM ready');
  // Verify elements exist, features initialized
});

document.addEventListener('astro:after-swap', () => {
  console.log('[TEST] DOM swapped, before hydration');
  // Check if old event listeners cleaned up
});
```

### Manual Testing Checklist

1. **Navigate between pages**: Click internal links to trigger view transitions
2. **Check dynamic features**:
   - Tables have `data-label` attributes on mobile
   - Code copy buttons appear on `<pre>` blocks
   - Lightbox attaches to `.prose img` elements
   - Share buttons initialize correctly
3. **Verify no duplicates**: Features shouldn't attach multiple listeners after navigation
4. **Test browser back/forward**: View transitions should work with browser history
5. **Console errors**: Check for listener cleanup issues or memory leaks

### Debugging View Transitions

Add temporary logging to `src/lib/ui-init.ts`:

```typescript
async function maybeLoadFeature(): Promise<void> {
  console.log('[DEBUG] Checking feature gate...');
  if (!hasTarget(SELECTORS.feature)) {
    console.log('[DEBUG] No target elements found');
    return;
  }
  console.log('[DEBUG] Loading feature module...');
  const mod = await import('./feature');
  console.log('[DEBUG] Feature initialized');
}
```

Watch for:

- Gates not triggering (missing DOM elements)
- Modules loading multiple times unnecessarily
- Initializers not re-running after navigation

## Project-Specific Patterns

### Table Styling: `width: 1%` Trick

First column uses `width: 1%` + `white-space: nowrap` to force minimum width based on content while allowing other columns to share remaining space proportionally. Works for 2-column (blog specs) and multi-column (download files) tables. **Never use `table-layout: fixed`** — breaks multi-column layouts.

### Responsive Tables: Mobile Vertical Layout

- **Desktop**: Standard table with `.prose table` styles
- **Mobile** (≤767px): JavaScript (`initResponsiveTables()`) injects `data-label` attributes from `<th>` text; CSS uses `::before { content: attr(data-label) }` to show labels inline with stacked `<td>` blocks
- **Must re-run** on every Astro navigation to handle dynamic content

### AdSense Integration

- **Responsive sizing**: Use `clamp()` for dimensions (`clamp(100px, 25vw, 180px)`); always set `width: 100%; max-width: 100%; overflow: hidden` to prevent mobile overflow
- **Dev placeholders**: Check `import.meta.env.PROD` to show placeholders instead of live ads in development

### Custom Markdown Directives

- **Gallery**: `:::gallery` wraps images in `.content-image-grid` with automatic `<figure>` + `<figcaption>` generation from image titles
- **Download tables**: Frontmatter `downloadFiles` array auto-generates file download tables via `remark-download-files.ts`

### Router Event Management

The project uses a centralized router event system (`src/lib/router-events.ts`) that patches `history.pushState/replaceState`:

```typescript
import { onRouteChange } from './router-events';

// Subscribe to all navigation events (push/replace/pop)
const unsubscribe = onRouteChange(event => {
  console.log(`Navigation: ${event.type} -> ${event.url}`);
  // Update UI, track analytics, etc.
});

// Clean up when done
unsubscribe();
```

This centralizes History API overrides to prevent multiple modules from conflicting patches.

### MutationObserver for Dynamic Content

`ui-init.ts` uses debounced MutationObserver to re-initialize features when content is dynamically injected:

```typescript
const observer = new MutationObserver(debounced);
observer.observe(document.body, { childList: true, subtree: true });
```

This catches cases where:

- AdSense injects ads after page load
- Client-side JavaScript adds new code blocks
- View transitions swap in new content

**Debounce delay**: 50ms to batch multiple mutations and avoid excessive re-runs.

## Naming Conventions

- **Components**: PascalCase (`HeroBanner.astro`)
- **Utilities**: camelCase (`blog.ts`, `search.ts`)
- **Routes**: kebab-case filenames (`about-us.astro`, `privacy-policy.astro`)
- **CSS Modules**: kebab-case with `.module.css` suffix (`post-card.module.css`)
- **Styles**: Two-space indentation, trailing commas, single quotes (enforced by Prettier)

## Commit & PR Guidelines

- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:` with optional scope (`fix(tables): prevent overflow on mobile`)
- **Focused commits**: Single responsibility; include regenerated files from `scripts/` in same commit
- **PR requirements**:
  - Concise summary with "Changes" sections
  - Testing checklist (`npm run validate` passed, `npm run preview` loads without errors)
  - Before/after screenshots for visual changes
  - Link related issues
- **Code review**: Add explanatory comments for clever CSS tricks; address feedback in separate commits

## Common Pitfalls

1. **Don't edit `dist/`**: Generated output; modify source or regeneration scripts instead
2. **Don't skip metadata regeneration**: Scripts run automatically in `predev`/`build` but not standalone commands
3. **Don't use `table-layout: fixed`**: Breaks multi-column tables; use `auto` with `width: 1%` on first column
4. **Don't forget `initResponsiveTables()` re-execution**: Required on every page load for mobile table layout
5. **Don't hardcode site URL**: Use `import.meta.env.SITE`, `process.env.SITE_URL`, or env variable
6. **Don't forget `npm run generate:search`**: After content changes to avoid stale search data

## Key Utility Modules

- **`blog.ts`**: `loadAllPosts()`, `slugifyCategory()`, `slicePage()` - content loading and pagination helpers
- **`images.ts`**: `resolveHero()`, `getOgImageUrl()` - image resolution and optimization
- **`seo.ts`**: `blogPostingJsonLd()`, `collectionPageJsonLd()`, `breadcrumbJsonLd()` - structured data generators
- **`search.ts`**: `postToSearchable()` - converts posts to Fuse.js searchable format
- **`ui-init.ts`**: Entry point for lazy-loading client features with gate pattern
- **`router-events.ts`**: Centralized History API event management
- **`toast.ts`**: Toast notification system for user feedback
- **`env.ts`**: Environment variable access with `SITE_URL`, `SITE_DOMAIN` constants

## File Organization

- **Routes**: `src/pages/` (filename = URL; dynamic routes use `[param].astro`)
- **Components**: `src/components/` (PascalCase.astro + co-located CSS modules)
- **Content**: `src/content/{blog,downloads,portfolio}/` (collections with frontmatter schemas)
- **Utilities**: `src/lib/` (camelCase.ts helpers)
- **Global styles**: `src/styles/styles.css` + `variables.css`
- **Component styles**: Co-located `src/components/{Component}/{component}.module.css`
- **Build scripts**: `scripts/*.mjs` (ESM Node.js)
- **Type definitions**: `src/env.d.ts` for `import.meta.env` inference
- **Static assets**: `public/` (served as-is)

## Environment Variables

Update `src/env.d.ts` when adding new environment variables to maintain TypeScript inference.

**Key variables**:

- `SITE_URL`: Site base URL (default: `https://erland.me`)
- `MINIFY_ENGINE`: `terser` or `esbuild` (default: `esbuild`)
- `ENABLE_STRIP_CONSOLE`: Remove console logs in production (requires terser)
- `PUBLIC_ADSENSE_CLIENT`: AdSense publisher ID (public prefix makes it available in client code)

### More Info

- Respond primarily in Indonesian. Preserve English for all technical vocabulary.
- When generating code snippets or related documentation, ensure all comments and documentation are in English.
- All commit messages and Pull Request (PR) descriptions must be written in English.
