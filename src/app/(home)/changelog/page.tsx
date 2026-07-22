import type { Metadata } from 'next';
import { ChangelogPage } from '@/components/changelog-page';
import { getChangelogStrings } from '@/lib/i18n';

export const metadata: Metadata = {
  title: getChangelogStrings('en').title,
  description: getChangelogStrings('en').description,
};

export default function Page() {
  return <ChangelogPage locale="en" />;
}
