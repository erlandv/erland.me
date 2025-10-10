# Erland's Personal Web

[![Built with Astro](https://astro.badg.es/v2/built-with-astro/tiny.svg)](https://astro.build)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This repository hosts just my personal website with a little blog and portfolio. It's built with **Astro**, a cutting-edge static site builder designed for modern web apps (deployed here for what is essentially a digital diary with extra steps). This is my small corner on the interweb where I dump my notes, my achievements, and whatever else I feel like posting. Yes, I'm aware of the irony.

## Features

There aren't many advanced features here because it was intentionally designed to be minimal. I mean, come on, it's just a personal web. What were you expecting? User authentication? Payment processing? Push notifications for new blog posts nobody reads?

- **Personal Blog**: Just a place to write stuff using Markdown. Yeah, it has tags, categories, and hero images, but let's not pretend—it's basically a glorified text file with extra steps.
- **Portfolio Showcase**: Where I flex my work. Some different layouts, nothing that'll win awards. But it works, and that's more than most portfolio sites can say.
- **"Search"**: It can find things! I know, truly revolutionary for 2025. It's instant, client-side fuzzy search that doesn't bother the server because the server has better things to do (like nothing).
- **Gallery in Posts**: Lets me cram multiple images into blog posts without the layout having an existential crisis. Someone give me a medal.
- **Syntax Highlighting**: Makes code snippets actually readable instead of looking like a JSON file threw up. You're welcome.
- **SEO Ready (Theoretically)**: Auto-generates all the boring `<meta>` tags, `sitemap-index.xml`, and `robots.txt` so Google's crawlers don't get confused and cry.
- **Image Click & Code Copy**: Click to zoom images. One-click code copying. Quality of life features that somehow aren't default everywhere yet. I'm as confused as you are.
- **Toast Notifications**: Little pop-up messages that briefly interrupt your life but are actually useful for feedback. It's called UX, look it up.
- **Share Buttons**: Standard social media sharing icons. Because clearly my dozen readers are dying to broadcast my blog posts to their followers. The feature nobody asked for but everyone expects.
- **Pagination**: The blog splits posts across pages instead of creating one endless scroll of regret. Apparently this counts as a feature now.
- **Adsense/Placeholder Integration**: Reserved space for ads (if I ever feel like monetizing my dozen visitors) or just melancholic placeholders for dev environments.

## Tech Stack

Yeah, the project is laughably minimal, but the stack? Absolutely over-engineered like I'm building the next Facebook. It's a type-safe, static-first setup that deploys itself so I can pretend to be productive. All this architectural complexity just to host what is essentially a fancy diary. Peak programmer energy.

### Core Framework

- **Astro**: The main engine that powers this beast. It spits out static files faster than you can say "_why not just use WordPress?_"
- **TypeScript**: Aggressive type checking everywhere because I don't trust JavaScript. Or anyone. Or myself. Especially myself.
- **Vite**: The blazing-fast build tool that Astro uses. It's fast. I'm fast. We're all fast. Speed matters when you're rebuilding for the 47th time today.
- **Shiki**: The syntax highlighter that makes code blocks look professional instead of like someone sneezed RegEx onto the screen.
- **@astrojs/sitemap**: Auto-generates sitemaps for search engine robots. Because apparently robots need GPS too.
- **Sharp**: The image optimizer that does in milliseconds what Photoshop users spend 10 minutes doing manually. Automatic WebP conversion, responsive sizing, compression.
- **Terser**: Optional JavaScript minifier that squeezes files smaller than necessary. Because I'm petty about kilobytes.

### Content & Styling

- **Markdown (Astro Content Collections)**: I write in Markdown like a civilized developer. This validates everything so I don't accidentally publish a post without a title (yes, I've done that. Multiple times).
- **Vanilla CSS + CSS Modules**: Plain CSS because this site is so minimal that Tailwind would be embarrassed to be here. Adding a framework would literally double my bundle size just to avoid writing `display: flex;`.
- **PostCSS**: The automated janitor that cleans up my CSS, adds vendor prefixes I always forget, and minifies everything. Doing the Lord's work.
- **SVG Icons**: Vector icons that scale infinitely and never look pixelated. Unlike my career trajectory.
- **Flaticon**: Where I stole—sorry, _licensed_—all the hero images from the [Basic Miscellany Blue](https://www.flaticon.com/authors/basic-miscellany/blue) pack. They're cute. Sue me. (Please don't.)
- **Agave Nerd Font**: That ridiculously fancy monospace font for code blocks. Because Comic Sans wasn't an option.

### Utilities & Configuration

- **@astrojs/check**: The insufferable linter that yells at me constantly while I code. It's like having a very judgemental parrot on my shoulder.
- **Prettier**: Auto-formats everything so my code looks professional even when my commit messages say "fix stuff" and "why doesn't this work."
- **Fuse.js**: Powers the instant search. No backend, no database queries, no loading spinners. Just pure client-side magic that actually works.
- **remark-directive**: Markdown plugins that add superpowers like gallery embeds (`remark-gallery`). Because regular Markdown is too mainstream.
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

## Production Deployment

The serious, enterprise-grade deployment pipeline for what is fundamentally a glorified blog. [GitHub Actions](https://github.com/features/actions) runs on Ubuntu and uses `rsync` over SSH because apparently I have standards. The workflow lives at `.github/workflows/deploy.yml` and is longer than some of my actual blog posts.

### Prod Flow

- **Trigger & Context**: Activates on push to `main` or manual trigger (at least I didn't push on Friday). Runs in the `Production` environment with a generous 30-minute timeout (static sites build fast, but paranoia doesn't). Uses path filters so it doesn't waste compute cycles when I only fix typos in this README (which happens more than I'd like to admit).
- **Build**: Checks out code with `actions/checkout@v4`, sets up Node 20.18.x (because version pinning is how we avoid 3am debugging sessions), runs `npm ci` for deterministic installs (trust no one, not even npm), and executes `npm run build:clean` like it's launching a rocket.
- **Release Metadata**: Writes `.release` with the commit SHA and `.built_at` with UTC timestamp. Also publishes `version.json` so you can verify exactly how stale my content is. Transparency is key.
- **SSH & Upload**: Loads the SSH key with maximum paranoia, then `rsync` pushes `dist/` to `releases/<sha>` with enough flags (`-az --delete-delay --partial --mkpath`) to make it look like I'm deploying nuclear launch codes.
- **Activate & Verify**: The grand atomic swap: `ln -sfn` points `current` to the new release SHA. Zero downtime. Probably. Then runs health checks: homepage must return `200`, key assets must exist, `version.json` must match `GITHUB_SHA`. Because trust, but verify. Mostly verify.
- **Housekeeping**: Keeps only the last 5 releases (configurable via `$KEEP_RELEASES` for the truly paranoid). Also uploads `dist-<sha>` as an artifact for 7 days because I like having backups of my backups.

The final, minimalist, over-engineered result lives here: **[https://erland.me](https://erland.me)**

## Staging Deployment

The sandbox where I break things safely before they embarrass me in production. Runs on GitHub Actions and publishes to [Cloudflare Pages](https://pages.cloudflare.com/) because free tier is free tier. Configuration lives at `.github/workflows/staging.yml`.

### Staging Flow

- **Trigger & Context**: Activates on push to `staging` or `testing` branches. Path filters ensure it only runs when I change actual code, not when I'm just fixing typos (again).
- **Build**: Standard choreography: checkout code, setup Node with npm cache (because I'm too impatient for fresh installs every time), `npm ci` for reproducibility, then `npm run build` to generate the static files.
- **Verify Output**: Sanity check that `dist/` exists and isn't an empty directory. Fail fast if the build exploded. No point deploying nothing.
- **Publish to Cloudflare**: `cloudflare/pages-action@v1` takes `./dist` and uploads it to Cloudflare's edge network. Uses secrets for `apiToken` and `accountId` because security theater is still theater, and I'm putting on a show.
- **Summary**: Appends deployment info to `GITHUB_STEP_SUMMARY` so Future Me remembers what Past Me just deployed. Communication with yourself is important.

Go ahead, try to break it: **[https://staging.erland.pages.dev](https://staging.erland.pages.dev)**

## Rollback Deployment

The big red panic button for when I push something catastrophically broken and need to undo my mistakes immediately. This workflow lets me revert to a known working version without the shame of manually SSH-ing into the server and fixing things by hand. Manual trigger only (`workflow_dispatch`) because automation has limits. Lives at `.github/workflows/rollback.yml`.

### Rollback Flow

- **Trigger**: Manual activation only. Can provide a specific release SHA to jump to, or just roll back to the previous deploy if I'm too panicked to remember which version worked.
- **SSH Setup**: Loads the read-only SSH key (can't login to shell, can only copy files—paranoia breeds security) and updates `known_hosts`. Security even in crisis.
- **List Releases**: Shows the last 5 available versions currently on the server. So I know my escape routes before jumping.
- **Execute Rollback**: Runs `astro-rollback` command on the remote server. Uses `--to <SHA>` if I provided one, or `--previous` if I'm having a bad day and can't think straight.
- **Sanity Check**: Verifies that `index.html` exists in the now-active `current/` symlink. Because if the homepage is missing, we've got existential problems beyond rollback.

## Performance & SEO

It's a static site, so it's already fast by default (cheat codes enabled), but I went completely overboard anyway because apparently having a fast site isn't enough—I need a _ridiculously_ fast site. Here's my checklist for making Google's crawlers feel special:

- **Sitemap & URLs**: `@astrojs/sitemap` handles everything automatically. Every page gets its proper canonical URL. Robots appreciate good organization, and I'm nothing if not organized (this README notwithstanding).
- **Robot Files**: Auto-generates `robots.txt`—the boring configuration files that search engines actually read and humans pretend to understand.
- **Font Loading**: Fonts preload with `font-display: swap` so there's no awkward invisible text phase. Your eyeballs deserve better than FOIT (Flash of Invisible Text, look it up).
- **Responsive Images**: Every image properly sized with explicit `width` and `height` attributes. No layout shifts, no browser guessing games, no excuses.
- **Social Tags**: Comprehensive OG and Twitter meta tags so when you share a link, it doesn't look like it's from 2005. First impressions matter, even for URLs.
- **Minimal JS**: Almost zero JavaScript execution. Only the absolutely essential interactive bits get hydrated. Everything else is good old-fashioned HTML. Groundbreaking, I know.

## Security Notes

It's literally just static HTML files. No database, no server-side code. The worst-case scenario is someone replaces my homepage with a meme. But we still implement proper security measures because doing things properly is a reflex at this point, not a choice:

- **Deploy Key**: Strictly read-only SSH key, scoped exclusively to this project, cannot be used for shell login. It can copy files. That's it. That's the whole permission set.
- **SSH Protocol**: Modern cipher suites, strict `known_hosts` validation, no deprecated algorithms. No lazy shortcuts like agent-forwarding or password auth. We're doing this properly or not at all.
- **Server Setup**: Non-root user running the site, tight file permissions (safe `umask 022`), server only sees the currently active directory via symlink. Principle of least privilege taken seriously.
- **CI Safety**: All secrets properly masked in GitHub Actions logs. No accidental credential leaks when the CI inevitably yells at me for breaking something.

## License & Credits

Even unnecessarily complex personal websites need proper licensing. Lawyers insist on it, apparently.

- **License**: MIT License. Take it, fork it, modify it, do whatever you want. Full legal mumbo-jumbo in [LICENSE](./LICENSE).
- **Credit**: This wasn't entirely my original idea. I aggressively modified an existing theme, added a bunch of features, removed others, over-engineered the deployment, and somehow made it both simpler _and_ more complicated.
  - Original theme: [Codefolio](https://github.com/danielunited/codefolio) by Daniel Alter. Solid foundation, big thanks!
  - The Culprit: Modified, "simplified," and over-engineered by Erland (that's me, hi)

---

> _Wait, you actually read this entire README for a personal static site? That's either impressive dedication or concerning lack of better things to do. Possibly both._
>
> _Either way, you have my deepest admiration and mild concern. Maybe go outside? Touch some grass? No judgment._
>
> _But seriously, thanks for reading. You're probably the only one who will._
