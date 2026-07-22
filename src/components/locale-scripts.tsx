import Script from 'next/script';

/**
 * i18n / locale helper scripts, ported from the legacy Nuxt site
 * (`nuxt.config.ts` head scripts). These power the language subsystem, not
 * analytics:
 *  - `js-cookie` — provides `window.Cookies`, used by `@/lib/locale` to read
 *    and write the `MEMOS_LANG` preference cookie.
 *  - `locale.1.1.2.min.js` — provides `window.setLocaleCookie` and performs the
 *    initial full-page-load locale redirect; client-side navigation is handled
 *    by `<LocaleGuard />` (see `@/components/locale-guard`).
 *
 * Server-rendered so the tags inline into the static export's HTML and run on
 * first paint, before the app hydrates.
 */
export function LocaleScripts() {
  return (
    <>
      <Script
        src="https://cdn.memtensor.com.cn/file/js-cookie-3.0.5.min.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://cdn.memtensor.com.cn/file/locale.1.1.2.min.js"
        strategy="afterInteractive"
      />
    </>
  );
}
