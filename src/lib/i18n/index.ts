// Unified entry for all i18n strings. Every user-facing string now lives in a
// single mirrored catalog per locale (`messages/en.ts`, `messages/cn.ts`); this
// module exposes typed accessors over it. To add or change a string, edit the
// two `messages/*` files — nothing else here needs to change.

import type { Locale } from '../source';
import { en } from './messages/en';
import { cn } from './messages/cn';
import type { Messages } from './messages/types';

export type {
  Messages,
  HomeStrings,
  InteractiveStrings,
  ChangelogStrings,
  NavLabels,
  FrameworkTranslations,
} from './messages/types';

export {
  readLocaleCookie,
  setLocaleCookie,
  targetLocale,
  switchLocalePath,
  pathIsCn,
  localeRedirectPath,
} from '../locale';

const messages: Record<Locale, Messages> = { en, cn };

export function getMessages(locale: Locale): Messages {
  return messages[locale] ?? en;
}

export function getHomeStrings(locale: Locale) {
  return getMessages(locale).home;
}

export function getInteractiveStrings(locale: Locale) {
  return getMessages(locale).interactive;
}

export function getChangelogStrings(locale: Locale) {
  return getMessages(locale).changelog;
}

/** Top navbar menu labels, keyed by the route keys in `layout.shared.tsx`. */
export function getNavLabels(locale: Locale) {
  return getMessages(locale).nav;
}

/** fumadocs-ui / OpenAPI framework string overrides for the Chinese tree. */
export const cnTranslations = cn.ui;

export const locales = [
  { name: 'English', locale: 'en' },
  { name: '中文', locale: 'cn' },
];

/** Derive the active locale from the current pathname (`/cn/...` -> `cn`). */
export function localeFromPathname(pathname: string): Locale {
  return pathname === '/cn' || pathname.startsWith('/cn/') ? 'cn' : 'en';
}
