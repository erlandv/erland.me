# Dynamic Site Configuration

The `astro.config.mjs` file has been configured to use environment variables so that URLs and domains can be adjusted dynamically.

## Environment Variables

### SITE_URL
- **Description**: Complete site URL (including protocol)
- **Default**: `https://erland.me`
- **Examples**: 
  - Development: `http://localhost:4321`
  - Staging: `https://staging.erland.me`
  - Production: `https://erland.me`

### SITE_DOMAIN
- **Description**: Domain only (without protocol)
- **Default**: `erland.me`
- **Examples**:
  - Development: `localhost`
  - Staging: `staging.erland.me`
  - Production: `erland.me`

## Usage

### 1. Using Environment Variables

Create a `.env` file in the project root:

```bash
# .env
SITE_URL=https://your-domain.com
SITE_DOMAIN=your-domain.com
```

### 2. Using Command Line

```bash
# Development
SITE_URL=http://localhost:4321 SITE_DOMAIN=localhost npm run dev

# Production with different domain
SITE_URL=https://my-new-domain.com SITE_DOMAIN=my-new-domain.com npm run build
```

### 3. Using Package.json Scripts

Add scripts to `package.json`:

```json
{
  "scripts": {
    "dev:local": "SITE_URL=http://localhost:4321 SITE_DOMAIN=localhost astro dev",
    "build:staging": "SITE_URL=https://staging.erland.me SITE_DOMAIN=staging.erland.me astro build",
    "build:prod": "SITE_URL=https://erland.me SITE_DOMAIN=erland.me astro build",
    "generate:robots": "node scripts/generate-robots.js"
  }
}
```

### 4. Dynamic Robots.txt Generation

The `generate:robots` script will create a `robots.txt` file with URLs that match the environment variable:

```bash
# Generate robots.txt with default URL
npm run generate:robots

# Generate robots.txt with custom URL
SITE_URL=https://my-domain.com npm run generate:robots
```

This script runs automatically during build:
- `npm run build` - Generate robots.txt then build
- `npm run build:clean` - Clean, generate robots.txt, then build

## Affected Configuration

These environment variables affect:

1. **Site URL** - Main site URL
2. **Image Domains** - Allowed domains for image optimization
3. **Sitemap URLs** - Custom pages URLs in sitemap
4. **Remote Patterns** - Remote patterns for image optimization
5. **SEO Configuration** - URLs and email in `src/lib/seo.ts`
6. **Structured Data** - JSON-LD schema markup using dynamic URLs
7. **Meta Tags** - Open Graph and Twitter Card using dynamic URLs
8. **Contact Email** - Email on main page (`src/pages/index.astro`)
9. **Canonical URLs** - Canonical URLs on download pages
10. **Robots.txt** - Sitemap URLs in robots.txt (generated dynamically)

## Fallback Values

If environment variables are not set, the system will use default values:
- `SITE_URL` → `https://erland.me`
- `SITE_DOMAIN` → `erland.me`
