import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional(),
  }),
});

const dream = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/dream' }),
  schema: z.object({
    order: z.number(),
    title: z.string(),
    description: z.string(),
    answerHash: z.string(),
    hints: z.array(z.string()).optional().default([]),
  }),
});

export const collections = {
  posts,
  dream,
};
