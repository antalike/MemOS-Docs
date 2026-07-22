// Minimal SSE (Server-Sent Events) reader, ported from the legacy
// `app/utils/stream.ts` + `useStreamFetch`. Parses `data: {json}` frames
// separated by blank lines, honours `event: error`, and stops on `[DONE]`.
//
// Runs entirely in the browser using the fetch ReadableStream API, so it is
// compatible with the static export (no server runtime involved).

export interface StreamChunk {
  type?: string;
  data?: string | string[];
  error?: string;
}

export interface StreamRequestOptions {
  baseURL: string;
  body: unknown;
  signal?: AbortSignal;
  /** Inactivity timeout in ms (resets on every chunk). 0 disables it. */
  timeout?: number;
}

/**
 * POSTs `body` as JSON and yields parsed SSE frames as they arrive.
 * Throws on network errors, aborts, inactivity timeouts, or `event: error`.
 */
export async function* streamChat(
  path: string,
  { baseURL, body, signal, timeout = 30_000 }: StreamRequestOptions,
): AsyncGenerator<StreamChunk> {
  const controller = new AbortController();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  let timer: ReturnType<typeof setTimeout> | null = null;
  const resetTimeout = () => {
    if (timer) clearTimeout(timer);
    if (timeout > 0) {
      timer = setTimeout(() => controller.abort(), timeout);
    }
  };
  const clearTimer = () => {
    if (timer) clearTimeout(timer);
  };

  resetTimeout();

  let response: Response;
  try {
    response = await fetch(`${baseURL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimer();
    throw error;
  }

  if (!response.ok || !response.body) {
    clearTimer();
    throw new Error(`stream request failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      resetTimeout();
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const lines = part
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

        let isError = false;
        let data = '';
        for (const line of lines) {
          if (line.startsWith('event: error')) isError = true;
          else if (line.startsWith('data: ')) data = line.slice(6);
        }

        if (!data) continue;
        if (data === '[DONE]') return;

        let parsed: StreamChunk;
        try {
          parsed = JSON.parse(data) as StreamChunk;
        } catch {
          continue; // skip malformed frames
        }
        if (isError) throw new Error(parsed.error || 'Stream error');
        yield parsed;
      }
    }
  } finally {
    clearTimer();
    reader.releaseLock();
  }
}
