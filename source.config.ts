import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins';
import { z } from 'zod';

// Extends Fumadocs' default page schema with the frontmatter fields used by
// the legacy MemOS docs content (migrated from @nuxt/content).
const frontmatterSchema = pageSchema.extend({
  // Legacy alias for `description`; kept so existing frontmatter still parses.
  // The migration script maps `desc` -> `description`, but both are accepted.
  desc: z.string().optional(),
  // Page-level OpenAPI operation, e.g. `openapi: "POST /search/memory"`.
  openapi: z.string().optional(),
  // Hero banner image shown under the page header.
  banner: z.string().optional(),
  // Optional category tag carried over from the legacy schema.
  category: z
    .enum(['layout', 'form', 'element', 'navigation', 'data', 'overlay'])
    .optional(),
  avatar: z
    .object({
      src: z.string(),
      alt: z.string(),
    })
    .optional(),
  links: z
    .array(
      z.object({
        label: z.string(),
        icon: z.string().optional(),
        avatar: z
          .object({
            src: z.string(),
            alt: z.string(),
          })
          .optional(),
        to: z.string(),
        target: z.string().optional(),
      }),
    )
    .optional(),
});

// Dual-tree i18n (static export cannot use locale middleware):
// English lives at the site root (`/...`), Chinese under `/cn/...`.
// Each locale is a separate collection so its slugs are relative to its root.
const docsOptions = {
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
} as const;

export const docsEn = defineDocs({
  dir: 'content/en/docs',
  ...docsOptions,
});

export const docsCn = defineDocs({
  dir: 'content/cn/docs',
  ...docsOptions,
});

export default defineConfig({
  mdxOptions: {
    // Content references remote CDN images (cdn/statics.memtensor.com.cn). By
    // default remark-image fetches each remote image at build time just to read
    // its dimensions; when the CDN is unreachable that fetch times out and the
    // whole page fails to compile. Skip probing external URLs — they render
    // fine with their original src, just without pre-set width/height.
    remarkImageOptions: {
      external: false,
    },
    rehypeCodeOptions: {
      ...rehypeCodeDefaultOptions,
      // Load languages on demand and fall back to plain text for languages
      // not bundled by Shiki (e.g. `env`, `dotenv`, `mdc`) instead of throwing.
      lazy: true,
      fallbackLanguage: 'text',
    },
  },
});
