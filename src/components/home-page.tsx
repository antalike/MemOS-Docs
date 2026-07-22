import Link from 'next/link';
import type { Locale } from '@/lib/source';
import { getHomeStrings } from '@/lib/i18n';
import { Icon } from '@/components/icon';
import { LogoWordmark } from '@/components/logo-wordmark';

// Icons mirror the legacy Nuxt homepage (`app/pages/index.vue`) exactly. The
// `material-symbols` / `ant-design` icons resolve via the Iconify online API.
const cardRoutes: { to: string; icon: string }[] = [
  { to: '/memos_cloud/introduction/workings/mem_production', icon: 'ri:brain-line' },
  { to: '/memos_cloud/getting_started/quick_start', icon: 'ri:file-cloud-fill' },
  { to: '/open_source/getting_started/installation', icon: 'ri:open-source-fill' },
  { to: '/usecase/knowledge_qa_assistant', icon: 'ri:book-read-fill' },
  { to: '/mcp_agent/mcp/guide', icon: 'material-symbols:switch-access-3' },
  { to: '/api_docs/start/overview', icon: 'ant-design:api-filled' },
];

// Legacy `BaseButton.vue` sizing + shape (pill CTA, not fumadocs `rounded-lg`).
const HERO_BTN =
  'inline-flex items-center justify-center gap-1.5 h-[2.375rem] px-5 text-base font-medium rounded-[48px] cursor-pointer no-underline whitespace-nowrap transition-opacity hover:opacity-90 sm:h-11 sm:px-7';
const HERO_BTN_PRIMARY =
  'text-white bg-[linear-gradient(270deg,#408DFC_0%,#4044ED_51%,#AA75EF_100%)] dark:bg-[linear-gradient(270deg,#5A9CFC_0%,#5D60F3_51%,#9F80F5_100%)]';
const HERO_BTN_DEFAULT =
  'bg-slate-200 text-slate-900 dark:bg-[#232E60] dark:text-white dark:[background-image:linear-gradient(249deg,rgba(0,0,0,0.42)_-5%,#ffffff_100%)] dark:bg-blend-soft-light';

export function HomePage({ locale }: { locale: Locale }) {
  const t = getHomeStrings(locale);
  const prefix = locale === 'cn' ? '/cn' : '';
  const href = (to: string) => `${prefix}${to}`;

  const items = t.items.map((item, index) => ({
    ...item,
    to: href(cardRoutes[index]!.to),
    icon: cardRoutes[index]!.icon,
  }));

  return (
    <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 pb-16 sm:px-6 lg:px-0">
      {/* Brand gradient used as fill for the card icons. */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="memos-icon-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="15%" stopColor="#408DFC" />
            <stop offset="50%" stopColor="#4044ED" />
            <stop offset="100%" stopColor="#AA75EF" />
          </linearGradient>
        </defs>
      </svg>

      <section className="mx-auto max-w-[92%] px-4 pt-[38px] pb-[38px] text-center sm:px-6 lg:px-0 xl:max-w-[1120px]">
        <h1 className="text-2xl leading-8.5 font-black tracking-tight [-webkit-text-stroke:0.22px_currentColor] [paint-order:stroke_fill] sm:text-3xl sm:leading-10.5 lg:text-4xl lg:leading-12.5">
          <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-balance">
            <span>{t.titlePrefix}</span>
            <LogoWordmark />
            {t.titleSuffix ? <span>{t.titleSuffix}</span> : null}
          </span>
        </h1>
        <p className="mt-1.5 text-sm leading-4.5 text-fd-muted-foreground sm:mt-2 sm:text-sm sm:leading-5 lg:text-base lg:leading-5.5">
          {t.description}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:mt-8 sm:gap-x-8 sm:gap-y-4">
          <Link
            href={href('/memos_cloud/getting_started/quick_start')}
            className={`${HERO_BTN} ${HERO_BTN_PRIMARY}`}
          >
            {t.buttonText}
            <Icon name="ri:arrow-right-line" className="size-5" />
          </Link>
          <Link
            href={href('/openclaw/guide')}
            className={`${HERO_BTN} ${HERO_BTN_DEFAULT}`}
          >
            {t.openclawButton}
            <Icon name="ri:arrow-right-line" className="size-5" />
          </Link>
        </div>
      </section>

      <div className="mx-auto grid max-w-[92%] grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:max-w-[1020px] xl:grid-cols-3">
        {items.map((item, index) => (
          <Link
            key={index}
            href={item.to}
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-fd-card ring ring-slate-200 dark:ring-[#222a35]"
          >
            <div className="home-card-icon flex h-40 shrink-0 items-center justify-center bg-indigo-50 bg-cover dark:bg-[#171823] dark:bg-[url(https://cdn.memtensor.com.cn/img/1766476630033_bbjhot_compressed.png)] dark:group-hover:bg-[url(https://cdn.memtensor.com.cn/img/1766476753478_f7b4hm_compressed.png)]">
              <Icon name={item.icon} className="relative z-10 size-10" />
            </div>
            <div className="flex min-h-0 flex-1 flex-col justify-start gap-1 px-4 py-3.5">
              <div className="text-sm font-bold text-slate-900 lg:text-base dark:text-slate-50">
                {item.title}
              </div>
              <div className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                {item.description}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
