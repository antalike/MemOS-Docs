import type { Locale } from '@/lib/source';
import { loadHighlightChangelog, loadOpenSourceChangelog } from '@/lib/changelog-data';
import { getChangelogStrings } from '@/lib/i18n';
import { ChangelogContent } from '@/components/changelog-content';

export function ChangelogPage({ locale }: { locale: Locale }) {
  const strings = getChangelogStrings(locale);
  const highlightVersions = loadHighlightChangelog(locale);
  const openSourceVersions = loadOpenSourceChangelog();

  return (
    <ChangelogContent
      strings={strings}
      highlightVersions={highlightVersions}
      openSourceVersions={openSourceVersions}
    />
  );
}
