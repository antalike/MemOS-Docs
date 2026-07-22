'use client';

import {
  isValidElement,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { Check, Copy, Loader2 } from 'lucide-react';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { cn } from '@/lib/cn';
import { DEFAULT_API_KEY_PLACEHOLDER, resolveApiKey } from '@/lib/api-key';
import { getInteractiveStrings, localeFromPathname } from '@/lib/i18n';

// Recursively collect text from the (shiki-rendered) children, used only to
// decide whether a block contains the API-key placeholder.
function nodeText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (isValidElement(node)) {
    return nodeText((node as ReactElement<{ children?: ReactNode }>).props.children);
  }
  return '';
}

/**
 * Drop-in replacement for the MDX `pre` component. Behaves exactly like the
 * default Fumadocs code block, except blocks containing `YOUR_API_KEY` get a
 * smart copy button: when the visitor is signed in to the MemOS dashboard,
 * copying opens the API-key picker and substitutes the real key.
 */
export function SmartPre(props: ComponentProps<'pre'>) {
  const codeText = useMemo(() => nodeText(props.children), [props.children]);
  const hasPlaceholder = codeText.includes(DEFAULT_API_KEY_PLACEHOLDER);

  if (!hasPlaceholder) {
    return (
      <CodeBlock {...props}>
        <Pre>{props.children}</Pre>
      </CodeBlock>
    );
  }

  return (
    <CodeBlock
      {...props}
      allowCopy={false}
      Actions={({ className }) => <SmartCopyButton className={className} />}
    >
      <Pre>{props.children}</Pre>
    </CodeBlock>
  );
}

type CopyState = 'idle' | 'resolving' | 'copied';

function SmartCopyButton({ className }: { className?: string }) {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname ?? '/');
  const t = getInteractiveStrings(locale).apiKeyPicker;

  const ref = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<CopyState>('idle');
  // Holds resolved (possibly secret) text when the async clipboard write was
  // rejected because the user gesture expired; cleared after 10s.
  const pendingRef = useRef<string | null>(null);
  const timers = useRef<{ copied?: ReturnType<typeof setTimeout>; pending?: ReturnType<typeof setTimeout> }>({});

  const readCode = () =>
    ref.current?.closest('figure')?.querySelector('pre')?.textContent ?? '';

  const markCopied = () => {
    setState('copied');
    clearTimeout(timers.current.copied);
    timers.current.copied = setTimeout(() => setState('idle'), 2000);
  };

  const clearPending = () => {
    pendingRef.current = null;
    clearTimeout(timers.current.pending);
  };

  const writePlain = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      markCopied();
    } catch {
      /* clipboard permission denied — stay silent */
    }
  };

  const onClick = async () => {
    // A previous resolve finished but the async write was rejected: this fresh
    // gesture writes it synchronously.
    if (pendingRef.current) {
      const text = pendingRef.current;
      clearPending();
      await writePlain(text);
      return;
    }

    if (state === 'resolving') return;
    const code = readCode();
    setState('resolving');

    const textPromise = resolveApiKey({ source: code, placeholder: DEFAULT_API_KEY_PLACEHOLDER })
      .then((text) => text ?? code)
      .catch(() => code);

    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        // Hand the promise to the clipboard so write() runs inside the gesture
        // (Safari-friendly); the content arrives shortly after.
        const blobPromise = textPromise.then((text) => new Blob([text], { type: 'text/plain' }));
        await navigator.clipboard.write([new ClipboardItem({ 'text/plain': blobPromise })]);
        markCopied();
      } else {
        const text = await textPromise;
        try {
          await navigator.clipboard.writeText(text);
          markCopied();
        } catch {
          pendingRef.current = text;
          clearTimeout(timers.current.pending);
          timers.current.pending = setTimeout(clearPending, 10_000);
        }
      }
    } catch {
      const text = await textPromise;
      pendingRef.current = text;
      clearTimeout(timers.current.pending);
      timers.current.pending = setTimeout(clearPending, 10_000);
    } finally {
      setState((s) => (s === 'resolving' ? 'idle' : s));
    }
  };

  const Icon = state === 'copied' ? Check : state === 'resolving' ? Loader2 : Copy;

  return (
    <button
      ref={ref}
      type="button"
      aria-label={t.copy}
      onClick={onClick}
      className={cn('transition-colors [&_svg]:size-3.5', className)}
    >
      <Icon className={cn(state === 'resolving' && 'animate-spin')} />
    </button>
  );
}
