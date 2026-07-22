'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { localeRedirectPath } from '@/lib/locale';

/**
 * Keeps the URL prefix in sync with the `MEMOS_LANG` cookie during client-side
 * navigation. The external `locale.1.1.2.min.js` handles the initial full
 * page load; this mirrors the legacy Nuxt `locale.global.ts` middleware for
 * in-app route changes.
 */
export function LocaleGuard() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!pathname) return;

    const corrected = localeRedirectPath(pathname);
    if (!corrected || corrected === pathname) return;

    const query = searchParams?.toString();
    const suffix = query ? `?${query}` : '';
    router.replace(`${corrected}${suffix}`);
  }, [pathname, searchParams, router]);

  // Keep `<html lang>` aligned with the active locale tree.
  useEffect(() => {
    if (!pathname) return;
    document.documentElement.lang =
      pathname === '/cn' || pathname.startsWith('/cn/') ? 'zh-CN' : 'en';
  }, [pathname]);

  return null;
}
