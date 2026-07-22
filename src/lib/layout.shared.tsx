import type { BaseLayoutProps, LinkItemType } from 'fumadocs-ui/layouts/shared';
import { NavLogoTitle } from '@/components/nav-logo-title';
import { getNavLabels } from '@/lib/i18n';
import type { Locale } from './source';

// Top navbar menu, ported from the legacy Nuxt `AppHeader` (`localizedMenus`).
// Each entry maps to the same destination the old site used; labels live in the
// unified i18n catalog (`messages/{en,cn}.ts` `nav`).
const menuRoutes: { key: string; to: string }[] = [
  { key: 'welcome', to: '/' },
  { key: 'cloud', to: '/memos_cloud/getting_started/overview' },
  { key: 'openSource', to: '/open_source/getting_started/installation' },
  { key: 'selfDevelopedModel', to: '/self_developed_model/extraction_usage_example' },
  { key: 'openclaw', to: '/openclaw/guide' },
  { key: 'mcpAgent', to: '/mcp_agent/mcp/guide' },
  { key: 'apiDocs', to: '/api_docs/start/overview' },
  { key: 'samples', to: '/usecase/knowledge_qa_assistant' },
  { key: 'changelog', to: '/changelog' },
];

export type HomeMenuItem = {
  text: string;
  url: string;
  isHome: boolean;
  // Route prefix that marks this section active (e.g. `/cn/memos_cloud`).
  sectionBase: string;
};

// Shared menu model consumed both by the default navbar (`navLinks`) and the
// legacy-style centered second row (`HomeNav`).
export function homeMenuItems(locale: Locale): HomeMenuItem[] {
  const prefix = locale === 'cn' ? '/cn' : '';
  const labels = getNavLabels(locale);

  return menuRoutes.map(({ key, to }): HomeMenuItem => {
    const isHome = to === '/';
    const url = isHome ? prefix || '/' : `${prefix}${to}`;
    const firstSegment = to.split('/')[1] ?? '';
    return {
      text: labels[key]!,
      url,
      isHome,
      sectionBase: isHome ? url : `${prefix}/${firstSegment}`,
    };
  });
}

function navLinks(locale: Locale): LinkItemType[] {
  return homeMenuItems(locale).map(({ text, url, isHome }): LinkItemType => ({
    text,
    url,
    // Home highlights only on the exact route; section links highlight on any
    // nested doc page (mirrors the legacy active-menu behavior).
    active: isHome ? 'url' : 'nested-url',
  }));
}

export function baseOptions(locale: Locale = 'en'): BaseLayoutProps {
  const homeUrl = locale === 'cn' ? '/cn' : '/';

  return {
    nav: {
      // Function component so header + sidebar each mount a fresh `<Logo>` (unique
      // SVG defs IDs; a shared JSX element would reuse one `useId()` and hide the mark).
      title: NavLogoTitle,
      url: homeUrl,
    },
    links: navLinks(locale),
  };
}
