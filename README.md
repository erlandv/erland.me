# erland.me

Personal website and blog built with Astro 5, featuring a clean and fast static site with blog functionality and download sections.

## ✨ Features

- **Fast & Modern**: Built with Astro 5 for optimal performance
- **Blog System**: Markdown-powered blog with content collections
- **Custom Markdown**: Enhanced with remark plugins for galleries and directives
- **SEO Optimized**: Clean URLs and meta tags
- **Responsive Design**: Works great on all devices

## 🚀 Tech Stack

- **Framework**: Astro ^5.1.5
- **Content**: Markdown with frontmatter
- **Styling**: Vanilla CSS
- **Plugins**: 
  - remark-directive for custom markdown syntax
  - Custom remark-gallery plugin

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.astro
│   ├── Footer.astro
│   ├── Sidebar.astro
│   └── ...
├── content/            # Content collections
│   ├── blog/          # Blog posts (Markdown)
│   └── ...
├── layouts/           # Page layouts
├── pages/             # Route pages
│   ├── blog/         # Blog routes
│   ├── index.astro   # Homepage
│   └── ...
├── lib/              # Utilities and plugins
└── icons/            # SVG icons
```

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/erlandv/erland.me.git
cd eland.me

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# The site will be available at http://localhost:4321
```

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## 📝 Content Management

### Blog Posts

Create new blog posts in `src/content/blog/` as Markdown files with frontmatter:

~~~
---
title: "Your Post Title"
description: "Brief description for SEO"
excerpt: "Short excerpt for listings"
publishDate: 2024-01-01
updatedDate: 2024-01-02  # optional
hero: ./images/hero.jpg  # optional
heroAlt: "Hero image description"  # optional
tags: ["web", "development"]
category: "tutorial"  # optional
draft: false
---

Your markdown content here...
~~~

## 🎨 Customization

- **Styling**: Edit `public/assets/styles.css` for global styles
- **Profile**: Update `src/components/Sidebar.astro` for personal info
- **Navigation**: Modify `src/components/Header.astro` for menu items
- **Homepage**: Edit `src/pages/index.astro` for main content

## 🚀 Deployment

This site can be deployed to any static hosting service:

### Netlify/Vercel
1. Connect your repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`

### Manual Deployment
```bash
npm run build
# Upload the `dist` folder to your hosting service
```

## 📄 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run Astro check for linting
- `npm run astro` - Run Astro CLI commands

## 🔧 Configuration

- **Astro Config**: `astro.config.mjs`
- **Content Schema**: `src/content.config.ts`
- **TypeScript**: `tsconfig.json`

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

## Credit

This project is a derivative of the original theme with customizations to layout, components, and build config.

- Original theme by [Daniel Alter](https://github.com/danielunited).
- Modified and maintained by [Erland](https://github.com/erlandv).