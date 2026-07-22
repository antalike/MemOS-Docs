'use client';

import { useSyncExternalStore } from 'react';

export interface ApiKeyMasked {
  /** Opaque id (the list endpoint returns it as a string), passed back to keys/copy. */
  id: string | number;
  /** Masked form, e.g. `mpg-****abcd`; display only. */
  apiKey: string;
  keyName: string;
  projectId: string;
  expiresAt: string | null;
}

export interface ProjectItem {
  id: string;
  name: string;
}

export interface PickerContext {
  projects: ProjectItem[];
  /** Pre-fetched masked keys per project (no plaintext). */
  keysByProject: Record<string, ApiKeyMasked[]>;
  loadKeys?: (projectId: string) => Promise<ApiKeyMasked[]>;
  createKey?: (projectId: string, keyName: string) => Promise<string>;
}

/**
 * Picker outcome:
 * - `{ apiKeyId }`: an existing key was chosen (caller must fetch plaintext via keys/copy)
 * - `{ plainKey }`: a key was created inline (response already carries plaintext)
 * - `null`: cancelled / closed / nothing to pick
 */
export type PickerResult = { apiKeyId: string | number } | { plainKey: string } | null;

interface PickerState {
  open: boolean;
  context: PickerContext | null;
}

let state: PickerState = { open: false, context: null };
let pendingResolve: ((value: PickerResult) => void) | null = null;
const listeners = new Set<() => void>();

function emit() {
  state = { ...state };
  for (const l of listeners) l();
}

/** Opens the picker and resolves with the user's choice. */
export function openPicker(context: PickerContext): Promise<PickerResult> {
  pendingResolve?.(null);
  state.context = context;
  state.open = true;
  emit();
  return new Promise((resolve) => {
    pendingResolve = resolve;
  });
}

/** Host modal reports the result (including cancel). */
export function settlePicker(value: PickerResult) {
  state.open = false;
  emit();
  pendingResolve?.(value);
  pendingResolve = null;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return state;
}

const SERVER_SNAPSHOT: PickerState = { open: false, context: null };

export function usePickerState(): PickerState {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}
