import type { ReactNode } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { SiteHeader } from '@/components/site-header';

export default function Layout({ children }: { children: ReactNode }) {
  const options = baseOptions('cn');
  return (
    <HomeLayout
      {...options}
      nav={{
        ...options.nav,
        component: <SiteHeader locale="cn" />,
      }}
    >
      {children}
    </HomeLayout>
  );
}
