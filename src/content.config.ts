import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Deep learning notes, converted from my Observable notebooks (one MDX file per note).
// The series order and the notes not converted yet live in src/data/deep-learning.json.
const deepLearning = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/deep-learning' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
  }),
});

export const collections = { deepLearning };
