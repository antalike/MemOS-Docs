import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { SiteHeader } from '@/components/site-header';

export default function Layout({ children }: LayoutProps<'/'>) {
  const options = baseOptions();
  return (
    <HomeLayout
      {...options}
      nav={{
        ...options.nav,
        component: <SiteHeader locale="en" />,
      }}
    >
      {children}
    </HomeLayout>
  );
}
