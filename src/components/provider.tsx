'use client';
import { RootProvider } from 'fumadocs-ui/provider/next';
import dynamic from 'next/dynamic';
import { Suspense, type ReactNode } from 'react';
import { LocaleGuard } from '@/components/locale-guard';

// Interaction-only global overlays. Lazy-loaded (client-only) so their large
// dependency trees — orama (search), remark + fumadocs-ui/mdx (assistant) —
// stay out of every route's initial compile/bundle graph and are only built
// when first used. This is the main lever for dev cold-compile time.
const SearchDialog = dynamic(() => import('@/components/search'), {
  ssr: false,
});
const Assistant = dynamic(
  () => import('@/components/assistant/assistant').then((m) => m.Assistant),
  { ssr: false },
);
const ApiKeyPickerHost = dynamic(
  () => import('@/components/api-key/picker').then((m) => m.ApiKeyPickerHost),
  { ssr: false },
);

export function Provider({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      search={{ SearchDialog }}
      // Match the legacy site: default to light, allow manual toggle.
      theme={{ defaultTheme: 'light', enableSystem: false }}
    >
      {children}
      {/* Sync URL prefix with MEMOS_LANG cookie on client navigations. */}
      <Suspense fallback={null}>
        <LocaleGuard />
      </Suspense>
      {/* Global interactive features (mounted once, persist across navigation). */}
      <Assistant />
      <ApiKeyPickerHost />
    </RootProvider>
  );
}
