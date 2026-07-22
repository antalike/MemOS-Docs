import type { CSSProperties, ReactNode } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { I18nProvider } from 'fumadocs-ui/contexts/i18n';
import { baseOptions } from '@/lib/layout.shared';
import { cnTranslations } from '@/lib/i18n';
import { getNavTree } from '@/lib/nav-tree';
import { SiteHeader } from '@/components/site-header';

// Two-row header: 3.5rem (brand/controls) + 2.75rem (section tabs).
// `--fd-layout-width: 90rem` matches the header's `.site-header-inner` (and the
// legacy `--container-8xl`), so the sidebar's left edge lines up with the logo
// instead of using fumadocs' wider 97rem fallback.
const docsLayoutStyle = {
  '--fd-header-height': '6.25rem',
  '--fd-layout-width': '90rem',
} as CSSProperties;

export default function Layout({ children }: { children: ReactNode }) {
  const options = baseOptions('cn');
  return (
    <I18nProvider locale="cn" translations={cnTranslations}>
      <DocsLayout
        tree={getNavTree('cn')}
        {...options}
        nav={{ ...options.nav, mode: 'top', component: <SiteHeader locale="cn" variant="docs" /> }}
        tabs={false}
        containerProps={{ style: docsLayoutStyle }}
      >
        {children}
      </DocsLayout>
    </I18nProvider>
  );
}
