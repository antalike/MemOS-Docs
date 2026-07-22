import type { ReactNode } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { baseOptions } from '@/lib/layout.shared';
import { getApiReferenceTree } from '@/lib/nav-tree';

// Chinese-URL mirror of the English API Reference. The API docs are English-only
// (rendered from `openapi/opensource.json`), but we serve them under `/cn`
// too — some visitors are hard-redirected to `/cn/*` by a locale preference, so
// redirecting back to `/api-reference/*` would ping-pong forever. Rendering the
// same page here (with the sidebar scoped to `/cn/api-reference/*`) is
// loop-proof, and also keeps these paths out of the `(docs)` catch-all that
// errors under `output: export`.
export default function Layout({ children }: { children: ReactNode }) {
  const options = baseOptions('cn');
  return (
    <DocsLayout tree={getApiReferenceTree('cn')} {...options} links={[]}>
      {children}
    </DocsLayout>
  );
}
