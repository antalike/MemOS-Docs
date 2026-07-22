import 'server-only';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'js-yaml';
import type { Locale } from '@/lib/source';
import {
  normalizeChangelogVersions,
  normalizeOpenSourceVersions,
  type ChangelogVersion,
  type OpenSourceVersion,
} from '@/lib/changelog';

const CONTENT_ROOT = join(process.cwd(), 'content');

export function loadHighlightChangelog(locale: Locale): ChangelogVersion[] {
  const raw = readFileSync(
    join(CONTENT_ROOT, locale, 'changelog.yml'),
    'utf8',
  );
  return normalizeChangelogVersions(load(raw) as { versions?: ChangelogVersion[] });
}

export function loadOpenSourceChangelog(): OpenSourceVersion[] {
  const raw = readFileSync(
    join(CONTENT_ROOT, 'releases.json'),
    'utf8',
  );
  return normalizeOpenSourceVersions(JSON.parse(raw));
}
