import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/posts' }),
  schema: z.object({
    title: z.string(),
    published: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/notes' }),
});

export const collections = { posts, notes };
