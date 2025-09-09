import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const schema = z.object({
  title: z.string(),
  desc: z.string().optional(),
  category: z.enum(['layout', 'form', 'element', 'navigation', 'data', 'overlay']).optional(),
  navigation: z.object({
    title: z.string().optional()
  }),
  banner: z.string().optional(),
  avatar: z.object({
    src: z.string(),
    alt: z.string()
  }).optional(),
  links: z.array(z.object({
    label: z.string(),
    icon: z.string(),
    avatar: z.object({
      src: z.string(),
      alt: z.string()
    }).optional(),
    to: z.string(),
    target: z.string().optional()
  })).optional()
})

export default defineContentConfig({
  collections: {
    docs: defineCollection({
      source: {
        include: '**'
      },
      type: 'page',
      schema
    }),
    openapi: defineCollection({
      type: 'data',
      source: 'api.json',
      schema: z.object({
        openapi: z.string(),
        info: z.record(z.string(), z.any()).optional(),
        paths: z.record(
          z.string(),
          z.record(z.string(), z.any())
        ),
        components: z.record(z.string(), z.any()).optional()
      }).passthrough()
    })
  }
})
