'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import type {
  ChangelogCategory,
  ChangelogVersion,
  OpenSourceVersion,
} from '@/lib/changelog';
import {
  formatChangeEntry,
  getOrderedCategories,
  getOrderedProductLines,
} from '@/lib/changelog';
import type { ChangelogStrings } from '@/lib/i18n';
import { Icon } from '@/components/icon';
import { StarsBg } from '@/components/stars-bg';

const categoryClass: Record<ChangelogCategory, string> = {
  'New Features': 'text-sky-400',
  Improvements: 'text-emerald-500',
  'Bug Fixes': 'text-orange-400',
};

const categoryIcons: Record<ChangelogCategory, string> = {
  'New Features': 'ri:sparkling-2-line',
  Improvements: 'ri:arrow-up-line',
  'Bug Fixes': 'ri:bug-line',
};

const openSourceIcons: Record<string, string> = {
  feat: 'ri:sparkling-2-line',
  fix: 'ri:bug-line',
  docs: 'ri:file-text-line',
  style: 'ri:palette-line',
  refactor: 'ri:code-line',
  test: 'ri:flask-line',
  chore: 'ri:tools-line',
  ci: 'ri:settings-3-line',
};

function getOpenSourceIcon(type: string) {
  if (type.includes('feat')) return openSourceIcons.feat!;
  if (type.includes('fix')) return openSourceIcons.fix!;
  return openSourceIcons[type] ?? 'ri:question-line';
}

function CategoryHeading({
  category,
  label,
}: {
  category: ChangelogCategory;
  label: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 text-base font-bold ${categoryClass[category]}`}
    >
      <Icon name={categoryIcons[category]} className="size-5" />
      {label}
    </div>
  );
}

function HighlightVersionBody({
  version,
  strings,
}: {
  version: ChangelogVersion;
  strings: ChangelogStrings;
}) {
  if (version.legacy) {
    return (
      <div className="space-y-8">
        {getOrderedCategories(version.changedInfo ?? {}).map((category) => (
          <section key={category} className="space-y-4">
            <CategoryHeading
              category={category}
              label={strings.categories[category]}
            />
            {version.changedInfo?.[category]?.map((item) => (
              <div key={item.type} className="space-y-2">
                <div className="text-base font-medium text-fd-foreground">
                  {item.type}:
                </div>
                <ul className="ml-4 list-inside list-disc space-y-1 text-sm text-fd-muted-foreground">
                  {item.changedInfo.map((change, idx) => (
                    <li key={idx}>{formatChangeEntry(change)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {getOrderedProductLines(version.products ?? {}).map((productLine) => (
        <section key={productLine} className="space-y-5">
          <h3 className="border-b border-fd-border pb-2 text-lg font-semibold text-fd-foreground">
            {strings.productLines[productLine]}
          </h3>
          {getOrderedCategories(version.products![productLine]!).map(
            (category) => (
              <div key={category} className="ml-1 space-y-4">
                <CategoryHeading
                  category={category}
                  label={strings.categories[category]}
                />
                {version.products![productLine]![category]?.map((item) => (
                  <div key={item.type} className="space-y-2">
                    <div className="text-base font-medium text-fd-foreground">
                      {item.type}:
                    </div>
                    <ul className="ml-4 list-inside list-disc space-y-1 text-sm text-fd-muted-foreground">
                      {item.changedInfo.map((change, idx) => (
                        <li key={idx}>{formatChangeEntry(change)}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ),
          )}
        </section>
      ))}
    </div>
  );
}

function VersionTimelineItem({
  name,
  date,
  isLast,
  children,
}: {
  name: string;
  date: string;
  isLast: boolean;
  children: ReactNode;
}) {
  return (
    <article className="relative flex gap-x-4 sm:gap-x-6">
      {/* indicator column: dot + connecting line (legacy UChangelogVersions) */}
      <div className="relative flex w-3 flex-none justify-center">
        {!isLast ? (
          <div
            aria-hidden="true"
            className="absolute top-3 bottom-0 left-1/2 w-px -translate-x-1/2 bg-fd-border"
          />
        ) : null}
        <div className="relative z-10 mt-1.5 size-3 rounded-full bg-fd-primary ring-4 ring-fd-background" />
      </div>
      <div className="min-w-0 flex-1 pb-12">
        <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-xl font-bold text-fd-foreground">{name}</h2>
          <time className="text-sm text-fd-muted-foreground">{date}</time>
        </div>
        {children}
      </div>
    </article>
  );
}

export function ChangelogContent({
  strings,
  highlightVersions,
  openSourceVersions,
}: {
  strings: ChangelogStrings;
  highlightVersions: ChangelogVersion[];
  openSourceVersions: OpenSourceVersion[];
}) {
  const [activeTab, setActiveTab] = useState<'highlight' | 'opensource'>(
    'highlight',
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-10 sm:px-6">
      <section className="relative pb-12 text-center">
        {/* Full-bleed background: breaks out of the max-w-3xl container so the
            glow + stars span the whole viewport width. Intentionally NOT
            clipped — the legacy `UPageHero` lets the blur glow stay a soft
            radial circle; clipping it would turn it into a hard rectangular
            block. Horizontal overflow is contained by the body's
            `overflow-x: clip`. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-1/2 z-[-1] w-screen -translate-x-1/2"
        >
          {/* primary blur glow above the title (legacy UPageHero #top slot) */}
          <div className="absolute top-0 left-1/2 size-60 -translate-x-1/2 -translate-y-80 rounded-full bg-fd-primary blur-[300px] sm:size-80" />
          <StarsBg />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-fd-foreground sm:text-4xl">
          {strings.title}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-fd-muted-foreground">
          {strings.description}
        </p>
        <div className="mt-6">
          <Link
            href="https://github.com/MemTensor/MemOS/releases"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-fd-border bg-fd-card px-4 py-2 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent"
          >
            {strings.github}
            <Icon name="ri:external-link-line" className="size-4" />
          </Link>
        </div>
      </section>

      <div className="mt-8 flex border-b border-fd-border">
        {(
          [
            ['highlight', strings.tabs.highlight],
            ['opensource', strings.tabs.openSource],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex-1 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === key
                ? 'border-fd-primary text-fd-foreground'
                : 'border-transparent text-fd-muted-foreground hover:text-fd-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {activeTab === 'highlight'
          ? highlightVersions.map((version, index) => (
              <VersionTimelineItem
                key={`${version.name}-${version.date}`}
                name={version.name}
                date={version.date}
                isLast={index === highlightVersions.length - 1}
              >
                <HighlightVersionBody version={version} strings={strings} />
              </VersionTimelineItem>
            ))
          : openSourceVersions.map((version, index) => (
              <VersionTimelineItem
                key={`${version.name}-${version.date}`}
                name={version.name}
                date={version.date}
                isLast={index === openSourceVersions.length - 1}
              >
                <ol className="space-y-4">
                  {version.changedInfo.map((change, idx) => (
                    <li
                      key={idx}
                      className="flex flex-wrap items-start gap-x-1 text-sm leading-6"
                    >
                      <span className="inline-flex items-center gap-2 font-bold text-fd-foreground">
                        <Icon
                          name={getOpenSourceIcon(change.type)}
                          className="size-4 shrink-0"
                        />
                        {change.type}:
                      </span>
                      <span className="text-fd-muted-foreground">
                        {change.description} by @{change.author}
                        {change.pr ? (
                          <>
                            {' '}
                            <Link
                              href={`https://github.com/MemTensor/MemOS/pull/${change.pr}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-fd-primary hover:underline"
                            >
                              (#{change.pr})
                            </Link>
                          </>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ol>
              </VersionTimelineItem>
            ))}
      </div>
    </main>
  );
}
