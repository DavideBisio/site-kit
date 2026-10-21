// Docs content collection shared by every project site.
//
// In src/content.config.ts:
//   import { docsCollection } from '@davidebisio/site-kit/content';
//   export const collections = { docs: docsCollection() };
//
// Point `base` at an existing folder (e.g. '../docs/features' to reuse a repo's docs/)
// to publish Markdown that already lives in the repo without moving it.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export { docTitle, docsNav, editLink } from './docs.js';

export const docsSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  /** Sidebar group heading; ungrouped pages come first. */
  group: z.string().optional(),
  /** Sort order inside a group (lower first); ties sort by title. */
  order: z.number().default(100),
  draft: z.boolean().default(false),
});

/**
 * @param {{ base?: string, pattern?: string | string[] }} [options]
 */
export function docsCollection({ base = './src/content/docs', pattern = '**/*.{md,mdx}' } = {}) {
  return defineCollection({ loader: glob({ base, pattern }), schema: docsSchema });
}
