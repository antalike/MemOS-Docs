'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useSearchContext } from 'fumadocs-ui/contexts/search';
import { SidebarTrigger } from 'fumadocs-ui/layouts/notebook/slots/sidebar';
import { Search, Stars, Sun, Moon, LayoutDashboard, QrCode, Menu, PanelLeft } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Icon } from '@/components/icon';
import { OPEN_ASSISTANT_EVENT } from '@/lib/assistant-events';
import { runtimeConfig } from '@/lib/shared';
import { homeMenuItems, type HomeMenuItem } from '@/lib/layout.shared';
import { setLocaleCookie, switchLocalePath, targetLocale } from '@/lib/locale';
import type { Locale } from '@/lib/source';

// Unified, two-row site header shared by the home and docs layouts (Prisma docs
// style): the first row holds the brand lockup on the left and the control
// cluster on the right (search, Ask AI, Dashboard, language, theme, community);
// the second row holds the section tabs, centered. Rendered as the
// `nav.component` of both `HomeLayout` and the notebook `DocsLayout`, so both
// surfaces share one header instead of the previous two-row / sidebar split.
const SEARCH_LABEL: Record<Locale, string> = { en: 'Search', cn: '搜索' };
const LANG_ARIA: Record<Locale, string> = {
  en: 'Switch language',
  cn: '切换语言',
};
const DASHBOARD_LABEL: Record<Locale, string> = { en: 'Dashboard', cn: '控制台' };
const NAV_MENU_ARIA: Record<Locale, string> = {
  en: 'Open navigation menu',
  cn: '打开导航菜单',
};
const COMMUNITY: Record<Locale, { label: string; aria: string; title: string; wechat: string }> = {
  en: {
    label: 'Community',
    aria: 'Join the community',
    title: 'Welcome to the community',
    wechat: 'WeChat',
  },
  cn: {
    label: '社群',
    aria: '加入社群',
    title: '欢迎来到开发者社区',
    wechat: '微信',
  },
};

// Legacy bordered square icon button (language / theme / community / menu).
const ICON_BUTTON =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-600 dark:text-slate-400 dark:hover:border-slate-100 dark:hover:text-slate-100';

// Legacy UContentSearchButton + AssistantCollapse (`ring ring-inset`, white surface).
const HEADER_FIELD =
  'inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors dark:bg-fd-background';
const SEARCH_BTN = `${HEADER_FIELD} w-90 max-w-full cursor-pointer text-slate-600 ring-slate-200 hover:bg-slate-50 max-xl:w-60 dark:text-slate-400 dark:ring-[#222a35] dark:hover:bg-[#0e1219]`;
const ASK_AI_BTN = `${HEADER_FIELD} ml-2.5 shrink-0 cursor-pointer text-slate-700 ring-slate-300 hover:bg-slate-50 dark:text-slate-200 dark:ring-[#222a35] dark:hover:bg-[#0e1219]`;

// padding is 0 (margins come from `calc(100% - 40px)` in global.css).
const HEADER_INNER = 'site-header-inner flex items-center gap-3';
const HEADER_SIDE = 'flex flex-1 items-center gap-1.5 min-w-0';

export function SiteHeader({
  locale,
  variant = 'home',
}: {
  locale: Locale;
  variant?: 'home' | 'docs';
}) {
  const homeUrl = locale === 'cn' ? '/cn' : '/';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <header
      id="nd-nav"
      className="[grid-area:header] sticky top-(--fd-docs-row-1,0px) z-40"
    >
      <div className="bg-white/75 backdrop-blur dark:bg-[#02020b]/75">
        {/* Row 1 — brand + control cluster (legacy `--ui-topbar-height: 60px`). */}
        <div className="border-b border-slate-100 lg:border-b-0 dark:border-[#222a35]">
          <div className={`${HEADER_INNER} h-[var(--site-topbar-height,60px)]`}>
            <div className={HEADER_SIDE}>
              <Link
                href={homeUrl}
                aria-label="MemOS"
                className="shrink-0 text-slate-900 dark:text-white"
              >
                <Logo className="h-10 w-auto shrink-0" />
              </Link>
            </div>

            {/* Legacy UHeader center slot (search + Ask AI). */}
            <div className="hidden shrink-0 items-center md:flex">
              <SearchButton label={SEARCH_LABEL[locale]} />
              <AskAiButton />
            </div>

            <div className={`${HEADER_SIDE} justify-end`}>
              <MobileSearchButton label={SEARCH_LABEL[locale]} />
              <DashboardButton locale={locale} />
              <LanguageToggle locale={locale} />
              <ThemeToggle />
              <CommunityButton locale={locale} />
              <MobileSectionMenuButton
                locale={locale}
                open={mobileNavOpen}
                onToggle={() => setMobileNavOpen((open) => !open)}
              />
              {variant === 'docs' ? (
                <SidebarTrigger
                  aria-label="Toggle sidebar"
                  className={`${ICON_BUTTON} lg:hidden`}
                >
                  <PanelLeft className="size-4" />
                </SidebarTrigger>
              ) : null}
            </div>
          </div>
        </div>

        {mobileNavOpen ? (
          <MobileSectionNavPanel locale={locale} />
        ) : null}

        {/* Row 2 — centered section tabs (legacy `AppMenus`, desktop only). */}
        <div className="hidden border-b border-slate-100 lg:block dark:border-[#222a35]">
          <SectionTabs locale={locale} />
        </div>
      </div>
    </header>
  );
}

function isMenuActive(item: HomeMenuItem, pathname: string) {
  return item.isHome
    ? pathname === item.sectionBase
    : pathname === item.sectionBase ||
        pathname.startsWith(`${item.sectionBase}/`);
}

function MobileSectionMenuButton({
  locale,
  open,
  onToggle,
}: {
  locale: Locale;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={NAV_MENU_ARIA[locale]}
      aria-expanded={open}
      onClick={onToggle}
      className={`${ICON_BUTTON} lg:hidden`}
    >
      <Menu className="size-4" />
    </button>
  );
}

function MobileSectionNavPanel({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = homeMenuItems(locale);

  return (
    <div className="relative z-50 border-b border-slate-100 lg:hidden dark:border-[#222a35]">
      <nav className={`${HEADER_INNER} py-1`}>
        {items.map((item) => {
          const active = isMenuActive(item, pathname);
          return (
            <a
              key={item.url}
              href={item.url}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
                  return;
                }
                e.preventDefault();
                router.push(item.url);
              }}
              className="flex h-11 items-center text-sm leading-5 font-medium transition-colors"
            >
              <span className="truncate">
                <span
                  className={
                    active
                      ? 'font-semibold text-[var(--color-fd-primary)]'
                      : 'text-slate-900 hover:text-black dark:text-slate-200 dark:hover:text-white'
                  }
                >
                  {item.text}
                </span>
              </span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}

// Centered, single-line section tabs with an active underline (desktop).
function SectionTabs({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const items = homeMenuItems(locale);

  return (
    <div className="site-header-inner overflow-x-auto scrollbar-none">
      <nav className="mx-auto flex w-max items-center justify-center">
        {items.map((item) => {
          const active = isMenuActive(item, pathname);
          return (
            <Link
              key={item.url}
              href={item.url}
              className="relative mx-5 inline-flex shrink-0 cursor-pointer items-center px-0 py-2 text-sm leading-5 font-medium transition-colors"
            >
              <span className="truncate">
                <span
                  className={
                    active
                      ? 'font-semibold text-[var(--color-fd-primary)]'
                      : 'text-slate-900 hover:text-black dark:text-slate-200 dark:hover:text-white'
                  }
                >
                  {item.text}
                </span>
              </span>
              {active ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[var(--color-fd-primary)]" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function DashboardButton({ locale }: { locale: Locale }) {
  const prefix = locale === 'cn' ? '/cn' : '';
  const from = encodeURIComponent(`${prefix}/quickstart/`);
  const href = `${runtimeConfig.dashboardUrl}${prefix}/login/?from=${from}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="site-dashboard-btn hidden h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm font-normal text-white transition-opacity hover:opacity-90 sm:inline-flex"
      style={{
        background:
          'linear-gradient(270deg, var(--color-linear-primary) 15%, var(--color-primary-light) 118%)',
      }}
    >
      <LayoutDashboard className="size-4 shrink-0" />
      <span className="font-medium">{DASHBOARD_LABEL[locale]}</span>
    </a>
  );
}

function CommunityButton({ locale }: { locale: Locale }) {
  const t = COMMUNITY[locale];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        aria-label={t.aria}
        title={t.aria}
        onClick={() => setOpen((v) => !v)}
        className={`${ICON_BUTTON} 2xl:w-auto 2xl:min-w-0 2xl:justify-start 2xl:gap-1.5 2xl:px-2.5`}
      >
        <QrCode className="size-4 shrink-0" />
        <span className="hidden max-w-24 truncate text-left text-xs font-medium text-slate-700 2xl:inline dark:text-slate-200">
          {t.label}
        </span>
      </button>

      {open ? (
        <div className="absolute inset-e-0 top-full z-50 mt-3 w-64 rounded-xl border border-fd-border bg-fd-background p-4 shadow-lg">
          <p className="mb-3 text-center text-sm font-medium text-fd-foreground">{t.title}</p>
          <div className="grid grid-cols-2 gap-3">
            <QrCard
              src="https://cdn.memtensor.com.cn/img/qrcode-wechat_compressed.png"
              icon="ic:baseline-wechat"
              label={t.wechat}
            />
            <QrCard
              src="https://statics.memtensor.com.cn/landing-v2/qrcode-discord-v2.webp"
              icon="ic:baseline-discord"
              label="Discord"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function QrCard({ src, icon, label }: { src: string; icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="size-26 shrink-0 rounded object-cover" />
      <div className="flex items-center gap-1 text-xs leading-5 text-fd-muted-foreground">
        <Icon name={icon} className="size-4 shrink-0" />
        <span>{label}</span>
      </div>
    </div>
  );
}

function SearchButton({ label }: { label: string }) {
  const { setOpenSearch } = useSearchContext();
  return (
    <button
      type="button"
      data-search-full=""
      onClick={() => setOpenSearch(true)}
      className={SEARCH_BTN}
    >
      <Search className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function AskAiButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_ASSISTANT_EVENT))}
      className={ASK_AI_BTN}
    >
      <Stars className="size-4 shrink-0" />
      Ask AI
    </button>
  );
}

function MobileSearchButton({ label }: { label: string }) {
  const { setOpenSearch } = useSearchContext();
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => setOpenSearch(true)}
      className="inline-flex size-9 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 md:hidden dark:text-slate-400 dark:hover:bg-slate-900/40 dark:hover:text-slate-100"
    >
      <Search className="size-5" />
    </button>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className={ICON_BUTTON}
    >
      <Moon className="size-4 dark:hidden" />
      <Sun className="hidden size-4 dark:block" />
    </button>
  );
}

function LanguageToggle({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const next = targetLocale(locale);
  const href = switchLocalePath(pathname ?? '/', next);

  return (
    <Link
      href={href}
      aria-label={LANG_ARIA[locale]}
      className={ICON_BUTTON}
      onClick={() => setLocaleCookie(next)}
    >
      <LocaleSwitchIcon className="size-4" />
    </Link>
  );
}

// Legacy Nuxt `LocaleSwitch.vue` glyph (a "文A" language-switch mark).
function LocaleSwitchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M5,15L5,17C4.99967,18.0466,5.8063199999999995,18.9165,6.85,18.995L7,19L10,19L10,21L7,21C4.79086,21,3,19.2091,3,17L3,15L5,15ZM18,10L22.4,21L20.245,21L19.044,18L14.954,18L13.755,21L11.601,21L16,10L18,10ZM17,12.885L15.753,16L18.245,16L17,12.885ZM8,2L8,4L12,4L12,11L8,11L8,14L6,14L6,11L2,11L2,4L6,4L6,2L8,2ZM17,3C19.2091,3,21,4.79086,21,7L21,9L19,9L19,7C19,5.89543,18.1046,5,17,5L14,5L14,3L17,3ZM6,6L4,6L4,9L6,9L6,6ZM10,6L8,6L8,9L10,9L10,6Z"
      />
    </svg>
  );
}
