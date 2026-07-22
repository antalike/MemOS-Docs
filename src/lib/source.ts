import { createElement } from 'react';
import { docsCn, docsEn } from 'collections/server';
import { loader } from 'fumadocs-core/source';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import { docsImageRoute } from './shared';
import { Icon } from '@/components/icon';

// Resolves Iconify-style names from `meta.json` (e.g. "ri:rocket-line") into
// `<Icon>` nodes. `Icon` is a client component that fetches the SVG from the
// Iconify online API on demand.
function resolveIcon(name?: string) {
  if (!name) return undefined;
  // fumadocs renders the icon alongside the label inside a children array, so
  // the element needs a stable `key` to avoid React's list key warning.
  return createElement(Icon, { name, key: `icon-${name}` });
}

// See https://fumadocs.dev/docs/headless/source-api for more info.
//
// Dual-tree i18n for static export (no locale middleware):
//   - English is served from the site root: `/`, `/open_source/...`
//   - Chinese is served under `/cn`: `/cn`, `/cn/open_source/...`
export const enSource = loader({
  baseUrl: '/',
  source: docsEn.toFumadocsSource(),
  icon: resolveIcon,
  plugins: [],
});

export const cnSource = loader({
  baseUrl: '/cn',
  source: docsCn.toFumadocsSource(),
  icon: resolveIcon,
  plugins: [],
});

export type Locale = 'en' | 'cn';

const sources: Record<Locale, typeof enSource> = {
  en: enSource,
  cn: cnSource,
};

export function getSource(locale: Locale) {
  return sources[locale];
}

type SourcePage = (typeof enSource)['$inferPage'];

/** Every page across both locales, tagged with its locale. */
export function getAllPages(): { locale: Locale; page: SourcePage }[] {
  return (Object.keys(sources) as Locale[]).flatMap((locale) =>
    sources[locale].getPages().map((page) => ({ locale, page })),
  );
}

export function getPageImage(locale: Locale, page: SourcePage) {
  const segments = [locale, ...page.slugs, 'image.png'];

  return {
    segments,
    url: `${docsImageRoute}/${segments.join('/')}`,
  };
}

export function getPageMarkdownUrl(locale: Locale, page: SourcePage) {
  const segments = [locale, ...page.slugs, 'content.md'];
  // Pretty docs-style URL (`/cn/foo/bar.md`) used by the static export: the
  // canonical `text/markdown` pre-render lives under `/llms.mdx/docs/.../content.md`
  // and is mirrored to the pretty path at build time by
  // `scripts/export-page-markdown.mjs`.
  const pagePath = page.url.replace(/\/$/, '');

  // The mirror only exists after a static-export build, so in `next dev` the
  // pretty `.md` path 404s (returning the HTML error page — which is what the
  // "Copy Markdown" button would otherwise copy). Point dev at the canonical
  // route, which serves `text/markdown` directly.
  const url =
    process.env.NODE_ENV === 'development'
      ? `/llms.mdx/docs/${segments.join('/')}`
      : `${pagePath}.md`;

  return {
    segments,
    url,
  };
}

// Unwrap/strip MDX-only nodes so the exported `.md` is clean prose for LLMs:
// JSX elements (<Callout>, <b>, ...) are replaced by their children, while
// import/export statements and `{expression}` nodes are dropped entirely.
type MdastNode = { type: string; children?: MdastNode[] };

function stripMdxNodes() {
  const clean = (nodes: MdastNode[]): MdastNode[] =>
    nodes.flatMap((node) => {
      if (Array.isArray(node.children)) node.children = clean(node.children);

      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
        return node.children ?? [];
      }
      if (
        node.type === 'mdxjsEsm' ||
        node.type === 'mdxFlowExpression' ||
        node.type === 'mdxTextExpression'
      ) {
        return [];
      }
      return [node];
    });

  return (tree: MdastNode) => {
    tree.children = clean(tree.children ?? []);
  };
}

const markdownProcessor = remark().use(remarkMdx).use(remarkGfm).use(stripMdxNodes);

export async function getLLMText(page: SourcePage) {
  const processed = await page.data.getText('processed');

  let body = processed;
  try {
    body = String(await markdownProcessor.process(processed)).trim();
  } catch {
    // Fall back to the raw processed text if a page fails to parse as MDX.
  }

  return `# ${page.data.title} (${page.url})

${body}`;
}
