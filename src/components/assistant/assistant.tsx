'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles, X, ArrowUp, Square, Trash2 } from 'lucide-react';
import { AssistantMarkdown } from '@/components/assistant/markdown';
import { streamChat } from '@/lib/sse-stream';
import { runtimeConfig } from '@/lib/shared';
import { trackEvent } from '@/lib/arms';
import { getInteractiveStrings, localeFromPathname } from '@/lib/i18n';
import { OPEN_ASSISTANT_EVENT } from '@/lib/assistant-events';
import { cn } from '@/lib/cn';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

type Status = 'ready' | 'submitted' | 'streaming';

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function Assistant() {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname ?? '/');
  const t = getInteractiveStrings(locale).assistant;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>('ready');
  const [input, setInput] = useState('');

  const sessionId = useRef<string>(uuid());
  const controllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const syncTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '28px';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, []);

  const isBusy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    // Keep up with streaming; re-scroll after suggestions / async markdown layout.
    scrollToBottom(status === 'streaming' ? 'auto' : 'smooth');
    const raf = requestAnimationFrame(() => scrollToBottom('auto'));
    const t1 = window.setTimeout(() => scrollToBottom('auto'), 150);
    const t2 = window.setTimeout(() => scrollToBottom('auto'), 400);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [messages, suggestions, status, scrollToBottom]);

  useEffect(() => {
    syncTextareaHeight();
  }, [input, syncTextareaHeight]);

  useEffect(() => {
    // Toggle the panel when triggered from elsewhere (e.g. the navbar "Ask AI").
    const toggleFromEvent = () => {
      trackEvent('点击Ask AI', '按钮点击');
      setOpen((prev) => !prev);
    };
    window.addEventListener(OPEN_ASSISTANT_EVENT, toggleFromEvent);
    return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, toggleFromEvent);
  }, []);

  const stop = useCallback(() => {
    trackEvent('停止对话', '按钮点击');
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus('ready');
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant' && !last.content.trim()) {
        return prev.slice(0, -1);
      }
      return prev;
    });
  }, []);

  const clearHistory = useCallback(() => {
    trackEvent('清空对话', '按钮点击');
    controllerRef.current?.abort();
    controllerRef.current = null;
    setMessages([]);
    setSuggestions([]);
    setInput('');
    setStatus('ready');
    sessionId.current = uuid();
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const query = raw.trim();
      if (!query || isBusy) return;

      setSuggestions([]);
      setInput('');
      const assistantId = uuid();
      setMessages((prev) => [
        ...prev,
        { id: uuid(), role: 'user', content: query },
        { id: assistantId, role: 'assistant', content: '' },
      ]);
      setStatus('submitted');

      const controller = new AbortController();
      controllerRef.current = controller;
      let assistantContent = '';
      let started = false;

      try {
        for await (const chunk of streamChat('/memos-ai/kb_stream_chat', {
          baseURL: runtimeConfig.apiBase,
          body: { user_id: sessionId.current, query },
          signal: controller.signal,
        })) {
          if (!started) {
            started = true;
            setStatus('streaming');
          }
          if (chunk.type === 'text' && typeof chunk.data === 'string') {
            assistantContent += chunk.data;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: assistantContent } : m)),
            );
          } else if (chunk.type === 'suggestions' && Array.isArray(chunk.data)) {
            setSuggestions(chunk.data);
          }
        }
        setStatus('ready');
      } catch (error) {
        setStatus('ready');
        if ((error as Error)?.name === 'AbortError') return;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.id === assistantId && !last.content.trim()) {
            return [...prev.slice(0, -1), { ...last, content: t.systemError }];
          }
          return [...prev, { id: uuid(), role: 'assistant', content: t.systemError }];
        });
        console.error('[assistant] stream failed:', error);
      } finally {
        controllerRef.current = null;
      }
    },
    [isBusy, t.systemError],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    trackEvent('发起对话', '按钮点击');
    void send(input);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(input);
    }
  };

  return (
    <>
      {/* Panel (opened via the navbar "Ask AI" button, which dispatches
          OPEN_ASSISTANT_EVENT to toggle visibility). The old floating trigger
          button was removed to match the pre-migration site. */}
      <div
        className={cn(
          'fixed bottom-0 inset-e-0 z-50 flex h-dvh w-full flex-col border-s bg-fd-background shadow-2xl',
          'transition-transform duration-300 sm:bottom-5 sm:inset-e-5 sm:h-[min(680px,calc(100dvh-2.5rem))] sm:w-[420px] sm:rounded-xl sm:border',
          open ? 'translate-x-0' : 'translate-x-[110%]',
        )}
        role="dialog"
        aria-label={t.title}
        aria-hidden={!open}
      >
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-fd-primary" />
            <span className="font-medium">{t.title}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={t.clear}
              disabled={messages.length === 0 && !isBusy}
              onClick={clearHistory}
              className="rounded-lg p-1.5 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <Trash2 className="size-4" />
            </button>
            <button
              type="button"
              aria-label={t.close}
              onClick={() => {
                trackEvent('关闭助手面板', '按钮点击');
                setOpen(false);
              }}
              className="rounded-lg p-1.5 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          <ChatBubble role="assistant" content={t.welcome} />
          {messages.map((m) => (
            <ChatBubble key={m.id} role={m.role} content={m.content} />
          ))}

          {status === 'ready' && suggestions.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-xs text-fd-muted-foreground">{t.suggestions}</div>
              <ul className="space-y-1.5">
                {suggestions.map((s, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => {
                        trackEvent('参考问题', '按钮点击');
                        void send(s);
                      }}
                      className="text-start text-sm text-fd-primary hover:underline"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div ref={bottomRef} aria-hidden className="h-px shrink-0" />
        </div>

        <form onSubmit={onSubmit} className="border-t p-3">
          <div className="flex items-end gap-2 rounded-lg border bg-fd-secondary/30 px-3 py-2 focus-within:border-fd-primary">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                syncTextareaHeight();
              }}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={t.inputPlaceholder}
              className="max-h-32 min-h-7 flex-1 resize-none overflow-y-auto bg-transparent py-0 text-sm leading-7 outline-none placeholder:text-fd-muted-foreground"
            />
            {isBusy ? (
              <button
                type="button"
                aria-label={t.stop}
                onClick={stop}
                className="flex size-7 shrink-0 items-center justify-center rounded-md bg-fd-primary text-fd-primary-foreground"
              >
                <Square className="size-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                aria-label={t.send}
                disabled={!input.trim()}
                className="flex size-7 shrink-0 items-center justify-center rounded-md bg-fd-primary text-fd-primary-foreground disabled:opacity-40"
              >
                <ArrowUp className="size-4" />
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}

function ChatBubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  if (role === 'user') {
    return (
      <div className="mb-4 flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-ee-sm bg-fd-primary px-3 py-2 text-sm text-fd-primary-foreground">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="mb-4 flex justify-start">
      <div
        className="prose min-h-6 max-w-[90%] text-sm text-fd-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
        aria-busy={!content}
        aria-live="polite"
      >
        {content ? <AssistantMarkdown text={content} /> : <TypingDots />}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1">
      <span className="size-1.5 animate-bounce rounded-full bg-fd-muted-foreground [animation-delay:-0.3s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-fd-muted-foreground [animation-delay:-0.15s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-fd-muted-foreground" />
    </span>
  );
}
