import {
  getPageImage,
  getPageMarkdownUrl,
  getSource,
  type Locale,
} from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/notebook/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { gitConfig } from '@/lib/shared';
import { OpenAPIPage } from '@/components/api';
import type { OperationItem } from 'fumadocs-openapi';
import { getPageParentSection } from '@/lib/nav-tree';

const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];

// Parses a page-level `openapi` frontmatter value (e.g. "POST /search/memory")
// into a fumadocs-openapi operation reference.
function parseOpenAPIOperation(value?: string): OperationItem | undefined {
  if (!value) return undefined;
  const [methodRaw, path] = value.trim().split(/\s+/);
  const method = methodRaw?.toLowerCase();
  if (!method || !path || !HTTP_METHODS.includes(method)) return undefined;
  return { path, method } as OperationItem;
}

// Shared rendering for both the English (`/[...slug]`) and Chinese
// (`/cn/[...slug]`) doc routes, parameterized by locale.
export function DocPageContent({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string[] | undefined;
}) {
  const source = getSource(locale);
  const page = source.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(locale, page).url;

  // Dashboard (cloud) API pages: a page-level `openapi` operation rendered
  // inline after the (usually empty) MDX body, using the locale-specific spec.
  const operation = parseOpenAPIOperation(page.data.openapi);
  const isFull = page.data.full || Boolean(operation);

  // Parent section (sidebar group) shown above the title, e.g. "开始使用".
  const parentSection = getPageParentSection(locale, page.url);

  return (
    <DocsPage
      toc={page.data.toc}
      full={isFull}
      // Disable the default breadcrumb: for nested (>2 level) pages it would
      // duplicate the parent-section label rendered below. We show only the
      // single nearest parent title instead.
      breadcrumb={{ enabled: false }}
    >
      <div className="border-b pb-6">
        {parentSection ? (
          <span className="mb-2 block text-sm font-medium text-fd-primary">
            {parentSection}
          </span>
        ) : null}
        {/* Title on the left, page actions on the right (Prisma docs style). */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <DocsTitle className="mb-0">{page.data.title}</DocsTitle>
          <div className="flex shrink-0 flex-row items-center gap-2">
            <MarkdownCopyButton markdownUrl={markdownUrl} />
            <ViewOptionsPopover
              markdownUrl={markdownUrl}
              githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/fuma/content/${locale}/docs/${page.path}`}
            />
          </div>
        </div>
        <DocsDescription className="mt-3 mb-0">{page.data.description}</DocsDescription>
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
        {operation ? (
          <OpenAPIPage
            document={`dashboard-${locale}`}
            operations={[operation]}
            showTitle={false}
          />
        ) : null}
      </DocsBody>
    </DocsPage>
  );
}

export function docPageMetadata({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string[] | undefined;
}): Metadata {
  const page = getSource(locale).getPage(slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(locale, page).url,
    },
  };
}

/** generateStaticParams for a non-optional `[...slug]` catch-all (drops the index/empty slug). */
export function docStaticParams(locale: Locale) {
  return getSource(locale)
    .generateParams()
    .filter((p) => Array.isArray(p.slug) && p.slug.length > 0);
}
