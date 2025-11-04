import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/posts' }),
  schema: z.object({
    title: z.optional(z.string()),
    published: z.coerce.date(),
    tags: z.optional(z.array(z.string())),
  }),
});

export const collections = { posts };
