import type { Metadata } from 'next';
import { getHomeStrings } from '@/lib/i18n';
import { HomePage } from '@/components/home-page';

export const metadata: Metadata = {
  title: getHomeStrings('en').title,
};

export default function Page() {
  return <HomePage locale="en" />;
}
