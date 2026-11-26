'use client';

import { createElement, useSyncExternalStore } from 'react';
import type { ComponentType } from 'react';
import type { ListDraftApi, ListTable } from '@/edit/list-draft';

/*
  Edit mode state, shared by the anonymous site and the edit engine.

  This file ships to every visitor, so it holds only state and types. The
  edit engine (src/edit/engine/) is loaded with a dynamic import by
  EditGate after is_admin() passes at aal2, and registers itself here. Until
  then `engine` is null, every caller reads `editing: false`, and the site
  renders as it does for a visitor.

  It is a module store rather than a React context because some readers
  (the preloader) sit above the provider that mounts the gate.

  Every self-running motion reads useEditMode() and stays at rest while
  editing: scroll reveals, Counter Roll, Marquee Drift, Row Expand,
  Magnetic Pull and the preloader. Preview reads `editing: false`, so
  Preview shows the visitor page with the draft values in it.
*/

export type EditStatus = 'off' | 'editing' | 'preview';

/** What the engine adds once it is loaded. Implemented in src/edit/engine/. */
export interface EditEngineApi {
  /** Draft values over the published ones. Same shape as useSiteContent(). */
  text: (key: string, published: string) => string;
  image: <I extends { src: string | null | undefined; alt: string }>(slot: string, published: I) => I;
  /** Drafted list rows over the fetched ones, for useSupabaseQuery. */
  rows: <T>(table: string, rows: T[]) => T[];
  /** The list draft for one table. */
  list: (table: ListTable) => ListDraftApi;
  /** Switch to or from Preview, keeping the section at the top in place. */
  preview: (on: boolean) => void;
  /** Edit branches of the components in src/edit/. */
  components: Record<'Text' | 'Lines' | 'Button' | 'Image', ComponentType<never>>;
}

interface Snapshot {
  status: EditStatus;
  engine: EditEngineApi | null;
  /** Bumped on every draft change, so readers of drafted values re-render. */
  rev: number;
  /** Bumped after Publish, so useSupabaseQuery refetches what went live. */
  refresh: number;
}

const OFF: Snapshot = { status: 'off', engine: null, rev: 0, refresh: 0 };
let snap = OFF;
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Engine-side writer. Pages never call this. */
export function setEditSnapshot(patch: Partial<Snapshot>) {
  snap = { ...snap, ...patch };
  listeners.forEach((fn) => fn());
}

export function getEditSnapshot(): Snapshot {
  return snap;
}

export function useEditSnapshot(): Snapshot {
  return useSyncExternalStore(subscribe, getEditSnapshot, () => OFF);
}

type BranchName = keyof EditEngineApi['components'];

/**
 * True while the engine is loaded and the page is in edit mode (not
 * Preview). The caller then renders <EditBranch> instead of its visitor
 * version.
 */
export function useEditBranch(): boolean {
  const { status, engine } = useEditSnapshot();
  return status === 'editing' && engine !== null;
}

/**
 * Renders the engine's edit branch of one component. The engine registers
 * its components once, at module level, so their identity never changes
 * between renders and their state is kept.
 */
export function EditBranch<P extends object>({ name, props }: { name: BranchName; props: P }) {
  const component = snap.engine?.components[name] as ComponentType<P> | undefined;
  return component ? createElement(component, props) : null;
}

export interface EditModeValue {
  editing: boolean;
}

export function useEditMode(): EditModeValue {
  const editing = useSyncExternalStore(
    subscribe,
    () => snap.status === 'editing',
    () => false
  );
  return { editing };
}

/*
  Entering and leaving edit mode.

  The stored flag only asks the gate to check. It grants nothing: the gate
  still requires a session at aal2 and is_admin(), and RLS refuses every
  write that does not pass is_admin_mfa().
*/

export const EDIT_FLAG_KEY = 'wsc-edit';
export const EDIT_REQUEST_EVENT = 'wsc-edit-request';

/** Ask for edit mode. The gate loads the engine if the checks pass. */
export function enterEditMode() {
  try {
    localStorage.setItem(EDIT_FLAG_KEY, '1');
  } catch {}
  window.dispatchEvent(new Event(EDIT_REQUEST_EVENT));
}

/** Back to the visitor site. Drafts stay in this browser. */
export function leaveEditMode() {
  try {
    localStorage.removeItem(EDIT_FLAG_KEY);
  } catch {}
  window.dispatchEvent(new Event(EDIT_REQUEST_EVENT));
}

/** Switch between editing and Preview. No effect outside edit mode. */
export function setEditPreview(on: boolean) {
  snap.engine?.preview(on);
}
