// src/content.config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().max(160).optional(),
      excerpt: z.string().max(200).optional(),
      publishDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      hero: image().optional(),
      heroAlt: z.string().optional(),
      tags: z.array(z.string()).default([]),
      category: z.string().optional(),
      draft: z.boolean().default(false),
    }),
});

const downloads = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      excerpt: z.string().max(200).optional(),
      hero: image().optional(),
      heroAlt: z.string().optional(),
      file: z.string(),
      version: z.string().optional(),
      lastUpdated: z.coerce.date().optional(),
      ctaLabel: z.string().default('Download sekarang'),
      order: z.number().default(0),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      downloadFiles: z
        .array(
          z.object({
            label: z.string(),
            href: z.string(),
            size: z.string().optional(),
          })
        )
        .optional(),
      downloadNote: z.string().optional(),
      downloadIntro: z.array(z.string()).optional(),
    }),
});

// Portfolio collection: structured project data for portfolio pages
const portfolio = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    category: z.enum(['web-development', 'cloud-infra', 'personal-projects']),
    desc: z.string(),
    highlights: z.array(z.string()).default([]),
    tech: z.array(z.string()),
    order: z.number().default(0),
  }),
});

export const collections = { blog, downloads, portfolio };
