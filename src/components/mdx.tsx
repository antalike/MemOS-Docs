import type { ComponentProps } from 'react';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { Callout } from 'fumadocs-ui/components/callout';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';

// Tag our accordions so global.css can align them with the legacy Nuxt
// `<details>` look (subtle grey surface, `rounded-md`, small 14px summary)
// without relying on fumadocs' Tailwind class names.
function MemosAccordions({ className, ...props }: ComponentProps<typeof Accordions>) {
  return (
    <Accordions
      className={['memos-accordions', className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}
import { Icon } from '@/components/icon';
import { Badge, OpenclawReleaseTimeline } from '@/components/custom-mdx';
import { OpenAPIPage } from '@/components/api';
import { SmartPre } from '@/components/code-block';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Callout,
    Card,
    Cards,
    Tab,
    Tabs,
    Step,
    Steps,
    Accordion,
    Accordions: MemosAccordions,
    Icon,
    Badge,
    OpenclawReleaseTimeline,
    // OpenAPI: generated api-reference pages render `<OpenAPIPage>` (alias
    // `APIPage` for backward compat); both resolve the same server component.
    OpenAPIPage,
    APIPage: OpenAPIPage,
    // Smart copy button: injects the signed-in user's real key into
    // `YOUR_API_KEY`-containing code blocks (no-op for other blocks).
    pre: SmartPre,
    // Render markdown images as native <img>. fumadocs' default `img` is
    // next/image, which requires explicit width/height for remote URLs — but
    // remark-image's external probing is disabled (see source.config.ts) so
    // dimension-less CDN images would throw. The static export sets
    // images.unoptimized anyway, so next/image adds no value here.
    img: (props: ComponentProps<'img'>) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
        loading="lazy"
        {...props}
        className={['rounded-lg', props.className].filter(Boolean).join(' ')}
      />
    ),
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
