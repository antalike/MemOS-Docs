// API Key injection, ported from the legacy `useAuthSession` + `useApiKeyResolver`.
//
// Flow: project/list -> keys/list (masked, display only) -> keys/copy (plaintext).
// Security constraints kept from the original:
//   - The shared login cookie (domain `.openmem.net`) is read-only.
//   - Plaintext keys are fetch-and-forget: never cached, never persisted, never
//     rendered into the DOM (the site records sessions via Clarity).
//   - Only project/masked-key lists (no secrets) are cached for the session.

import { runtimeConfig } from '@/lib/shared';
import {
  openPicker,
  type ApiKeyMasked,
  type PickerResult,
  type ProjectItem,
} from '@/components/api-key/picker-store';

export class AuthRequiredError extends Error {
  constructor(message = 'login required') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

interface BaseResponse<T> {
  code: number;
  data: T;
  message?: string;
}

interface PageResponse<T> {
  records: T[];
  total: number;
}

export const DEFAULT_API_KEY_PLACEHOLDER = 'YOUR_API_KEY';
const NOT_LOGIN_CODES = new Set([40100, 40101]);
const PAGE_SIZE = 100;

function readAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const name = runtimeConfig.authCookieName;
  const entry = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  if (!entry) return null;
  const value = entry.slice(name.length + 1);
  return value ? decodeURIComponent(value) : null;
}

export function isLoggedIn(): boolean {
  return Boolean(readAuthToken());
}

async function authedFetch<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const token = readAuthToken();
  if (!token) throw new AuthRequiredError();

  let res: Response;
  try {
    res = await fetch(`${runtimeConfig.dashboardApiBase}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw error;
  }

  if (res.status === 401 || res.status === 403) throw new AuthRequiredError();
  if (!res.ok) throw new Error(`request failed with status ${res.status}`);

  const json = (await res.json()) as BaseResponse<T>;
  if (json && typeof json === 'object' && 'code' in json) {
    if (NOT_LOGIN_CODES.has(json.code)) throw new AuthRequiredError();
    if (json.code !== 0) throw new Error(json.message || `request failed with code ${json.code}`);
    return json.data;
  }
  return json as unknown as T;
}

// Session-level caches (no plaintext).
let projectsCache: ProjectItem[] | null = null;
const keysCache: Record<string, ApiKeyMasked[]> = {};

function isUsableKey(key: ApiKeyMasked): boolean {
  if (!key.expiresAt) return true;
  const expires = new Date(key.expiresAt).getTime();
  return Number.isNaN(expires) || expires > Date.now();
}

async function fetchProjects(): Promise<ProjectItem[]> {
  if (projectsCache) return projectsCache;
  const data = await authedFetch<PageResponse<ProjectItem>>('/api/dashboard/project/list', {
    pageNum: 1,
    pageSize: PAGE_SIZE,
  });
  const projects = data?.records ?? [];
  if (projects.length) projectsCache = projects;
  return projects;
}

async function fetchKeys(projectId: string): Promise<ApiKeyMasked[]> {
  if (keysCache[projectId]) return keysCache[projectId];
  const data = await authedFetch<PageResponse<ApiKeyMasked>>('/api/dashboard/keys/list', {
    projectId,
    pageNum: 1,
    pageSize: PAGE_SIZE,
  });
  const keys = (data?.records ?? []).filter(isUsableKey);
  if (keys.length) keysCache[projectId] = keys;
  return keys;
}

async function createKey(projectId: string, keyName: string): Promise<string> {
  const created = await authedFetch<{ apiKey?: string } | null>('/api/dashboard/keys/create', {
    keyName,
    projectId,
  });
  delete keysCache[projectId];
  const plainKey = created?.apiKey;
  if (!plainKey || plainKey.includes('*')) {
    throw new Error('create api key failed: no plain key in response');
  }
  return plainKey;
}

function fetchPlainKey(apiKeyId: string | number): Promise<string> {
  return authedFetch<string>('/api/dashboard/keys/copy', { apiKeyId });
}

async function pickApiKey(): Promise<PickerResult> {
  const projects = await fetchProjects();
  if (!projects.length) {
    await openPicker({ projects: [], keysByProject: {} });
    return null;
  }
  const keysByProject =
    projects.length === 1
      ? { [projects[0]!.id]: await fetchKeys(projects[0]!.id) }
      : {};
  return openPicker({ projects, keysByProject, loadKeys: fetchKeys, createKey });
}

export interface ResolveOptions {
  source: string;
  placeholder?: string;
}

/**
 * Replace the placeholder in `source` with the user's real API key.
 * Returns `null` (caller falls back to original text) when not logged in,
 * no usable key, the placeholder is absent, the user cancels, or an error occurs.
 */
export async function resolveApiKey(options: ResolveOptions): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!isLoggedIn()) return null;

  const placeholder = options.placeholder || DEFAULT_API_KEY_PLACEHOLDER;
  if (!options.source.includes(placeholder)) return null;

  try {
    const picked = await pickApiKey();
    if (!picked) return null;
    const plainKey = 'plainKey' in picked ? picked.plainKey : await fetchPlainKey(picked.apiKeyId);
    if (!plainKey) return null;
    return options.source.split(placeholder).join(plainKey);
  } catch (error) {
    if (!(error instanceof AuthRequiredError)) {
      console.warn('[api-key] resolve failed, falling back to original text:', error);
    }
    return null;
  }
}
