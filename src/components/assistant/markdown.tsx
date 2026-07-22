'use client';

import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import {
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  Suspense,
  isValidElement,
  use,
  useDeferredValue,
} from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';

function Pre(props: ComponentProps<'pre'>) {
  const code = props.children;
  if (!isValidElement(code)) return null;

  const codeProps = (code as ReactElement).props as ComponentProps<'code'>;
  const content = codeProps.children;
  if (typeof content !== 'string') return null;

  let lang =
    codeProps.className
      ?.split(' ')
      .find((v) => v.startsWith('language-'))
      ?.slice('language-'.length) ?? 'text';

  if (lang === 'mdx') lang = 'md';

  return <DynamicCodeBlock lang={lang} code={content.trimEnd()} />;
}

const processor = remark().use(remarkGfm).use(remarkRehype);

const cache = new Map<string, Promise<ReactNode>>();

async function processMarkdown(content: string): Promise<ReactNode> {
  const nodes = processor.parse({ value: content });
  const hast = await processor.run(nodes);

  return toJsxRuntime(hast, {
    development: false,
    jsx,
    jsxs,
    Fragment,
    components: {
      ...defaultMdxComponents,
      pre: Pre,
      img: undefined,
    },
  });
}

function Renderer({ text }: { text: string }) {
  const result = cache.get(text) ?? processMarkdown(text);
  cache.set(text, result);
  return use(result);
}

/** Streamed assistant replies — Fumadocs MDX components + prose typography (tables, etc.). */
export function AssistantMarkdown({ text }: { text: string }) {
  const deferredText = useDeferredValue(text);

  return (
    <Suspense fallback={<p className="invisible">{text}</p>}>
      <Renderer text={deferredText} />
    </Suspense>
  );
}
