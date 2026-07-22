'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X, ArrowUpRight } from 'lucide-react';
import {
  usePickerState,
  settlePicker,
  type ApiKeyMasked,
} from '@/components/api-key/picker-store';
import { runtimeConfig } from '@/lib/shared';
import { getInteractiveStrings, localeFromPathname } from '@/lib/i18n';

export function ApiKeyPickerHost() {
  const { open, context } = usePickerState();
  const pathname = usePathname();
  const locale = localeFromPathname(pathname ?? '/');
  const t = getInteractiveStrings(locale).apiKeyPicker;

  const [projectId, setProjectId] = useState<string | undefined>();
  const [keyId, setKeyId] = useState<string | number | undefined>();
  const [keys, setKeys] = useState<ApiKeyMasked[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createFailed, setCreateFailed] = useState(false);

  const hasProject = Boolean(context?.projects.length);
  const noUsableKey = hasProject && !loadingKeys && !loadFailed && keys.length === 0;
  const showCreateForm = noUsableKey && Boolean(context?.createKey);

  const dashboardApiKeysUrl = `${runtimeConfig.dashboardUrl}${locale === 'cn' ? '/cn' : ''}/apikeys/`;

  // Initialise the selected project whenever a new picker context opens.
  useEffect(() => {
    if (!context) {
      setProjectId(undefined);
      setKeyId(undefined);
      setKeys([]);
      setLoadFailed(false);
      setNewKeyName('');
      setCreating(false);
      setCreateFailed(false);
      return;
    }
    setProjectId(context.projects[0]?.id);
  }, [context]);

  // Load keys for the active project (from cache or via loadKeys).
  useEffect(() => {
    let cancelled = false;
    setKeyId(undefined);
    setKeys([]);
    setLoadFailed(false);
    setCreateFailed(false);
    if (!projectId || !context) return;

    const cached = context.keysByProject[projectId];
    if (cached) {
      setKeys(cached);
      if (cached.length) setKeyId(cached[0]!.id);
      return;
    }
    if (!context.loadKeys) return;

    setLoadingKeys(true);
    context
      .loadKeys(projectId)
      .then((list) => {
        if (cancelled) return;
        setKeys(list);
        if (list.length) setKeyId(list[0]!.id);
      })
      .catch(() => !cancelled && setLoadFailed(true))
      .finally(() => !cancelled && setLoadingKeys(false));

    return () => {
      cancelled = true;
    };
  }, [projectId, context]);

  // Pre-fill the default key name when entering the create form.
  useEffect(() => {
    if (showCreateForm) setNewKeyName((prev) => prev || t.defaultKeyName);
  }, [showCreateForm, t.defaultKeyName]);

  if (!open || !context) return null;

  const newKeyNameValid = newKeyName.trim().length >= 1 && newKeyName.trim().length <= 100;

  const onCreateAndUse = async () => {
    if (!context.createKey || !projectId || creating || !newKeyNameValid) return;
    setCreating(true);
    setCreateFailed(false);
    try {
      const plainKey = await context.createKey(projectId, newKeyName.trim());
      settlePicker({ plainKey });
    } catch {
      setCreateFailed(true);
    } finally {
      setCreating(false);
    }
  };

  const onConfirm = () => settlePicker(keyId == null ? null : { apiKeyId: keyId });

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
      onClick={() => settlePicker(null)}
    >
      <div
        className="w-full max-w-md rounded-xl border bg-fd-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">{t.title}</h2>
            <p className="mt-1 text-sm text-fd-muted-foreground">{t.description}</p>
          </div>
          <button
            type="button"
            aria-label={t.cancel}
            onClick={() => settlePicker(null)}
            className="rounded-lg p-1.5 text-fd-muted-foreground hover:bg-fd-accent"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex flex-col gap-4 px-5 py-4">
          {!hasProject ? (
            <p className="text-sm text-fd-muted-foreground">{t.emptyProject}</p>
          ) : (
            <>
              <Field label={t.projectLabel}>
                <select
                  value={projectId ?? ''}
                  disabled={creating}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full rounded-lg border bg-fd-background px-3 py-2 text-sm"
                >
                  {context.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>

              {showCreateForm ? (
                <>
                  <p className="text-sm text-fd-muted-foreground">{t.empty}</p>
                  <Field label={t.keyNameLabel}>
                    <input
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder={t.keyNamePlaceholder}
                      maxLength={100}
                      disabled={creating}
                      className="w-full rounded-lg border bg-fd-background px-3 py-2 text-sm"
                    />
                  </Field>
                  {createFailed && <p className="text-sm text-red-500">{t.createFailed}</p>}
                </>
              ) : (
                <Field label={t.keyLabel}>
                  <select
                    value={keyId == null ? '' : String(keyId)}
                    disabled={loadingKeys || keys.length === 0}
                    onChange={(e) => setKeyId(e.target.value)}
                    className="w-full rounded-lg border bg-fd-background px-3 py-2 text-sm disabled:opacity-50"
                  >
                    {keys.length === 0 && <option value="">—</option>}
                    {keys.map((k) => (
                      <option key={String(k.id)} value={String(k.id)}>
                        {k.keyName} ({k.apiKey})
                      </option>
                    ))}
                  </select>
                  {loadFailed && <p className="mt-2 text-sm text-red-500">{t.loadFailed}</p>}
                </Field>
              )}
            </>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t px-5 py-4">
          <button
            type="button"
            onClick={() => settlePicker(null)}
            className="rounded-lg px-3 py-1.5 text-sm text-fd-muted-foreground hover:bg-fd-accent"
          >
            {t.cancel}
          </button>
          {showCreateForm ? (
            <button
              type="button"
              onClick={onCreateAndUse}
              disabled={!newKeyNameValid || creating}
              className="rounded-lg bg-fd-primary px-3 py-1.5 text-sm text-fd-primary-foreground disabled:opacity-50"
            >
              {t.create}
            </button>
          ) : !hasProject || noUsableKey || loadFailed ? (
            <a
              href={dashboardApiKeysUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-fd-primary px-3 py-1.5 text-sm text-fd-primary-foreground"
            >
              {t.goDashboard}
              <ArrowUpRight className="size-3.5" />
            </a>
          ) : (
            <button
              type="button"
              onClick={onConfirm}
              disabled={keyId == null}
              className="rounded-lg bg-fd-primary px-3 py-1.5 text-sm text-fd-primary-foreground disabled:opacity-50"
            >
              {t.confirm}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
