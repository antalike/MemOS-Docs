# MemOS Docs

The MemOS documentation site, built with [Next.js](https://nextjs.org) (App Router) and
[Fumadocs](https://fumadocs.dev). Content is authored in MDX and shipped as a fully
[static export](https://nextjs.org/docs/app/guides/static-exports).

The site is bilingual: **English lives at the site root (`/...`)** and **Chinese under `/cn/...`**.
Because static export cannot use locale middleware, each locale is a separate Fumadocs
collection (see `source.config.ts`). Chinese (`content/cn`) is the **source language**;
other locales are generated mirror translations (see [Translation tooling](#translation-tooling)).

## Getting started

Copy the example env file and start the dev server:

```bash
cp .env.example .env.local
npm install        # runs `fumadocs-mdx` postinstall to generate types
npm run dev
```

Open http://localhost:3000 to view the site.

## Scripts

| Script                          | Description                                                             |
| ------------------------------- | ----------------------------------------------------------------------- |
| `npm run dev`                   | Start the dev server.                                                   |
| `npm run build`                 | Static export to `out/`, then export per-page Markdown.                 |
| `npm run build:pre`             | Build against the pre-release env (`.env.pre`).                         |
| `npm start`                     | Serve the exported `out/` directory locally.                            |
| `npm run translate`             | Incrementally translate changed Chinese source into target locales.     |
| `npm run translate:all`         | Force a full re-translation of all content.                             |
| `npm run eval:translate`        | LLM-as-judge quality scoring of existing translations.                  |
| `npm run compare:models`        | Compare translation models with cross-judge validation.                 |
| `npm run test:translate`        | Run the translation tooling unit tests.                                 |
| `npm run types:check`           | Generate types and run `tsc --noEmit`.                                  |
| `npm run lint`                  | Run ESLint.                                                             |

## Project structure

```
content/            MDX docs, one directory per locale
  cn/               Chinese — the source language
  en/  ja/          Generated translations
  releases.json     Changelog / release data
openapi/            OpenAPI specs used to generate API-reference pages
scripts/            Build and translation tooling
src/
  app/              Next.js App Router (English root + /cn mirror)
  components/       React components (MDX, API reference, home, search…)
  lib/              source.ts (Fumadocs loader), layout.shared.tsx, helpers
source.config.ts    Fumadocs MDX config: frontmatter schema + i18n collections
next.config.mjs     Next.js config (static export)
```

### Routes

| Route                                   | Description                                            |
| --------------------------------------- | ------------------------------------------------------ |
| `src/app/(home)`                        | Landing page and changelog (English).                  |
| `src/app/(docs)/[...slug]`              | Documentation pages (English).                         |
| `src/app/(api)/api-reference/[...slug]` | OpenAPI reference pages (English).                     |
| `src/app/cn/...`                        | Chinese mirror of the above route groups.              |
| `src/app/api/search/route.ts`           | Search endpoint (static, Orama-backed).                |
| `src/app/llms.txt`, `llms-full.txt`, `llms.mdx/...` | LLM-friendly plain-text/Markdown exports.  |
| `src/app/og/docs/[...slug]`             | Dynamic Open Graph images.                             |

## Content authoring

Docs are MDX with frontmatter validated by the schema in `source.config.ts`
(extends the Fumadocs page schema with legacy fields like `desc`, `openapi`,
`banner`, `links`). Navigation is driven by `meta.json` files within each
content directory.

To add an API-reference page, add the operation to the relevant `openapi/*.json`
spec; the pages are rendered from those specs at build time.

## Translation tooling

Chinese is the source; other locales are translated incrementally. See
[`scripts/auto-translate/README.md`](scripts/auto-translate/README.md) for the full
guide covering `auto-translate`, `eval-translation`, and `compare-models`, plus
environment setup and evaluation caveats.

## Learn more

- [Fumadocs](https://fumadocs.dev) — the docs framework.
- [Next.js Documentation](https://nextjs.org/docs) — Next.js features and API.
