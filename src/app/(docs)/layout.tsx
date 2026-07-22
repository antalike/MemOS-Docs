import type { CSSProperties, ReactNode } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { baseOptions } from '@/lib/layout.shared';
import { getNavTree } from '@/lib/nav-tree';
import { SiteHeader } from '@/components/site-header';

// Prisma-style layout: a full-width top header (shared `SiteHeader`) with the
// section tabs, and the page tree in a sidebar below it. `nav.mode: 'top'`
// switches the notebook grid to `header / sidebar main toc`, and the custom
// `nav.component` bypasses the default header markup — so we set
// `--fd-header-height` ourselves for the sidebar's sticky offset.
// Two-row header: 3.5rem (brand/controls) + 2.75rem (section tabs).
// `--fd-layout-width: 90rem` matches the header's `.site-header-inner` (and the
// legacy `--container-8xl`), so the sidebar's left edge lines up with the logo
// instead of using fumadocs' wider 97rem fallback.
const docsLayoutStyle = {
  '--fd-header-height': '6.25rem',
  '--fd-layout-width': '90rem',
} as CSSProperties;

export default function Layout({ children }: { children: ReactNode }) {
  const options = baseOptions('en');
  return (
    <DocsLayout
      tree={getNavTree('en')}
      {...options}
      nav={{ ...options.nav, mode: 'top', component: <SiteHeader locale="en" variant="docs" /> }}
      tabs={false}
      containerProps={{ style: docsLayoutStyle }}
    >
      {children}
    </DocsLayout>
  );
}
