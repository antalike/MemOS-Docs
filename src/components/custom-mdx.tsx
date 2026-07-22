import type { ReactNode } from 'react';

export function Badge({ children }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-fd-border bg-fd-muted px-1.5 py-0.5 text-xs font-medium text-fd-foreground">
      {children}
    </span>
  );
}

// Minimal inline markdown (bold + inline code) for plain-string timeline items.
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      nodes.push(<strong key={key++}>{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      nodes.push(<code key={key++}>{m[2]}</code>);
    }
    last = regex.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

interface TimelineSection {
  title?: string;
  items?: string[];
}
interface TimelinePlugin {
  title?: string;
  version?: string;
  summary?: string;
  sections?: TimelineSection[];
}
interface TimelineRelease {
  date?: string;
  plugins?: TimelinePlugin[];
}

// Phase-2 functional rendering of the OpenClaw changelog timeline.
// Visual polish is deferred to Phase 4.
export function OpenclawReleaseTimeline({
  releases = [],
}: {
  releases?: TimelineRelease[];
}) {
  return (
    <div className="flex flex-col gap-10 border-s border-fd-border ps-6">
      {releases.map((release, i) => (
        <section key={release.date ?? i} className="relative">
          <span className="absolute inset-s-[-1.6rem] top-1.5 size-3 rounded-full bg-fd-primary" />
          <h3 className="mt-0 text-fd-foreground">{release.date}</h3>
          {release.plugins?.map((plugin, j) => (
            <div key={j} className="mt-3">
              <div className="flex items-center gap-2">
                <strong>{plugin.title}</strong>
                {plugin.version ? <Badge>{plugin.version}</Badge> : null}
              </div>
              {plugin.summary ? (
                <p className="text-sm text-fd-muted-foreground">
                  {renderInline(plugin.summary)}
                </p>
              ) : null}
              {plugin.sections?.map((section, k) => (
                <div key={k} className="mt-2">
                  {section.title ? (
                    <h4 className="mb-1 text-sm font-semibold">
                      {section.title}
                    </h4>
                  ) : null}
                  <ul className="my-1">
                    {section.items?.map((item, l) => (
                      <li key={l}>{renderInline(item)}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
