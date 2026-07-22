import type { Metadata } from 'next';
import { Provider } from '@/components/provider';
import { Analytics } from '@/components/analytics';
import { Arms } from '@/components/arms';
import { LocaleScripts } from '@/components/locale-scripts';
import { siteUrl } from '@/lib/shared';
import './global.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: '/icon.svg',
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="font-sans" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans">
        <Provider>{children}</Provider>
        <LocaleScripts />
        <Analytics />
        <Arms />
      </body>
    </html>
  );
}
