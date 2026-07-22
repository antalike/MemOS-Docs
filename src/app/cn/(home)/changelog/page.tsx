import type { Metadata } from 'next';
import { ChangelogPage } from '@/components/changelog-page';
import { getChangelogStrings } from '@/lib/i18n';

export const metadata: Metadata = {
  title: getChangelogStrings('cn').title,
  description: getChangelogStrings('cn').description,
};

export default function Page() {
  return <ChangelogPage locale="cn" />;
}
