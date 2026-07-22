'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/arms';

// Re-wires the legacy `v-track-nav` behaviour: clicking a link in the sidebar
// or top/sub nav sends a `点击菜单` ARMS custom event. The RUM SDK itself is
// loaded by the server-rendered `Analytics` component so it inlines into the
// static HTML alongside the other analytics scripts.
export function Arms() {
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      // Only track navigation menus (sidebar + top/sub nav), matching the
      // legacy directive scope.
      if (!anchor.closest('#nd-sidebar, #nd-nav, #nd-subnav')) return;
      const text = (anchor.textContent ?? '').trim();
      trackEvent(text, '点击菜单', anchor.getAttribute('href') ?? '');
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return null;
}
