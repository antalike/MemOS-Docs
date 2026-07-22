import type { ReactNode } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { baseOptions } from '@/lib/layout.shared';
import { getApiReferenceTree } from '@/lib/nav-tree';

// The API Reference uses Fumadocs' default docs layout, intentionally *not* the
// shared `SiteHeader`. It's a focused, standalone space, so the section nav
// links are dropped (`links: []`) — only the brand logo (same as the home page,
// via `baseOptions().nav.title`) and search remain in the header.
export default function Layout({ children }: { children: ReactNode }) {
  const options = baseOptions('en');
  return (
    <DocsLayout tree={getApiReferenceTree('en')} {...options} links={[]}>
      {children}
    </DocsLayout>
  );
}
