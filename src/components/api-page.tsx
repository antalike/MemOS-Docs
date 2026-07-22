'use client';

import type { ReactNode } from 'react';
import { createOpenAPIPage } from 'fumadocs-openapi/ui';
import { createCodeUsageGeneratorRegistry } from 'fumadocs-openapi/requests/generators';
import { registerDefault } from 'fumadocs-openapi/requests/generators/all';
import {
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
} from 'fumadocs-ui/components/codeblock';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';

// Auto-generated request examples (curl / python / js / go / ...). Used for the
// open-source API, which ships no hand-written samples.
const codeUsages = createCodeUsageGeneratorRegistry();
registerDefault(codeUsages);

// The client component that renders the actual OpenAPI UI (operation header,
// parameters, request/response schemas, code samples and the playground).
export const ClientOpenAPIPage = createOpenAPIPage({
  codeUsages,
  // Scope localStorage so the multiple specs don't clobber each other's state.
  storageKeyPrefix: 'memos-openapi-',
});

// ---------------------------------------------------------------------------
// Dashboard (cloud) code samples — curated tabs only.
//
// Dashboard operations carry hand-written `x-codeSamples` (Python HTTP / Python
// SDK / Curl) matching the legacy site. Two problems with the default renderer:
//   1. fumadocs appends its full default language set (cURL, JS, Go, Java, …).
//   2. its built-in `<UsageTab>` resolves each tab's generator from the GLOBAL
//      `codeUsages` registry, but inline `x-codeSamples` live only in the
//      per-operation registry — so their code never renders (empty tabs).
//   3. samples that share a `lang` (both Python tabs are `python`) collide on
//      the `id ?? lang` key, dropping one tab.
//
// We solve all three purely in the render layer (no spec/build changes):
//   - pass an EMPTY global registry (no default languages),
//   - re-inject the operation's `x-codeSamples` via `generateCodeSamples` with
//     unique, prefixed ids (avoids the lang collision),
//   - render the tabs ourselves from the merged registry, reading each inline
//     source directly (so the hand-written code actually shows).
// ---------------------------------------------------------------------------

const CURATED_ID_PREFIX = 'memos-sample-';

type CodeSample = { lang: string; label?: string; source?: string };

type UsageRegistryLike = {
  map: () => Map<
    string,
    { lang: string; label?: string; generate: (data: never, ctx: never) => string }
  >;
};

function renderCuratedUsageTabs(registry: UsageRegistryLike): ReactNode {
  const entries = Array.from(registry.map().entries()).filter(([id]) =>
    id.startsWith(CURATED_ID_PREFIX),
  );
  if (entries.length === 0) return null;

  return (
    <CodeBlockTabs defaultValue={entries[0][0]}>
      <CodeBlockTabsList>
        {entries.map(([id, item]) => (
          <CodeBlockTabsTrigger key={id} value={id}>
            {item.label ?? item.lang}
          </CodeBlockTabsTrigger>
        ))}
      </CodeBlockTabsList>
      {entries.map(([id, item]) => (
        <CodeBlockTab key={id} value={id}>
          <DynamicCodeBlock
            lang={item.lang}
            code={item.generate(undefined as never, undefined as never)}
          />
        </CodeBlockTab>
      ))}
    </CodeBlockTabs>
  );
}

export const ClientOpenAPIPageCurated = createOpenAPIPage({
  codeUsages: createCodeUsageGeneratorRegistry(),
  storageKeyPrefix: 'memos-openapi-',
  generateCodeSamples: ({ operation }) => {
    const samples =
      (operation as { 'x-codeSamples'?: CodeSample[] })['x-codeSamples'] ?? [];
    return samples.map((sample, i) => ({
      id: `${CURATED_ID_PREFIX}${i}`,
      lang: sample.lang,
      label: sample.label,
      source: sample.source,
    }));
  },
  content: {
    renderAPIExampleUsageTabs: (registry) => renderCuratedUsageTabs(registry),
  },
});
