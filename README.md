# Erland's Personal Web

[![Built with Astro](https://astro.badg.es/v2/built-with-astro/tiny.svg)](https://astro.build)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This repository hosts just my personal website with a little blog and portfolio. It’s built with **Astro**, a cutting-edge static site builder that makes everything fast and simple (which is a bit over-the-top for a site this minimal, but whatever). This is my small corner on the interweb where I just dump my notes, my achievements, and whatever else I feel like posting.

## Features

There aren't many advanced features available in this project because it was intentionally designed to be minimal. Come on, it's just a personal web, what did you expect? The Live Chat feature?

- **Personal Blog**: Just a place to write stuff using Markdown. Yeah, it has tags, categories, and hero images, but mostly it's just plain text.
- **Portfolio Showcase**: I can show off my work here. You know, with some different layouts, nothing too complicated.
- **"Search"**: It can find things! It's an instant, client-side fuzzy search function so it doesn't even bother the server.
- **Gallery in Posts**: Allows me to cram more than one image into my blog posts without breaking the layout. Fancy.
- **Syntax Highlighting**: Makes code snippets look nice because nobody wants to read ugly code.
- **SEO Ready (Slightly)**: Generates the boring `<meta>` tags, `sitemap-index.xml`, and `robots.txt` stuff automatically so Google doesn't get confused.
- **Image Click & Code Copy**: You can click on images to see them bigger and there's a handy button to copy the code easily. Low-effort quality of life features.
- **Toast Notifications**: Little pop-up messages that annoy you briefly but are kinda helpful for user feedback.
- **Share Buttons**: Just icons to share my content on social media. Standard stuff.
- **Pagination**: The blog doesn't just display everything on one giant page. It splits them up. Revolutionary.
- **Adsense/Placeholder Integration**: Space reserved for ads (if I ever bother to activate them) or just placeholders for dev/staging.
- **Utilities & Scripts**: Includes some boring little scripts to generate necessary files like the `robots.txt` and the `search-index.json`. All checked by TypeScript.

## Tech Stack

Yeah, the project is minimal, but the stack is totally over-engineered for a personal site. It's a type-safe, static-first setup that mostly deploys itself without me having to worry much. All this effort just to minimize future effort.

### Core Framework

- **Astro 5.1.5**: The main engine for building this thing. It just spits out static files, which is cool.
- **TypeScript**: Overkill type checking across the board. Keeps me from making dumb mistakes.
- **Vite**: The standard build and dev server stuff that Astro uses. It's fast, whatever.
- **Shiki**: What makes the code blocks look so pretty and readable.
- **@astrojs/sitemap**: A little script that tells search engines where all the pages are.
- **Sharp**: Handles the image resizing and making them load fast. Can be swapped out for other things if needed.
- **Terser**: Optional setting to make the final JavaScript files as small as possible.

### Content & Styling

- **Markdown (Astro Content Collections)**: I write everything in Markdown. This part makes sure I don't forget to add a title or a tag (it _validates_ the content).
- **Vanilla CSS + CSS Modules**: We keep the styling simple, old-school CSS. No heavy libraries or huge frameworks here: we aren't fancy enough for Tailwind.
- **PostCSS**: Cleans up the CSS when I'm done, like adding browser prefixes and slimming it down.
- **SVG Icons**: Simple vector icons that always match the theme perfectly.
- **Flaticon**: The source for all hero images (from [Basic Miscellany Blue](https://www.flaticon.com/authors/basic-miscellany/blue) pack).
- **Agave Nerd Font**: That fancy font used specifically for code and technical details.

### Utilities & Configuration

- **@astrojs/check**: The tool that constantly nags me about errors while I'm coding.
- **Prettier**: Auto-formats the code so it always looks neat and tidy.
- **Fuse.js**: The library that makes the search bar work instantly on the page.
- **remark-directive**: A couple of plugins to make Markdown do extra tricks, like embedding a gallery (`remark-gallery`).
- **ESM Node Scripts (.mjs)**: Allows me to run little maintenance scripts (like generating the `robots.txt`) using modern Node.
- **npm scripts**: All the build, test, and setup commands. You know, the usual stuff.

### Deployment

- **GitHub Actions**: This is the unpaid intern that runs my entire CI/CD. It builds and deploys everything automatically so I barely have to lift a finger.
- **Nginx & Symlinks**: The production server setup is very serious—it switches the new version instantly so the site is never down. Again, _allegedly_.
- **Atlantic Cloud**: Do you think I'd use GCP/AWS for a personal static site? Absolutely no. Unless you're footing the bill.
- **Cloudflare Pages**: This is where I push stuff to make sure it breaks somewhere else first. It's the staging area, so the live site stays clean.

## Project Structure

This is where all the over-engineered minimal code lives. If you get lost, just remember the site basically runs on the files inside the `src/` folder.

```
.
├── .github/           # All the paperwork for the unpaid intern (CI/CD workflows).
├── public/            # Dumb static assets (images, fonts, favicon, etc.).
├── scripts/           # Little helper scripts so I don't have to automate manually.
├── src/               # The main brain of the site.
│   ├── components/    # All the reusable LEGO bricks (UI elements).
│   ├── content/       # Where the actual blog posts and data are stored (the stuff I write).
│   ├── icons/         # SVG icons assets with dynamic imports.
│   ├── layouts/       # The overall template structure for pages.
│   ├── lib/           # Random helper functions that keep things type-safe and clean.
│   ├── pages/         # This is how Astro figures out the website URLs (the routes).
│   └── styles/        # Where the fancy (but minimal) CSS lives.
├── astro.config.mjs   # Tells Astro how to build the site (the master settings file).
├── package.json       # List of all the dependencies (the necessary tools).
├── tsconfig.json      # The strict rules for TypeScript.
├── README.md          # You are here.
└── ...                # Other boring root files that nobody ever looks at.
```

## Production Deployment

This is the serious, grown-up process for getting the site live. We use [GitHub Actions](https://github.com/features/actions) (running on a boring Ubuntu computer) to move the files to the main server using an old tool called `rsync` over SSH. Don't worry about the file; it's just a long script: `.github/workflows/deploy.yml`.

### Prod Flow

- **Trigger & context**: It starts on push to `main` or via a manual `workflow_dispatch` (if I'm feeling fancy). It runs in the `Production` environment with a generous 30m timeout (yeah, I know, static sites build fast). It uses `paths filter` so it doesn't even bother running if I only change something irrelevant.
- **Build**: The `actions/checkout@v4` runs, sets up Node.js 20.18.x, runs a deterministic install (`npm ci`), and finally, the atomic build: `npm run build:clean`.
- **Release metadata**: Writes some vital stats: `.release` (with the commit SHA) and `.built_at` (UTC timestamp). Plus, it publishes a little `version.json` file so you can check how old the site is.
- **SSH & upload**: The SSH key gets loaded up securely, then the magic: `rsync` pushes the `dist/` folder to the `releases/<sha>` directory. I use all the confusing flags (`-az --delete-delay --partial --mkpath`) to make sure the transfer is serious.
- **Activate & verify**: The big swap: `ln -sfn` points current to the new release SHA. Zero downtime, supposedly. Then, we do the basic health check: `HEAD/GET /` and key assets must return `200`, and the `version.json` has to match the `GITHUB_SHA`. _Paranoid much?_
- **Housekeeping**: We clean up, keeping only the last `$KEEP_RELEASES` (default 5) so the server doesn't drown in old builds. Also, upload the `dist-<sha>` as an artifact for 7 days (because paranoia).

You can see the final, glorious, minimal result here: **[https://erland.me](https://erland.me)**.

## Staging Deployment

This is the "playground" deployment where I test things so I don't accidentally ruin the real site. It runs on GitHub Actions and publishes everything to [Cloudflare Pages](https://pages.cloudflare.com/). (Again, who cares about the filename? It's here: `.github/workflows/staging.yml`).

### Staging Flow

- **Trigger & context**: Triggers on `push` to `staging` or `testing`. Crucially, it uses `paths filter` so it only runs if I change relevant files (like `src/**` or `astro.config.ts`).
- **Build**: Standard setup: `actions/checkout@v4`, `setup-node@v4` (with npm cache, because I'm impatient), `npm` ci for determinism, and then the plain old `npm run build`.
- **Verify build output**: A basic sanity check: ensure `dist/` exists and isn't empty. We fail fast if the build broke, obviously.
- **Publish to Cloudflare Pages**: The grand finale: `cloudflare/pages-action@v1` takes the `./dist` folder and publishes it. It uses secrets for the `apiToken` and `accountId`, because security theater.
- **Summary**: Appends a deployment summary to `GITHUB_STEP_SUMMARY` (mainly so I don't forget which branch I just deployed).

The testing version is here, try to break it: **[https://staging.erland.pages.dev](https://staging.erland.pages.dev)**.

## Rollback Deployment

Sometimes I push a change that just breaks everything. It happens. This workflow is the panic button—it lets me instantly revert the site to a known working version without having to manually SSH in and fix the mess. This entire script runs via a manual trigger (`workflow_dispatch`).

### Rollback Flow

- **Trigger**: Runs only when triggered manually by a human (me). You can optionally provide a specific release SHA (the version ID) to jump to, otherwise, it just reverts to the immediate previous deploy.
- **SSH Setup**: Loads the secure, `read-only` SSH key (the one that can't shell login) and adds the server to the `known_hosts` file. Basic security theater is essential even when panicking.
- **List Releases**: It shows the list of the last 5 good versions (`$KEEP_RELEASES`) currently on the server. Just so I know what my options are.
- **Execute Rollback**: This is the main event. It runs the `astro-rollback` command on the remote server. If I provided a SHA, it uses `--to <SHA>`. If I was too lazy (or panicked) to provide a SHA, it uses `--previous`.
- **Sanity Check**: After the swap, it runs a quick check on the server using `test -f` to make sure the `index.html` file exists in the active `current/` symlink. Because if the homepage isn't there, we've got bigger problems.

The rollback script lives at: `.github/workflows/rollback.yml`.

## Performance & SEO

Yeah, it's a static site, so it's already fast, but I went overboard anyway. Here's the list of things I checked off to make sure Google _really_ likes my minimal site.

- **Sitemap & URLs**: Handles `@astrojs/sitemap` and makes sure every page has the correct _canonical_ URL. We like to be tidy for the robots.
- **Robot Files**: Automatically generates the `robots.txt` and `ads.txt`—you know, the boring files search engines care about.
- **Font Loading**: Made sure the fonts (especially the hero font) load instantly using `preload` and `font-display: swap` so your eyes don't suffer.
- **Responsive Images**: Every image is properly sized and tagged (`width/height`) so your browser doesn't have to guess.
- **Social Tags**: Every page has the proper OG/Twitter meta tags so sharing a link doesn't look terrible.
- **Minimal JS**: Almost zero JavaScript running on your end. The only JS that _hydrates_ (becomes interactive) is the stuff that absolutely needs to be there.

## Security Notes

This site serves static HTML. Hacking it would be really boring, but just in case, we still over-engineer the defenses with these minimum security notes.

- **Deploy Key**: The key used for deployment is `read-only`, scoped to the project, and cannot be used for shell login. (It literally can only copy files, nothing else.)
- **SSH Protocol**: We use modern ciphers and strict `known_hosts` validation. No lazy SSH tricks like agent-forwarding allowed here.
- **Server Setup**: The user running the site is non-root, permissions are tight (`umask` is safe), and the server only sees the currently active directory via a symlink.
- **CI Safety**: All the secret keys are masked in the GitHub Actions logs. No accidental secret leaks when the CI yells at me.

## License & Credits

Look, even a minimal personal web needs to be legal.

- **License**: It's under the **MIT License**. Basically, you can mess around with it, but check the [LICENSE](./LICENSE) file for the boring, official details.
- **Credit**: This isn't entirely my original idea. I just tweaked the heck out of a theme to make it minimal (and totally over-engineered).
  - The OG theme: [Codefolio](https://github.com/danielunited/codefolio) by Daniel Alter. Big thanks!
  - The Tweaker: Modified and simplified (wink) by Erland

---

> _Wait, you actually read this entire personal static site README? It must have felt like reading the Terms of Service. Your free time is truly immense._
>
> _My deepest admiration!_
