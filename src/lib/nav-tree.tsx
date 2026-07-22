import type * as PageTree from 'fumadocs-core/page-tree';
import { Icon } from '@/components/icon';
import { getSource, type Locale } from '@/lib/source';
import { getApiOperations } from '@/lib/api-reference-nav';

// Top-level documentation sections. Each corresponds to a content directory
// whose sidebar tree is defined by its co-located `meta.json` (with
// `root: true`). The sidebar is scoped to the active section, so this ordering
// is cosmetic — the top navbar tabs (see `site-header`) choose the section.
const SECTION_SEGMENTS = [
  'memos_cloud',
  'open_source',
  'self_developed_model',
  'mcp_agent',
  'openclaw',
  'usecase',
  'api_docs',
] as const;

// Localized label for the dynamically-generated "API Reference" subtree that is
// appended to the (meta.json-driven) Open Source section.
const API_REFERENCE_TITLE: Record<Locale, string> = {
  en: 'API Reference',
  cn: 'API 参考文档',
};

function iconNode(name?: string | null) {
  return name ? <Icon name={name} /> : undefined;
}

// Resolve a generated OpenAPI route ("api-reference/search-memories") to its
// built page URL for the locale.
function resolveUrl(locale: Locale, target: string): string {
  const slugStr = target.replace(/\.md$/, '').replace(/\/index$/, '');
  const slugs = slugStr.split('/').filter(Boolean);
  const page = getSource(locale).getPage(slugs);
  if (page) return page.url;
  return locale === 'cn' ? `/cn/${slugStr}` : `/${slugStr}`;
}

// "Product" group label wrapping every operation, matching the original
// standalone API docs layout.
const API_REFERENCE_GROUP: Record<Locale, string> = {
  en: 'Product',
  cn: 'Product',
};

// Per-method sidebar badge colors (GET/POST/PUT/PATCH/DELETE), matching the
// convention used by API references like llmgateway's.
const METHOD_BADGE_COLOR: Record<string, string> = {
  get: 'text-emerald-600 dark:text-emerald-400',
  post: 'text-blue-600 dark:text-blue-400',
  put: 'text-amber-600 dark:text-amber-400',
  patch: 'text-orange-600 dark:text-orange-400',
  delete: 'text-red-600 dark:text-red-400',
};

// A right-aligned HTTP method tag rendered inside an API sidebar item.
function ApiMethodBadge({ method }: { method: string }) {
  const color = METHOD_BADGE_COLOR[method.toLowerCase()] ?? 'text-fd-muted-foreground';
  return (
    <span className={`ms-auto shrink-0 text-[10px] font-semibold uppercase tracking-wider ${color}`}>
      {method}
    </span>
  );
}

// The standalone "API Reference" page tree, from the OpenAPI-derived operation
// list. Rendered by the dedicated `(api)` route group with Fumadocs' default
// docs layout, so its sidebar shows only the API operations (single "Product"
// group, spec order) — each item tagged with its HTTP method.
export function getApiReferenceTree(locale: Locale): PageTree.Root {
  const operations = getApiOperations().map(
    (op): PageTree.Item => ({
      type: 'page',
      name: (
        <span className="inline-flex w-full items-center gap-2">
          <span className="truncate">{op.title}</span>
          <ApiMethodBadge method={op.method} />
        </span>
      ),
      url: resolveUrl(locale, `api-reference/${op.slug}`),
    }),
  );

  return {
    name: API_REFERENCE_TITLE[locale],
    children: [
      {
        type: 'folder',
        name: API_REFERENCE_GROUP[locale],
        children: operations,
      },
    ],
  };
}

// Single sidebar entry appended to the Open Source section that links into the
// standalone API Reference section. Clicking it navigates to the dedicated API
// page (whose sidebar is scoped to the API docs only) instead of expanding the
// operations inline under Open Source.
function apiReferenceEntryLink(locale: Locale): PageTree.Item {
  const first = getApiOperations()[0];
  const slug = first ? first.slug : 'search-memories';
  return {
    type: 'page',
    name: API_REFERENCE_TITLE[locale],
    icon: iconNode('ri:file-code-line'),
    url: resolveUrl(locale, `api-reference/${slug}`),
  };
}

// Whether any page under this loader-tree node lives beneath `prefix`
// (e.g. "/cn/memos_cloud"), so we can locate the folder for a section.
function nodeCoversPrefix(node: PageTree.Node, prefix: string): boolean {
  if (node.type === 'page') {
    return node.url === prefix || node.url.startsWith(`${prefix}/`);
  }
  if (node.type === 'folder') {
    if (node.index && nodeCoversPrefix(node.index, prefix)) return true;
    return node.children.some((child) => nodeCoversPrefix(child, prefix));
  }
  return false;
}

// Find the top-level folder in the loader-generated page tree that corresponds
// to a content section directory (built from its co-located `meta.json`).
function findSectionFolder(
  locale: Locale,
  segment: string,
): PageTree.Folder | undefined {
  const prefix = locale === 'cn' ? `/cn/${segment}` : `/${segment}`;
  return getSource(locale).pageTree.children.find(
    (node): node is PageTree.Folder =>
      node.type === 'folder' && nodeCoversPrefix(node, prefix),
  );
}

// Extract the plain-text title from a page-tree node `name`, which may be a
// string or a React node (icons are carried separately, so section/folder names
// are plain strings in practice).
function nodeNameToString(name: PageTree.Node['name']): string {
  return typeof name === 'string' ? name : '';
}

// Find the parent section title for a page inside a nested folder (a genuine
// sub-directory with its own `meta.json`), returning the nearest enclosing
// folder title.
function findParentInFolder(
  nodes: PageTree.Node[],
  folderName: string,
  url: string,
): string | undefined {
  for (const node of nodes) {
    if (node.type === 'page') {
      if (node.url === url) return folderName;
    } else if (node.type === 'folder') {
      if (node.index?.url === url) return folderName;
      const found = findParentInFolder(node.children, nodeNameToString(node.name), url);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

// Resolve the "parent section" shown above a doc's title, matching the
// pre-migration behavior (the sidebar group a page belongs to). Within a
// top-level section, pages are grouped by `---[icon]title---` separators, so the
// parent is the nearest preceding separator; pages inside a real sub-folder use
// that folder's title instead.
export function getPageParentSection(locale: Locale, url: string): string | undefined {
  for (const section of getSource(locale).pageTree.children) {
    if (section.type !== 'folder') continue;

    let separator: string | undefined;
    for (const node of section.children) {
      if (node.type === 'separator') {
        separator = nodeNameToString(node.name);
      } else if (node.type === 'page') {
        if (node.url === url) return separator || undefined;
      } else if (node.type === 'folder') {
        if (node.index?.url === url) return separator || undefined;
        const found = findParentInFolder(node.children, nodeNameToString(node.name), url);
        if (found !== undefined) return found || undefined;
      }
    }
  }
  return undefined;
}

// Assemble the sidebar tree from each section's co-located `meta.json`. Every
// section folder carries `root: true`, so Fumadocs scopes the sidebar to the
// last root folder on the path to the current page — only the active section's
// subtree is shown.
export function getNavTree(locale: Locale): PageTree.Root {
  const children = SECTION_SEGMENTS.flatMap((segment): PageTree.Node[] => {
    const folder = findSectionFolder(locale, segment);
    if (!folder) return [];

    // The API Reference is English-only (rendered straight from the OpenAPI
    // spec). Append a single entry link to the English Open Source sidebar that
    // jumps to the standalone API section.
    const extra =
      locale === 'en' && segment === 'open_source'
        ? [apiReferenceEntryLink(locale)]
        : [];

    return [{ ...folder, children: [...folder.children, ...extra], root: true }];
  });

  return {
    name: 'Docs',
    children,
  };
}
