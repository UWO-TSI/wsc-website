import { useSyncExternalStore } from 'react';
import type { ListTable } from '@/edit/list-draft';

/*
  What the edit bar and the tray show. Fields write their focus here; the
  bar reads it. A module store, because fields render inside the page and
  the bar renders in a portal, so they share no React parent below the
  provider.
*/

export type TrayContext =
  | { type: 'text'; key: string }
  | { type: 'lines'; keys: string[]; tooWide: boolean }
  | { type: 'button'; labelKey: string; hrefKey: string }
  | { type: 'photo'; slot: string }
  /* A field, chip or grip of one list row; the tray shows the row and Remove. */
  | { type: 'row'; table: ListTable; id: string; field: string }
  /* The Add an area input of one executive. */
  | { type: 'area'; id: string };

export type Tone = 'info' | 'ok' | 'warn' | 'alert';

export interface Flash {
  tone: Tone;
  label: string;
  text: string;
  /** Read out by the live region: errors and publish results only. */
  announce?: boolean;
}

export type PublishPhase = 'idle' | 'publishing' | 'published';

export interface UiState {
  focus: TrayContext | null;
  flash: Flash | null;
  confirmDiscard: boolean;
  phase: PublishPhase;
  online: boolean;
  expired: boolean;
}

let state: UiState = {
  focus: null,
  flash: null,
  confirmDiscard: false,
  phase: 'idle',
  online: true,
  expired: false,
};
const listeners = new Set<() => void>();

export function setUi(patch: Partial<UiState>) {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
}

export function getUi(): UiState {
  return state;
}

export function useUi(): UiState {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => state,
    () => state
  );
}

/* Focus leaving a field for the tray (the link address, a tray button)
   keeps the field's context. Anywhere else clears it, one frame later, so
   the tray does not flicker between two fields. */
let blurTimer: ReturnType<typeof setTimeout> | undefined;

const target = (ctx: TrayContext) => {
  switch (ctx.type) {
    case 'text':
      return ctx.key;
    case 'lines':
      return ctx.keys.join();
    case 'button':
      return ctx.labelKey;
    case 'photo':
      return ctx.slot;
    case 'row':
      return `${ctx.table}:${ctx.id}:${ctx.field}`;
    case 'area':
      return `area:${ctx.id}`;
  }
};

/** The last field that had focus, kept across a blur. */
let lastTarget = '';

/* A message (a refused photo, a publish result) stays while focus returns
   to the same field, as it does after the file picker closes, and clears
   when the editor moves to another field or types. */
export function focusField(ctx: TrayContext) {
  clearTimeout(blurTimer);
  const same = target(ctx) === lastTarget;
  lastTarget = target(ctx);
  if (same) setUi({ focus: ctx });
  else setUi({ focus: ctx, flash: null, confirmDiscard: false });
}

export function edited() {
  if (state.flash || state.confirmDiscard) setUi({ flash: null, confirmDiscard: false });
}

export function blurField() {
  clearTimeout(blurTimer);
  blurTimer = setTimeout(() => {
    if (document.activeElement?.closest('[data-ed-tray]')) return;
    setUi({ focus: null });
  }, 0);
}

export function resetUi() {
  lastTarget = '';
  state = { focus: null, flash: null, confirmDiscard: false, phase: 'idle', online: true, expired: false };
}
