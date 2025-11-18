# Erland's Personal Web

[![Built with Astro](https://astro.badg.es/v2/built-with-astro/tiny.svg)](https://astro.build)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This repository hosts just my personal website with a little blog and portfolio. It's built with **Astro**, a cutting-edge static site builder designed for modern web apps (deployed here for what is essentially a digital diary with extra steps).

This is my small corner on the interweb where I dump my notes, my achievements, and whatever else I feel like posting. Yes, I'm aware of the irony.

<details>
<summary><strong>Table of Contents</strong></summary>

- [Features](#features)
- [What's Intentionally NOT Here](#whats-intentionally-not-here)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Staging Deployment](#staging-deployment)
- [Rollback Deployment](#rollback-deployment)
- [Performance & SEO](#performance--seo)
- [Security Notes](#security-notes)
- [License & Credits](#license--credits)

</details>

## Features

There aren't many advanced features here because it was intentionally designed to be minimal. I mean, come on, it's just a personal web. What were you expecting? User authentication? Payment processing? Push notifications for new blog posts nobody reads? Get real.

- **Personal Blog**: Just a place to write stuff using Markdown. Yeah, it has tags, categories, and hero images, but let's not pretend—it's basically a glorified text file with fancy compilation steps. The server is judging me for this.
- **Portfolio Showcase**: Where I flex my work. Some different layouts, nothing that'll win awards. But it works, and that's more than most portfolio sites can say.
- **Offline Support (PWA)**: Has a service worker that caches everything so you can read my mediocre content even when your internet dies. Technically a PWA now. Revolutionary stuff for a blog that updates twice a month.
- **"Search"**: It can find things! Truly groundbreaking for 2025. Instant, client-side fuzzy search that doesn't bother the server because the server has better things to do (like absolutely nothing).
- **Gallery in Posts**: Lets me cram multiple images into blog posts without the layout having an existential crisis. Nobel Prize committee, my DMs are open.
- **Syntax Highlighting**: Makes code snippets readable instead of looking like a JSON file threw up. You're welcome.
- **SEO Ready (Theoretically)**: Auto-generates all the boring `<meta>` tags, `sitemap_index.xml`, `JSON-LD` schemas, and `robots.txt` so Google's crawlers don't get confused and file a complaint.
- **Image Click & Code Copy**: Click to zoom images. One-click code copying. Quality of life features that somehow aren't standard everywhere yet. I'm as confused as you are.
- **Toast Notifications**: Little pop-up messages that briefly interrupt your life but are actually useful. It's called UX, look it up.
- **Share Buttons**: Standard social media icons for my dozen readers who are _totally_ dying to broadcast my blog posts to their followers. The feature nobody asked for but everyone expects.
- **Instagram-like Story Viewer**: Fullscreen story modal with progress bars, auto-advance, and manual navigation. Because apparently my static site needed Instagram vibes. Complete with pause/resume and smooth transitions that'll make you forget this is just a personal web.
- **Light/Dark Theme**: Toggle between themes because choosing colors is apparently too hard in 2025. Persists your preference in `localStorage` like it's rocket science. Auto-detects system settings because I'm considerate like that.
- **Pagination**: Splits posts across pages instead of one endless scroll of regret. Apparently this counts as a feature now.
- **Adsense/Placeholder Integration**: Reserved space for ads if I ever monetize my dozen visitors. Mostly just placeholder slots judging me from the sidebar.
- **Error Boundary**: Catches JS errors before they ruin everyone's day. Shows a friendly fallback instead of letting the page implode. It's called "not being a jerk to your users."
- **Web Vitals Tracking**: Obsessively monitors every Core Web Vital and reports to Google Tag Manager. Because apparently I need hard data to confirm that yes, the site is fast. Peak developer anxiety.

## What's Intentionally NOT Here

Because apparently listing what you _didn't_ build is the new humble brag:

- **No Database**: Not MySQL, not PostgreSQL, not even SQLite. Just markdown files like it's 2010. And you know what? It works better this way.
- **No CMS**: No WordPress, no Contentful, no Strapi. I edit markdown in VS Code like our ancestors intended. I am the CMS.
- **No User Authentication**: There's nothing to log into. No accounts, no passwords, no "forgot password" flow that emails you at 3 AM. You're not that important.
- **No API Endpoints**: This is a static site. The only API calls happening here are from your browser to my CDN. That's the entire infrastructure diagram.
- **No Comment System**: Want to leave feedback? Email exists. Social media exists. I'm not running a Disqus instance for the crickets in my analytics.
- **No Real-Time Features**: No WebSockets, no Server-Sent Events, no live updates. Content updates when I push to `main`. That's the "real-time" you get. Deal with it.
- **No Server-Side Rendering**: Everything's pre-rendered at build time. No edge functions, no serverless lambdas, no "hybrid rendering modes" that require a PhD to understand. Just plain HTML—fast, dumb, and honest.

The best code is the code you don't write. This README is already 10x longer than necessary, so at least the codebase stayed minimal.

## Tech Stack

Yeah, the project is laughably minimal, but the stack? Absolutely over-engineered like I'm building the next Facebook. It's a type-safe, static-first setup that deploys itself so I can pretend to be productive. All this architectural complexity just to host what is essentially a fancy diary. Peak programmer energy.

### Core Framework

- **Astro**: The framework that finally answered the question "what if we just... didn't ship JavaScript unless absolutely necessary?" Revolutionary concept in 2025, apparently.
- **TypeScript**: Because I don't trust JS. Or myself. Or you. Especially myself. Every variable is typed. Every function returns exactly what it promises. This is a dictatorship, not a democracy.
- **Vite**: Blazing-fast build tool that's faster than my attention span. Rebuilds in milliseconds. Which is good, because I break things constantly.
- **Shiki**: Makes code blocks actually readable instead of looking like regex had a baby with a JSON error. Syntax highlighting that doesn't make your eyes bleed.
- **Sharp**: The image optimizer that does in milliseconds what Photoshop users spend 10 minutes doing manually. Automatic WebP conversion, responsive sizing, compression. It's a gift.

### Content & Styling

- **Markdown (Astro Content Collections)**: I write in Markdown like a civilized developer. This validates everything so I don't accidentally publish a post without a title (yes, I've done that. Multiple times).
- **Vanilla CSS + CSS Modules**: Plain CSS because this site is so minimal that Tailwind would be embarrassed to be here. Adding a framework would literally double my bundle size just to avoid writing `display: flex;`.
- **PostCSS**: The automated janitor that cleans up my CSS, adds vendor prefixes I always forget, and minifies everything. Doing the Lord's work.
- **SVG Icons**: Vector icons that scale infinitely and never look pixelated. Unlike my career trajectory.
- **Flaticon**: Where I sourced—_totally legally_—all the hero images from the [Basic Miscellany Blue](https://www.flaticon.com/authors/basic-miscellany/blue) pack. They're cute, they're blue, and they prevent my blog from looking like a 90s GeoCities page.
- **remark-directive**: Markdown plugins that add superpowers like gallery embeds (`remark-gallery`). Because regular Markdown is too mainstream.
- **Agave Nerd Font**: That ridiculously fancy monospace font for code blocks. Because Comic Sans wasn't an option.

### Utilities & Configuration

- **@astrojs/check**: The insufferable linter that yells at me constantly while I code. It's like having a very judgemental parrot on my shoulder.
- **@playform/compress**: Squishes CSS, HTML, JS, and SVG into tiny little packages. Because uncompressed files are for people who hate their users and their Lighthouse scores.
- **ESLint**: The strict parent of my codebase. Tells me "no semicolons there" and "that variable name is embarrassing" until I learn to code like a proper adult.
- **Prettier**: Auto-formats everything so my code looks professional even when my commit messages say "fix stuff" and "why doesn't this work."
- **Fuse.js**: Powers the instant search. No backend, no database queries, no loading spinners. Just pure client-side magic that actually works.
- **ESM Node Scripts (.mjs)**: Modern Node scripts because `.js` is so 2019 and I have a personal brand to maintain.
- **npm scripts**: All the build, test, and deploy commands. The console commands I type 500 times a day and still somehow typo.

### Deployment

- **GitHub Actions**: My unpaid, tireless CI/CD intern that never sleeps, never complains, and does everything I'm too lazy to do manually. Builds and deploys automatically so I can focus on more important things (like writing this `README.md`).
- **Nginx & Symlinks**: Production deployment with atomic symlink swaps for zero-downtime releases. Allegedly zero downtime. It's worked so far. Probably.
- **Atlantic Cloud**: Who deploys a personal static site on AWS? Please. This budget VPS handles everything I need without pretending to be a startup.
- **Cloudflare Pages**: The staging playground where things break spectacularly in private before they break publicly. It's called "testing in production" but with extra steps.

## Project Structure

This is where all the type-safe, over-complicated, yet somehow minimal code lives. Pro tip: everything that matters is in `src/`. Everything else is just build configuration masquerading as architecture.

```
.
├── .github/         # The unpaid intern's instruction manual (CI/CD workflows)
├── public/          # Static assets too simple to need processing
├── scripts/         # Automation scripts so I don't have to think
├── src/             # Where the actual magic happens (allegedly)
│   ├── components/  # Reusable UI components (fancy LEGO bricks)
│   ├── content/     # My actual writing (the content nobody reads)
│   ├── icons/       # SVG icons with unnecessarily dynamic imports
│   ├── layouts/     # Page templates (the same header/footer everywhere)
│   ├── lib/         # Helper functions that keep TypeScript happy
│   ├── pages/       # Routes (how URLs work, revolutionary concept)
│   └── styles/      # CSS that's minimal yet somehow still 50KB
├── astro.config.ts  # The master config file (one file to rule them all)
├── package.json     # Dependency manifest (my trust issues in JSON format)
├── tsconfig.json    # TypeScript rules set to "paranoid" mode
├── README.md        # You are here (why though)
└── ...              # Configuration files nobody remembers the purpose of
```

## Development Setup

Because apparently "just clone and run" is too simple for modern development. Here's how to get this unnecessarily sophisticated static site running locally without crying (much).

### Prerequisites

Let's start with the obvious stuff you should already have installed (but let's be real, you probably don't):

- **Node.js v22.18.0+**: Not optional. Not negotiable. The project will yell at you via `.nvmrc` and `package.json` engines. Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) like a civilized developer, or prepare for version mismatch hell.
- **npm v10.9.0+**: Comes with Node, but double-check anyway. Life is full of disappointments, and outdated package managers are one of them.
- **Git**: If you don't have Git installed but somehow ended up reading this on GitHub, I have questions. Many questions.
- **Basic Terminal Skills**: Can you `cd` into a directory? Can you read error messages without panicking? Good enough.

### Quick Start

```bash
# Clone the masterpiece
git clone https://github.com/erlandv/erland.me.git
cd erland.me

# Install dependencies (use ci for reproducible builds)
npm ci

# Start dev server with hot reload
npm run dev
```

The dev server runs at `http://localhost:4321` (because Astro thinks it's funny). Hot reload works. TypeScript yells at you in real-time. Life is good.

### Available Commands

```bash
npm run dev         # Dev server with auto-reload (alias: npm start)
npm run build       # Auto-detected environment build with metadata generation
npm run build:dev   # Development build (no analytics required, perfect for local testing)
npm run build:clean # Nuclear option: clean dist + full rebuild
npm run preview     # Serve production build locally for QA

# Quality checks (run these before committing unless you enjoy CI failures)
npm run validate     # All checks: lint + lint:js + type-check + format:check
npm run lint         # Astro check for errors/warnings
npm run lint:js      # ESLint check for JavaScript/TypeScript
npm run lint:js:fix  # ESLint with auto-fix
npm run type-check   # TypeScript validation only
npm run format       # Auto-format with Prettier
npm run format:check # Verify Prettier compliance (CI uses this)

# Metadata generation (usually automatic via pre-hooks)
npm run generate:robots  # Regenerate robots.txt
npm run generate:ads     # Regenerate ads.txt
npm run generate:search  # Rebuild search index from content
```

### Version Management

The project enforces strict Node.js version consistency across all environments:

- **`.nvmrc`**: Stores `22.18.0` for [nvm](https://github.com/nvm-sh/nvm) and [fnm](https://github.com/Schniz/fnm) users. Auto-switches when entering directory (if shell integration enabled).
- **`.node-version`**: Same version for [asdf](https://asdf-vm.com/) and [nodenv](https://github.com/nodenv/nodenv) users. Because the ecosystem has 47 ways to manage Node.js versions.
- **`package.json` engines**: Requires `node >= 22.18.0` and `npm >= 10.9.0`. Use `npm install --engine-strict` if you want npm to actually enforce this (it's opt-in because npm is too polite by default).
- **GitHub Actions**: CI/CD workflows read from `.nvmrc` via `node-version-file` parameter. Single source of truth, zero version drift.

Why this paranoia? Because "it works on my machine" is not acceptable when production and CI/CD need byte-for-byte reproducibility. Also because I've been burned before. Multiple times. I don't want to talk about it..

### Environment Variables

Create `.env` if you want to override defaults (optional, everything has sane fallbacks). Includes a **completely unnecessary Zod validation layer** because I have trust issues with plain text files. Yes, I validate environment variables in a static site. No, I don't have better things to do.

```bash
# Core site configuration (auto-detected if you're using localhost like a civilized developer)
SITE_URL=http://localhost:4321      # Base URL (or whatever dimension you're in)
SITE_DOMAIN=localhost               # Domain for localhost development
PUBLIC_SITE_ENV=development         # Force environment mode (development/production/staging)

# Analytics & tracking (optional for development, required for production because Google demands tribute)
PUBLIC_GTM_ID=GTM-XXXXXXX           # Google Tag Manager ID (format: GTM-XXXXXXXX)
PUBLIC_ADSENSE_CLIENT=ca-pub-...    # AdSense publisher ID (format: ca-pub-XXXXXXXXXX)
PUBLIC_ADSENSE_SLOT_BLOG_MID=12345  # AdSense slot IDs (numeric, because consistency is overrated)
PUBLIC_ADSENSE_SLOT_BLOG_END=67890  # More slot IDs for maximum monetization potential
PUBLIC_AHREFS_DATA_KEY=abc123...    # Ahrefs Web Analytics key (optional, for when GTM isn't enough)
```

**Environment Mode Detection** (because the system is smarter than you think):

1. **Explicit override**: `PUBLIC_SITE_ENV` wins every argument
2. **Localhost detection**: If you're using `localhost` or `127.0.0.1`, it assumes development (shocking insight)
3. **Production URL + NODE_ENV**: `erland.me` domain + `NODE_ENV=production` = production mode
4. **Safe fallback**: When in doubt, defaults to development (because breaking production is embarrassing)

**Build Commands for Every Mood**:

- `npm run build:dev` - Development build without analytics (for when you just want it to work)
- `npm run build` - Auto-detects environment like it's reading your mind
- `npm run dev` - Always development mode (the safe space)

All environment variables are optional with intelligent defaults. The validation system will yell at you (politely) if something's wrong. Check `src/env.d.ts` for the complete list with TypeScript types, or `src/lib/env.ts` for the Zod schemas that judge your configuration choices.

## Production Deployment

The serious, enterprise-grade deployment pipeline for what is fundamentally a glorified blog. [GitHub Actions](https://github.com/features/actions) runs on Ubuntu and uses `rsync` over SSH because apparently I have standards. The workflow lives at `.github/workflows/deploy.yml` and is longer than some of my actual blog posts.

### Prod Flow

- **Trigger & Context**: Activates on push to `main` or manual trigger (at least I didn't push on Friday). Runs in the `Production` environment. Uses path filters so it doesn't waste compute cycles when I only fix typos in this README (which happens more than I'd like to admit). Also enforces concurrency limits—only one production deploy at a time because chaos is not a deployment strategy.
- **Build**: Checks out code with `actions/checkout@v4`, sets up Node from `.nvmrc`, runs `npm ci` for deterministic installs (trust no one, not even npm), and executes `npm run build:clean` like it's launching a rocket.
- **Release Metadata**: Verifies `dist/` actually has files (because deploying an empty directory is embarrassing), then writes `.release` with the commit SHA and `.built_at` with UTC timestamp. Also publishes `version.json` so you can verify exactly how stale my content is. Transparency is key.
- **SSH Setup**: Loads the SSH key with maximum paranoia using `webfactory/ssh-agent`, pre-populates `known_hosts` with extended 60-second timeout (because slow networks exist), then prepares remote `releases/` directory. Security theater with actual security.
- **Upload**: Creates release directory at `releases/<sha>` on remote, then `rsync` pushes `dist/` with enough flags (`-az --delete-delay --partial --mkpath`) to make it look like I'm deploying nuclear launch codes. Excludes `.DS_Store` and source maps because bandwidth is precious.
- **Activate & Verify**: The grand atomic swap: `ln -sfn` points `current` to the new release SHA. Zero downtime. Probably. Then runs HTTP health checks: homepage must return `200` with 5 retry attempts, `version.json` must match `GITHUB_SHA`. Because trust, but verify. Mostly verify.
- **Optional Nginx Reload**: If `RELOAD_NGINX` is enabled, validates and reloads Nginx config. Because sometimes static file serving needs a gentle nudge.
- **Housekeeping**: Keeps only the last 5 releases (configurable via `$KEEP_RELEASES` for the truly paranoid). Old releases get purged automatically. No artifacts uploaded—this workflow believes in living dangerously (or disk space conservation, same thing).

The final, minimalist, over-engineered result lives here: **[https://erland.me](https://erland.me)**

## Staging Deployment

The sandbox where I break things safely before they embarrass me in production. Runs on GitHub Actions and publishes to [Cloudflare Pages](https://pages.cloudflare.com/) because free tier is free tier. Configuration lives at `.github/workflows/staging.yml`.

### Staging Flow

- **Trigger & Context**: Activates on push to `staging` or `testing` branches, or manual trigger. Path filters ensure it only runs when actual code changes (config files, source, scripts), not when I'm just fixing typos in documentation. Also has concurrency control—auto-cancels previous deploys if you push again because impatience is a feature.
- **Preflight Check**: Validates that all required Cloudflare secrets and vars exist before wasting time building. Fail fast philosophy in action—if `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, or `CLOUDFLARE_PROJECT_NAME` are missing, yell immediately.
- **Build**: Standard choreography: checkout code, setup Node from `.nvmrc` with npm cache enabled (because CI speed matters), `npm ci` for reproducibility, then `npm run build:clean` for a fresh build. No stale artifacts allowed.
- **Verify Output**: Sanity check that `dist/` exists and actually contains files. Fail fast if the build exploded. No point uploading an empty directory to Cloudflare and calling it a day.
- **Publish to Cloudflare**: `cloudflare/pages-action@v1` takes `./dist` and uploads it to Cloudflare's edge network. Auto-generates preview URLs per branch. Uses secrets for `apiToken` and `accountId` because security theater is still theater, and I'm putting on a show.
- **Summary**: Always runs (even if previous steps fail) to append deployment info to `GITHUB_STEP_SUMMARY`. Includes project name, branch, and commit SHA so Future Me remembers what Past Me just deployed. Communication with yourself is important.

Go ahead, try to break it: **[https://staging.erland.pages.dev](https://staging.erland.pages.dev)**

## Rollback Deployment

The big red panic button for when I push something catastrophically broken and need to undo my mistakes immediately. This workflow lets me revert to a known working version without the shame of manually SSH-ing into the server and fixing things by hand. Manual trigger only (`workflow_dispatch`) because automation has limits. Lives at `.github/workflows/rollback.yml`.

### Rollback Flow

- **Trigger**: Manual activation only via `workflow_dispatch`. Accepts optional `target_sha` input—provide a specific release SHA to jump to that version, or leave empty to automatically roll back to the previous deploy. For when you're either precise or panicking.
- **SSH Setup**: Loads the SSH key via `webfactory/ssh-agent` with paranoid connection settings (60s timeout, 3 retry attempts, strict host key checking), then updates `known_hosts`. The key can execute remote commands but can't open interactive shells—automation only, no manual meddling.
- **List Releases**: Shows available releases sorted by newest first, limited to top N versions (configured via `$KEEP_RELEASES`). So you know your escape routes before jumping. Output helps confirm the target SHA actually exists on the server.
- **Execute Rollback**: Runs `sudo astro-rollback` on the remote server. Uses `--to <SHA>` if you provided a specific target, or `--previous` to jump to the last working version. The command handles the symlink swap and all the low-level details you don't want to think about during a crisis.
- **Verify Success**: Waits 5 seconds for the rollback to settle (because instant gratification causes race conditions), then runs HTTP health checks. Verifies homepage returns `200` with retry mechanism (5 attempts). No SSH file checks—if the site loads, the rollback worked. Simple.

## Performance & SEO

It's a static site, so it's already fast by default (cheat codes enabled), but I went completely overboard anyway because apparently having a fast site isn't enough—I need a _ridiculously_ fast site. Here's my checklist for making Google's crawlers feel special:

- **Structured Data**: Comprehensive `JSON-LD` schemas for everything—`BlogPosting`, `CreativeWork`, `CollectionPage`, `BreadcrumbList`, `WebSite` with `SearchAction`. Google's Knowledge Graph loves me. Probably. Includes word count, reading time, article sections, the whole nine yards.
- **Resource Hints**: Strategic `preconnect` for Google Fonts, GTM, and AdSense domains. `dns-prefetch` as fallback. Fonts get `preload` with `crossorigin`. Search index preloads conditionally only on pages that need it. No wasted prefetching—every hint has a purpose.
- **Robot Files**: Auto-generates `robots.txt` with environment-aware rules. The boring configuration files that search engines actually read and humans pretend to understand.
- **Responsive Images**: Every image properly sized with explicit `width` and `height` attributes. No layout shifts, no browser guessing games, no excuses. Sharp handles WebP conversion and compression automatically.
- **Social Tags**: Comprehensive OG and Twitter meta tags with proper image dimensions (1200×630), alt text, and all the metadata social networks demand. When you share a link, it doesn't look like it's from 2005. First impressions matter, even for URLs.
- **Minimal JS**: Almost zero JavaScript execution. Only the absolutely essential interactive bits get hydrated. Everything else is good old-fashioned HTML. Groundbreaking, I know. Manual chunk splitting keeps vendor code separate for better caching.
- **HTML Compression**: Production builds minify HTML output. Because every byte counts when you're obsessing over Lighthouse scores.
- **Pagination SEO**: Proper `rel="prev"` and `rel="next"` links for paginated content. Google knows how series work. Do you? (Probably not.)

## Security Notes

It's literally just static HTML files. No database, no server-side code. The worst-case scenario is someone replaces my homepage with a meme. But we still implement proper security measures because doing things properly is a reflex at this point, not a choice:

- **GitHub Actions Permissions**: Workflows locked down with principle of least privilege because I watched one too many "supply chain attack" conference talks. Production and rollback get `contents: read` only. Staging adds `deployments: write` for Cloudflare. No blanket write access unless a workflow is literally begging for it with a signed permission slip.
- **Environment Protection**: Separate GitHub Environments (Production vs Staging) with isolated secrets because mixing environments is how you accidentally deploy staging credentials to prod and spend your Saturday crying. Production can be gated with required reviewers and wait timers if I ever get important enough to need that level of bureaucracy.
- **Deploy Key**: SSH key scoped exclusively to deployment operations—can run rsync and rollback scripts but absolutely cannot open interactive shells. It's the digital equivalent of giving someone a key that only opens one specific drawer.
- **SSH Hardening**: Paranoid SSH config with `BatchMode=yes` (no interactive prompts—automation doesn't have feelings), `StrictHostKeyChecking=yes` (MITM attacks are so 2010), `PreferredAuthentications=publickey` (passwords are for accounts you want compromised), IPv4-only, connection timeouts, and keepalive settings. Non-standard port because script kiddies are lazy and so am I.
- **Passwordless Sudo (Scoped)**: Server configured with passwordless sudo for exactly two commands: `nginx -t` and `systemctl reload nginx`. No blanket sudo access. Every privilege grant is documented, justified, and minimal. I treat sudo permissions like Michelin stars—hard to get, easy to lose.
- **Server Setup**: Non-root user running everything, tight file permissions (umask `022` because I'm not an anarchist), symlink isolation so the server only sees active release directory. Releases don't share data or talk to each other. It's like witness protection but for HTML files.
- **CI Safety**: All secrets properly masked in GitHub Actions logs. No accidental credential leaks when CI inevitably explodes because I forgot a semicolon. Sensitive values never appear in build output, error messages, or my public shame when things break.

## License & Credits

Even unnecessarily complex personal websites need proper licensing. Lawyers insist on it, apparently.

- **License**: MIT License. Copy it, fork it, claim you built it from scratch in a weekend—I genuinely don't care. Just don't sue me when it inevitably breaks. Full legalese in [LICENSE](./LICENSE).
- **Credit**: This wasn't entirely my original idea. I took an existing theme, added features nobody asked for, removed features people probably liked, and somehow made it both simpler _and_ more complicated at the same time.
  - **Original theme**: [Codefolio](https://github.com/danielunited/codefolio) by Daniel Alter. Solid foundation, saved me weeks of work.
  - **The Culprit**: Modified, "improved," and over-engineered by Erland (that's me, unfortunately).

---

> _Wait, you actually read this entire README for a personal static site? That's either impressive dedication or a concerning lack of better things to do. Possibly both._
>
> _Either way, thanks for reading. You're probably the only person who will. Now go touch some grass or something._
