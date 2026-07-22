'use client';

import type { CSSProperties } from 'react';
import { Icon as Iconify } from '@iconify/react';

// Runtime icon rendering via the Iconify online API (api.iconify.design).
//
// `@iconify/react` fetches each icon's SVG on demand and caches it in
// localStorage, so no icon-set JSON is bundled and no build-time precompilation
// is needed. Icons render on the client only (empty placeholder during SSR /
// static export), which is acceptable for the nav + content icons here.
//
// Accepts Iconify-style names from the legacy content, e.g.:
//   "ri:database-line", "i-ri-database-line", "i-lucide-circle-help",
//   "i-simple-icons-github", "hugeicons:share-07", "ph:check-circle-duotone".

const knownCollections = ['simple-icons', 'hugeicons', 'lucide', 'ri', 'ph'];

function normalizeKey(name: string): string | null {
  let n = name.trim();
  if (n.startsWith('i-')) n = n.slice(2);
  if (n.includes(':')) return n;
  for (const c of knownCollections) {
    if (n.startsWith(`${c}-`)) return `${c}:${n.slice(c.length + 1)}`;
  }
  return null;
}

export function Icon({
  name,
  className,
  style,
}: {
  name?: string;
  className?: string;
  style?: CSSProperties;
}) {
  if (!name) return null;
  const key = normalizeKey(name);
  if (!key) return null;

  // Keep the `[data-icon]` wrapper so the sizing rules in global.css (default
  // `1em`, overridable by `size-*` utilities) and the homepage gradient fill
  // (`.home-card-icon svg path`) keep working unchanged.
  return (
    <span data-icon="" className={className} style={style}>
      <Iconify icon={key} />
    </span>
  );
}
