import type { Metadata } from 'next';
import { getHomeStrings } from '@/lib/i18n';
import { HomePage } from '@/components/home-page';

export const metadata: Metadata = {
  title: getHomeStrings('cn').title,
};

export default function Page() {
  return <HomePage locale="cn" />;
}
