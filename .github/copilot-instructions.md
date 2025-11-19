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

- **Global styles**: Styles are organized under `src/styles/` rather than a single `styles.css` file. Global typography, table layouts, and ad container patterns live in subfolders such as `src/styles/prose/`, `src/styles/layout/`, and `src/styles/advertising/` while `src/styles/variables.css` holds design tokens.
- **CSS Modules**: Component-scoped styles are co-located with components using CSS Modules (e.g., `src/components/Sidebar/sidebar-local.module.css`).
- **Shared patterns**: Reusable page-level patterns live in `src/styles/components/` (for example an `article-detail` stylesheet or related modules used by blog and download pages).
- **Design tokens**: `src/styles/variables.css` centralizes CSS custom properties; never hardcode colors/spacing
- **Page-scoped styles**: Individual pages often include their own scoped styles under `src/pages/<route>/styles/` (examples: `src/pages/blog/styles/_blog.module.css`, `src/pages/download/styles/_download.module.css`, `src/pages/portfolio/styles/_portfolio.module.css`). Pages also import shared page patterns from `src/styles/pages/` (e.g., `listing.module.css`, `chips.module.css`). Pages may import `src/styles/variables.css` and layout CSS directly when needed.

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
- **Metadata generation**: `predev` hook auto-runs scripts before `npm run dev`; `build` commands regenerate robots.txt, ads.txt, search-index.json, sitemaps
- **Sitemap structure**: Custom sitemaps (`sitemap_index.xml`, `post-sitemap.xml`, `page-sitemap.xml`) for GSC backward compatibility; generated via `scripts/generate-sitemap.mjs` post-build; **only generated in production environment**
- **Environment-aware**: Use `import.meta.env.SITE` (Astro components), `process.env.SITE_URL` (config files), or `SITE_URL` env var
- **Asset compression**: `@playform/compress` integration handles production minification (CSS, HTML, JS, SVG, JSON); AVIF disabled in production builds via `AVIF=false` for ~10s total build time (optimal for 126+ pages)

### Environment Validation System

- **Runtime validation**: `src/lib/env.ts` provides comprehensive Zod-based validation of all environment variables at startup
- **Mode detection**: Automatically detects environment mode based on explicit settings, localhost detection, or production URL patterns
- **Type-safe access**: All environment variables are validated and cached for consistent access throughout the application
- **Development-friendly**: Analytics IDs (GTM, AdSense) are optional in development mode but required for production builds
- **Startup validation**: Environment validation occurs in `astro.config.ts` before any build processes, preventing invalid builds

**Environment Modes**:

- **Development**: Relaxed validation, analytics optional, localhost/127.0.0.1 domains supported
- **Production**: Strict validation, GTM and AdSense IDs required, proper domain format enforced
- **Staging**: Inherits development rules but can be explicitly set for preview deployments

**Mode Detection Priority** (highest to lowest):

1. `PUBLIC_SITE_ENV` explicit override (`development`/`production`/`staging`)
2. Localhost detection (`localhost`, `127.0.0.1` in SITE_URL/SITE_DOMAIN → development)
3. Production URL + NODE_ENV (`erland.me` + `NODE_ENV=production` → production)
4. Default fallback (development mode for safety)

**Build Commands**:

- `npm run build:dev` - Development mode build with AVIF images + full asset processing
- `npm run build` - Production mode with `AVIF=false` for optimized ~10s build time
- `npm run build:clean` - Force clean `dist/` before build (production optimized)
- `npm run dev` - Always runs in development mode with full image formats

**Validation Features**:

- URL format validation for `SITE_URL`
- Domain format validation with localhost support for `SITE_DOMAIN`
- GTM ID format validation (`GTM-XXXXXXXX` pattern)
- AdSense client ID validation (`ca-pub-XXXXXXXXXX` pattern)
- Numeric validation for AdSense slot IDs
- Environment-specific requirement enforcement

**Build Performance**:

- **AVIF disabled in production** via `AVIF=false` environment variable (production builds: ~10s, dev builds: ~20s)
- Sharp optimization: WebP format provides 99% of AVIF benefits with 10x faster encoding
- @playform/compress reduces build output by ~40% (CSS ~400B, HTML ~610KB, JS ~140KB total)

## Critical Commands

```bash
npm run dev          # Dev server (auto-generates metadata first via predev hook)
npm run build        # Auto-detected environment build with fresh metadata
npm run build:dev    # Development mode build (no analytics required)
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
npm run generate:sitemap # Rebuild sitemaps (post-build only)
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
- **`env.ts`**: Environment validation with Zod schemas, mode detection, and type-safe variable access

## File Organization

- **Routes**: `src/pages/` (filename = URL; dynamic routes use `[param].astro`)
- **Components**: `src/components/` (PascalCase.astro + co-located CSS modules)
- **Content**: `src/content/{blog,downloads,portfolio}/` (collections with frontmatter schemas)
- **Utilities**: `src/lib/` (camelCase.ts helpers)
- **Global styles**: `src/styles/` (for example `variables.css`, and subfolders such as `prose/`, `layout/`, `components/`, `advertising/`, and `utilities/`)
- **Component styles**: Co-located `src/components/{Component}/{component}.module.css`
- **Build scripts**: `scripts/*.mjs` (ESM Node.js)
- **Config files**: `*.config.ts` (TypeScript for type safety and IDE support)
- **Type definitions**: `src/env.d.ts` for `import.meta.env` inference
- **Static assets**: `public/` (served as-is)

## Environment Variables

Update `src/env.d.ts` when adding new environment variables to maintain TypeScript inference.

**Core Configuration**:

- `SITE_URL`: Site base URL (default: `http://localhost:4321` for development)
- `SITE_DOMAIN`: Site domain (default: `localhost` for development)
- `PUBLIC_SITE_ENV`: Explicit environment override (`development`/`production`/`staging`)

**Analytics & Tracking** (Optional in all environments):

- `PUBLIC_GTM_ID`: Google Tag Manager ID (format: `GTM-XXXXXXXX`, optional)
- `PUBLIC_ADSENSE_CLIENT`: AdSense publisher ID (format: `ca-pub-XXXXXXXXXX`, optional)
- `PUBLIC_ADSENSE_SLOT_START`: AdSense slot ID for start placement (after first content element, numeric, optional)
- `PUBLIC_ADSENSE_SLOT_END`: AdSense slot ID for end placement (before last content element, numeric, optional)
- `PUBLIC_AHREFS_DATA_KEY`: Ahrefs Web Analytics data key (optional)

**Build Configuration**:

- `AVIF`: Set to `false` in production scripts for fast WebP-only builds (default behavior)
- Minification: Handled by @playform/compress (CSS, HTML, JS, SVG, JSON automatic)
- Image optimization: Sharp + WebP format (AVIF disabled for speed)

**Validation Rules**:

- All environments: Analytics IDs optional - ads only render when configured
- Development mode: Localhost domains supported (localhost, 127.0.0.1)
- Production mode: Proper domain format enforced for SITE_DOMAIN
- All URLs validated for proper format, domains validated with regex patterns

### More Info

- Respond primarily in Indonesian. Preserve English for all technical vocabulary.
- When generating code snippets or related documentation, ensure all comments and documentation are in English.
- All commit messages and Pull Request (PR) descriptions must be written in English.
