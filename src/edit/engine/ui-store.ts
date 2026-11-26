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
  /* A link with no label to edit (a footer social icon); the tray shows its address. */
  | { type: 'link'; hrefKey: string }
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

export function subscribeUi(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useUi(): UiState {
  return useSyncExternalStore(subscribeUi, () => state, () => state);
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
    case 'link':
      return ctx.hrefKey;
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

/*
  Keyboard reach into the tray. The tray is rendered in the bar, at the end
  of <body>, so Tab from a field never reaches it while it still shows that
  field. focusField keeps the element that had focus; enterTray moves focus
  to the tray's first control, and leaveTray returns it to that element
  (Escape, Enter in a link address, or Tab past either end of the tray).
*/
let returnTo: HTMLElement | null = null;
let entered = false;

const TRAY_CONTROLS = '[data-ed-tray] :is(input, select, textarea, button, a[href]):not([disabled])';

/* A message (a refused photo, a publish result) stays while focus returns
   to the same field, as it does after the file picker closes, and clears
   when the editor moves to another field or types. */
export function focusField(ctx: TrayContext) {
  clearTimeout(blurTimer);
  const active = document.activeElement;
  if (active instanceof HTMLElement && !active.closest('[data-ed-tray]')) {
    returnTo = active;
    entered = false;
  }
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

/** The tray's controls, in tab order. */
export function trayControls(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(TRAY_CONTROLS));
}

/** Shows `ctx` in the tray and moves focus to its first control, once it is drawn. */
export function enterTray(ctx: TrayContext, from: HTMLElement) {
  from.focus();
  focusField(ctx);
  returnTo = from;
  requestAnimationFrame(() => {
    const first = trayControls()[0];
    if (!first) return;
    entered = true;
    first.focus();
  });
}

/** True while focus is in the tray after enterTray, so Tab past its ends goes back. */
export function enteredTray(): boolean {
  return entered && !!document.activeElement?.closest('[data-ed-tray]');
}

/** Returns focus from the tray to the field or control it came from. */
export function leaveTray(): boolean {
  const el = returnTo;
  if (!el?.isConnected) return false;
  entered = false;
  el.focus();
  return true;
}

export function resetUi() {
  lastTarget = '';
  returnTo = null;
  entered = false;
  state = { focus: null, flash: null, confirmDiscard: false, phase: 'idle', online: true, expired: false };
}
