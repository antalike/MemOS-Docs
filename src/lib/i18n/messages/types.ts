// Shared interfaces for the unified i18n message catalog. Both `en.ts` and
// `cn.ts` implement the same `Messages` shape, so a missing translation shows
// up as a TypeScript error and the two files stay structurally mirrored.

import type { Translations } from 'fumadocs-ui/i18n';
import type { ChangelogCategory, ChangelogProductLine } from '../../changelog';

export interface HomeStrings {
  title: string;
  titlePrefix: string;
  titleSuffix: string;
  description: string;
  buttonText: string;
  openclawButton: string;
  items: { title: string; description: string }[];
}

export interface InteractiveStrings {
  assistant: {
    title: string;
    suggestions: string;
    inputPlaceholder: string;
    welcome: string;
    systemError: string;
    open: string;
    close: string;
    stop: string;
    send: string;
    clear: string;
  };
  apiKeyPicker: {
    title: string;
    description: string;
    projectLabel: string;
    keyLabel: string;
    empty: string;
    emptyProject: string;
    goDashboard: string;
    keyNameLabel: string;
    keyNamePlaceholder: string;
    defaultKeyName: string;
    create: string;
    createFailed: string;
    cancel: string;
    confirm: string;
    loadFailed: string;
    copy: string;
  };
}

export interface ChangelogStrings {
  title: string;
  description: string;
  tabs: {
    highlight: string;
    openSource: string;
  };
  github: string;
  productLines: Record<ChangelogProductLine, string>;
  categories: Record<ChangelogCategory, string>;
}

// Top navbar menu labels, keyed by the route keys in `layout.shared.tsx`.
export type NavLabels = Record<string, string>;

// fumadocs-ui / fumadocs-openapi framework string overrides. Keyed by the
// English source string; English is the framework default so `en.ui` is empty.
export type FrameworkTranslations = Partial<Translations> & Record<string, string>;

export interface Messages {
  home: HomeStrings;
  interactive: InteractiveStrings;
  changelog: ChangelogStrings;
  nav: NavLabels;
  ui: FrameworkTranslations;
}
