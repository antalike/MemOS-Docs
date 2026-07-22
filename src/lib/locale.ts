import type { Locale } from './source';

const COOKIE_NAME = 'MEMOS_LANG';

/** Cookie domain used by `locale.1.1.2.min.js` on production hosts. */
function cookieDomain(): string {
  const fromConfig = window.__RUNTIME_CONFIG__?.tokenDomain;
  if (fromConfig) return fromConfig;
  return window.location.hostname.includes('openmem.net') ? '.openmem.net' : '';
}

/** Read the persisted locale preference (same cookie as the legacy Nuxt site). */
export function readLocaleCookie(): Locale | null {
  const domain = cookieDomain();
  const value = window.Cookies?.get(COOKIE_NAME, domain ? { domain } : undefined);
  return value === 'cn' || value === 'en' ? value : null;
}

/** Persist locale preference — delegates to `locale.1.1.2.min.js` when loaded. */
export function setLocaleCookie(locale: Locale): void {
  if (window.setLocaleCookie) {
    window.setLocaleCookie(locale);
    return;
  }
  // Fallback before deferred scripts finish loading (same shape as locale.min.js).
  const domain = cookieDomain();
  window.Cookies?.set(COOKIE_NAME, locale, {
    domain: domain || undefined,
    path: '/',
    expires: 14,
  });
}

export function targetLocale(current: Locale): Locale {
  return current === 'cn' ? 'en' : 'cn';
}

/** Map the current path to the equivalent path in another locale tree. */
export function switchLocalePath(pathname: string, to: Locale): string {
  if (to === 'cn') {
    return pathname === '/' ? '/cn' : `/cn${pathname}`;
  }
  return pathname.replace(/^\/cn(?=\/|$)/, '') || '/';
}

/** Whether the pathname belongs to the Chinese locale tree. */
export function pathIsCn(pathname: string): boolean {
  return pathname === '/cn' || pathname.startsWith('/cn/');
}

/**
 * Client-side locale guard (mirrors legacy Nuxt `locale.global.ts` +
 * `locale.1.1.2.min.js` redirect). Returns a corrected path when the URL
 * prefix and `MEMOS_LANG` cookie disagree, or `null` when aligned.
 */
export function localeRedirectPath(pathname: string): string | null {
  const preferred = readLocaleCookie();
  if (!preferred) return null;

  const onCn = pathIsCn(pathname);
  if (preferred === 'cn' && !onCn) return switchLocalePath(pathname, 'cn');
  if (preferred === 'en' && onCn) return switchLocalePath(pathname, 'en');
  return null;
}
