'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent, PointerEvent, ReactNode, RefObject } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
  type SortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Button from '@/components/ui/button';
import Chip from '@/components/ui/chip';
import { LIMITS } from '@/lib/admin-config';
import type { ListDraftApi, ListRowState, ListTable } from '@/edit/list-draft';
import { COPY } from '@/edit/engine/copy';
import { currentRow } from '@/edit/engine/draft-store';
import { columnWidth, onRemeasure, sample, textHeight, textWidth } from '@/edit/engine/measure';
import { blurField, edited, enterTray, focusField, getUi, setUi, subscribeUi, type Tone } from '@/edit/engine/ui-store';

/*
  The parts every list editor is built from (card 16): a row field,
  InlineSelect, InlineNumber, VisibilityChip, StateChip, Grip, AddTile and
  a row's photo, plus the reorder and removal motion and the tray's view
  of a row.

  Every value is drawn in the same Field shell as the text fields in
  fields.tsx (.ed in edit.css), sized to its longest allowed value, so
  typing never resizes a row. The chips and the grip are controls, so they
  are buttons with a word or an accessible name. The state chip is not a
  control; it only reserves its slot.

  Motion is the three moves the spec allows in edit mode, on Floor's
  tokens read from the stylesheet: a reorder moves rows on the card 15
  move row (--d-move, --e-move), a new Add tile arrives with Clip Reveal,
  and a removed row leaves only on Publish (--d-move, --e-exit) before its
  neighbours close the gap on --e-move. Under reduced motion each one is
  shown in its final state at once.
*/

/** The Field shell's inline padding, both sides, from edit.css. */
const SHELL_X = 24;

const fieldId = (table: ListTable, id: string, column: string) => `${table}.${id}.${column}`;

/* A row field's accessible name carries the row's name ("Name, Mei Chen"),
   so a screen reader tabbing a list can tell the rows apart. */
const nameFor = (label: string, who?: string) => (who ? COPY.rowField(label, who) : label);

export function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const ms = (name: string) => parseFloat(token(name)) || 0;

/** Runs `measure` now, after fonts load, and on resize. */
function useMeasure(measure: () => void, deps: unknown[]) {
  const fn = useRef(measure);
  useLayoutEffect(() => {
    fn.current = measure;
  });
  useLayoutEffect(() => {
    fn.current();
    return onRemeasure(() => fn.current());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

const oneLine = (v: string) => v.replace(/\s*[\r\n]+\s*/g, ' ');

/* ── Row field: InlineText and InlineParagraph for one column of a row ── */

export interface RowFieldProps {
  table: ListTable;
  id: string;
  column: string;
  value: string;
  max: number;
  label: string;
  /** The row's name, added to the accessible name. */
  who?: string;
  placeholder?: string;
  /** Takes the column; otherwise as wide as the longest allowed value. */
  block?: boolean;
  /** Type role and alignment, on the shell so the field inherits them. */
  className?: string;
  onChange: (value: string) => void;
}

export function RowField({ table, id, column, value, max, label, who, placeholder, block, className, onChange }: RowFieldProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  /* Every row's field is measured from the same sample text, never from
     its own value, so the cells of one list reserve the same size and
     line up. */
  useMeasure(() => {
    const el = ref.current;
    if (!el) return;
    const s = sample('', max);
    let width = el.clientWidth;
    if (!block) {
      /* The cap is the column the shell is placed in (measure.ts). */
      const cap = Math.max(40, columnWidth(el) - SHELL_X);
      width = Math.min(textWidth(el, s) + 2, cap);
      el.style.width = `${width}px`;
    }
    el.style.height = `${textHeight(el, s, width)}px`;
  }, [max, block]);

  return (
    <span
      className={`ed ${block ? 'ed-block' : 'ed-line'} ${className ?? ''}`.trim()}
      data-ed-field={fieldId(table, id, column)}
    >
      <textarea
        ref={ref}
        className="ed-in"
        rows={1}
        value={value}
        maxLength={max}
        placeholder={placeholder ?? label}
        aria-label={nameFor(label, who)}
        onChange={(e) => {
          edited();
          onChange(oneLine(e.target.value).slice(0, max));
        }}
        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
        onFocus={() => focusField({ type: 'row', table, id, field: column })}
        onBlur={blurField}
      />
    </span>
  );
}

/* ── A date or a time, in the same shell ── */

export function RowInput({
  table,
  id,
  column,
  type,
  value,
  label,
  who,
  className,
  onChange,
}: {
  table: ListTable;
  id: string;
  column: string;
  type: 'date' | 'time';
  value: string;
  label: string;
  who?: string;
  className?: string;
  onChange: (value: string) => void;
}) {
  return (
    <span className={`ed ed-line ed-native ${className ?? ''}`.trim()} data-ed-field={fieldId(table, id, column)}>
      <input
        className="ed-in"
        type={type}
        value={value}
        aria-label={nameFor(label, who)}
        onChange={(e) => {
          edited();
          onChange(e.target.value);
        }}
        onFocus={() => focusField({ type: 'row', table, id, field: column })}
        onBlur={blurField}
      />
    </span>
  );
}

/* ── InlineNumber ── */

/*
  The number of a counted figure in a Field, as wide as the largest
  allowed value in the figure's own font. Digits only; an empty field
  stores 0.
*/
export function InlineNumber({
  table,
  id,
  column,
  value,
  max,
  label,
  who,
  className,
  onChange,
}: {
  table: ListTable;
  id: string;
  column: string;
  value: number;
  max: number;
  label: string;
  who?: string;
  className?: string;
  onChange: (value: number) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [typed, setTyped] = useState<string | null>(null);
  const digits = String(max).length;

  useMeasure(() => {
    const el = ref.current;
    if (el) el.style.width = `${textWidth(el, '9'.repeat(digits)) + 2}px`;
  }, [digits]);

  return (
    <span className={`ed ed-line ${className ?? ''}`.trim()} data-ed-field={fieldId(table, id, column)}>
      <input
        ref={ref}
        className="ed-in"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={digits}
        value={typed ?? String(value)}
        aria-label={nameFor(label, who)}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, '').slice(0, digits);
          edited();
          setTyped(raw);
          onChange(Math.min(max, Number(raw || 0)));
        }}
        onFocus={() => focusField({ type: 'row', table, id, field: column })}
        onBlur={() => {
          setTyped(null);
          blurField();
        }}
      />
    </span>
  );
}

/* ── InlineSelect ── */

export interface SelectOption {
  value: string;
  label: string;
  /** The long name, shown by the browser on hover. */
  title?: string;
}

/*
  A native select in a Field, value centred, chevron shown at rest in
  --accent-ink. On touch screens it is set at 16px so iOS does not zoom.
*/
export function InlineSelect({
  table,
  id,
  column,
  value,
  options,
  label,
  who,
  onChange,
  selectRef,
}: {
  table: ListTable;
  id: string;
  column: string;
  value: string;
  options: SelectOption[];
  label: string;
  who?: string;
  onChange: (value: string) => void;
  selectRef?: RefObject<HTMLSelectElement | null>;
}) {
  return (
    <span className="ed ed-sel" data-ed-field={fieldId(table, id, column)}>
      <select
        ref={selectRef}
        value={value}
        aria-label={nameFor(label, who)}
        onChange={(e) => {
          edited();
          onChange(e.target.value);
        }}
        onFocus={() => focusField({ type: 'row', table, id, field: column })}
        onBlur={blurField}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} title={o.title}>
            {o.label}
          </option>
        ))}
      </select>
      <Chevron />
    </span>
  );
}

function Chevron() {
  return (
    <svg className="ed-chev" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Chips ── */

/* Every word is laid in one grid cell and only the current one shows, so
   the chip is always the width of its longest word. */
function Words({ words, shown }: { words: string[]; shown: string }) {
  return (
    <span className="ed-words">
      {words.map((w) => (
        <span key={w} aria-hidden={w !== shown} className={w === shown ? undefined : 'ed-off'}>
          {w}
        </span>
      ))}
    </span>
  );
}

/** Visible or Hidden on each item. A toggle button: pressed means visitors see it. */
export function VisibilityChip({
  table,
  id,
  who,
  visible,
  onToggle,
  className,
}: {
  table: ListTable;
  id: string;
  /** The row's name: "Show Mei Chen on team page". */
  who: string;
  visible: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`ed-vis ${className ?? ''}`.trim()}
      aria-pressed={visible}
      aria-label={COPY.list[table].show(who)}
      onClick={() => {
        edited();
        onToggle();
      }}
      onFocus={() => focusField({ type: 'row', table, id, field: 'visibility' })}
      onBlur={blurField}
    >
      <Chip status={visible ? 'ok' : 'neutral'}>
        <Words words={[COPY.visible, COPY.hidden]} shown={visible ? COPY.visible : COPY.hidden} />
      </Chip>
    </button>
  );
}

/** Unpublished or Will be removed. The slot is reserved while the row is unchanged. */
export function StateChip({ state, className }: { state: ListRowState; className?: string }) {
  const removing = state === 'removing';
  const word = removing ? COPY.willBeRemoved : COPY.unpublished;
  return (
    <span className={`ed-state${state ? '' : ' ed-off'} ${className ?? ''}`.trim()} aria-hidden={!state}>
      <Chip status={removing ? 'alert' : 'warn'}>
        <Words words={[COPY.willBeRemoved, COPY.unpublished]} shown={word} />
      </Chip>
    </span>
  );
}

/* ── Grip ── */

export function GripIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 4h11M2.5 8h11M2.5 12h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── AddTile ── */

/**
 * The last cell of every list: the empty photo-slot surface with a
 * tertiary label, the size of an item. When an add moves it along it
 * arrives with Clip Reveal.
 *
 * At the list's cap (LIMITS in admin-config.ts) the tile stays in its
 * place, disabled, in the disabled button's colours (--ink-faint, no
 * hover fill). It stays focusable (aria-disabled), and pressing it says
 * why in the tray.
 */
export function AddTile({
  label,
  shape,
  appear,
  full,
  onAdd,
}: {
  label: string;
  shape: 'disc' | 'row' | 'logo' | 'figure' | 'card';
  appear: boolean;
  /** Why the list takes no more items, or undefined while it does. */
  full?: string;
  onAdd: () => void;
}) {
  /* The disabled look is .ed-add[aria-disabled='true'] in edit.css. */
  return (
    <button
      type="button"
      className={`ed-add ed-add-${shape}${appear ? ' ed-appear' : ''}`}
      aria-disabled={full ? true : undefined}
      onClick={() => {
        if (!full) return onAdd();
        setUi({ flash: { tone: 'warn', label, text: full, announce: true } });
      }}
    >
      <span className="ed-add-plus" aria-hidden="true">
        +
      </span>
      <span>{label}</span>
    </button>
  );
}

/* ── Row options: keyboard reach to the tray ── */

/**
 * The last control of every row. It shows the row in the tray and moves
 * focus to the tray's first control (the link address, or Remove), which
 * Tab from the row's fields never reaches. Escape, Enter in the link
 * address, or Tab past either end of the tray comes back here
 * (ui-store.ts). A tertiary Button, as Settings and Sign out are.
 */
export function RowOptions({ table, id, who }: { table: ListTable; id: string; who: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const ctx = { type: 'row', table, id, field: 'options' } as const;
  return (
    <span ref={ref} className="inline-flex" onFocus={() => focusField(ctx)} onBlur={blurField}>
      <Button
        variant="tertiary"
        aria-label={COPY.rowOptionsName(who)}
        onClick={() => {
          const el = ref.current?.querySelector('button');
          if (el) enterTray(ctx, el);
        }}
      >
        {COPY.rowOptions}
      </Button>
    </span>
  );
}

/* ── Held order: a row does not move while it is being edited ── */

/**
 * The rows in the order they had when one of their fields took focus,
 * while focus stays in the list (or its tray), so a row whose date or role
 * changes does not move under the cursor. When focus leaves, the rows take
 * their sorted order once, on the move row (`release` captures the old
 * places first). The Grip is not held: its moves are the point. A row
 * added while the order is held takes its sorted place among the held
 * rows.
 */
export function useHeldOrder<R extends { id: string }>(table: ListTable, sorted: R[]) {
  const [held, setHeld] = useState<string[] | null>(null);
  const holding = useRef<string[] | null>(null);
  const shown = useRef<R[]>(sorted);
  const release = useRef<() => void>(() => {});

  useEffect(
    () =>
      subscribeUi(() => {
        const f = getUi().focus;
        const editing = f?.type === 'row' && f.table === table && f.field !== 'grip';
        if (editing && !holding.current) {
          holding.current = shown.current.map((r) => r.id);
          setHeld(holding.current);
        } else if (!editing && holding.current) {
          release.current();
          holding.current = null;
          setHeld(null);
        }
      }),
    [table]
  );

  let rows = sorted;
  if (held) {
    const byId = new Map(sorted.map((r) => [r.id, r]));
    const kept = new Set(held);
    rows = held.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
    sorted.forEach((r, i) => {
      if (kept.has(r.id)) return;
      const after = sorted.slice(i + 1).find((x) => kept.has(x.id));
      const at = after ? rows.indexOf(after) : -1;
      rows.splice(at === -1 ? rows.length : at, 0, r);
    });
  }

  useLayoutEffect(() => {
    shown.current = rows;
  });

  /** Sets what runs just before the rows re-sort: the reorder's capture. */
  const onRelease = (fn: () => void) => {
    release.current = fn;
  };
  return { rows, onRelease };
}

/* ── A row's photo: headshot or logo ── */

function readSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('unreadable'));
    };
    img.src = url;
  });
}

/*
  The overlay that makes a headshot or a logo a photo slot: Replace or Add
  as a chip, and the device's file picker on click. Today's row uploader
  rules apply: type, then size, then the largest side (headshots 3000px,
  logos 2500px). Those uploads have no smallest size, so nothing warns
  below one.
*/
export function RowPhoto({
  api,
  table,
  id,
  column,
  filled,
  what,
  who,
  head,
  replaceLabel = COPY.replacePhoto,
  addLabel = COPY.addPhoto,
}: {
  api: ListDraftApi;
  table: ListTable;
  id: string;
  column: string;
  filled: boolean;
  what: string;
  who: string;
  /** The tray label for a refusal, e.g. "Executive · Mei Chen". */
  head: string;
  replaceLabel?: string;
  addLabel?: string;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const action = filled ? replaceLabel : addLabel;
  const max = table === 'sponsors' ? LIMITS.MAX_LOGO_DIMENSION : LIMITS.MAX_HEADSHOT_DIMENSION;

  const choose = async (file: File) => {
    const fail = (text: string) => setUi({ flash: { tone: 'alert', label: head, text, announce: true } });
    if (!LIMITS.ALLOWED_IMAGE_TYPES.includes(file.type)) return fail(COPY.photoType);
    if (file.size > LIMITS.MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      return fail(COPY.photoSize(file.size / 1024 / 1024, LIMITS.MAX_IMAGE_SIZE_MB));
    }
    let size: { width: number; height: number };
    try {
      size = await readSize(file);
    } catch {
      return fail(COPY.photoUnreadable);
    }
    if (size.width > max || size.height > max) return fail(COPY.photoTooLarge(size.width, size.height, max));
    setUi({ flash: null });
    await api.setFile(id, column, file);
  };

  return (
    <>
      <button
        type="button"
        className="ed-row-photo"
        aria-label={COPY.rowPhotoName(action, what, who)}
        onClick={() => picker.current?.click()}
        onFocus={() => focusField({ type: 'row', table, id, field: column })}
        onBlur={blurField}
      >
        <Chip className="ed-photo-chip">{action}</Chip>
      </button>
      <input
        ref={picker}
        type="file"
        hidden
        accept={LIMITS.ALLOWED_IMAGE_TYPES.join(',')}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) choose(file);
        }}
      />
    </>
  );
}

/* ── Reorder: drag by the grip, or the arrow keys ── */

type Rects = Map<string, DOMRect>;

const items = (list: HTMLElement) => list.querySelectorAll<HTMLElement>(':scope > [data-key]');

function rectsOf(list: HTMLElement): Rects {
  const out: Rects = new Map();
  items(list).forEach((el) => out.set(el.dataset.key!, el.getBoundingClientRect()));
  return out;
}

/** How the other items make room while one is dragged: a grid, or the sideways card row. */
export type ReorderLayout = 'grid' | 'row';

const STRATEGY: Record<ReorderLayout, SortingStrategy> = {
  grid: rectSortingStrategy,
  row: horizontalListSortingStrategy,
};

/* dnd-kit's own live region and instructions stay silent: the list's
   status line says where the item went, in the same words the arrow keys
   use. */
const SILENT = {
  announcements: {
    onDragStart: () => undefined,
    onDragOver: () => undefined,
    onDragEnd: () => undefined,
    onDragCancel: () => undefined,
  },
  screenReaderInstructions: { draggable: '' },
};

/**
 * Card 15's move row for every list in edit mode, one implementation.
 *
 * Dragging is dnd-kit: it measures every item once when the drag starts,
 * so the place an item lands is decided against still rectangles, never
 * against items that are moving. The other items slide aside while the
 * held one follows the pointer (lifted to --sh-3 by .ed-held), and the
 * draft order changes once, on drop. A drag stays inside the rows
 * `canSwap` allows (an executive stays in their role). The page scrolls
 * when the held item nears an edge.
 *
 * The arrow keys on a focused grip move the row one place at once.
 * `capture()` records where every item is; after the next commit each item
 * that moved slides from there to its new place. Adds, removals and a
 * held order's release use the same capture.
 *
 * Every move is on --d-move, --e-move. Under reduced motion each one is
 * shown in its final state at once.
 */
export function useReorder<R extends { id: string }>({
  api,
  table,
  rows,
  listRef,
  nameOf,
  canSwap = () => true,
}: {
  api: ListDraftApi;
  table: ListTable;
  rows: R[];
  listRef: RefObject<HTMLElement | null>;
  nameOf: (row: R) => string;
  canSwap?: (a: R, b: R) => boolean;
}) {
  const first = useRef<Rects | null>(null);
  const refocus = useRef<string | null>(null);
  const [held, setHeld] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');

  const capture = () => {
    if (listRef.current) first.current = rectsOf(listRef.current);
  };

  useLayoutEffect(() => {
    const list = listRef.current;
    const before = first.current;
    first.current = null;
    if (list && before && !reducedMotion()) {
      items(list).forEach((el) => {
        const key = el.dataset.key!;
        const f = before.get(key);
        if (!f) return;
        const l = el.getBoundingClientRect();
        const dx = f.left - l.left;
        const dy = f.top - l.top;
        if (dx || dy) {
          el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
            duration: ms('--d-move'),
            easing: token('--e-move'),
          });
        }
      });
    }
    if (refocus.current && list) {
      list.querySelector<HTMLElement>(`:scope > [data-key="${refocus.current}"] .ed-grip`)?.focus();
      refocus.current = null;
    }
  });

  const say = (row: R, i: number, n: number) => setAnnounce(COPY.moved(nameOf(row), i + 1, n));

  /* A 4px move before the drag starts, so a press on the grip that does
     not move is still a click (and focuses the grip for the arrow keys). */
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const byId = (id: UniqueIdentifier) => rows.find((r) => r.id === id);

  const collision: CollisionDetection = (args) => {
    const self = byId(args.active.id);
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter((c) => {
        const other = byId(c.id);
        return c.id === args.active.id || (self && other ? canSwap(self, other) : false);
      }),
    });
  };

  const onDragStart = ({ active }: DragStartEvent) => setHeld(String(active.id));

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setHeld(null);
    if (!over || over.id === active.id) return;
    const ids = rows.map((r) => r.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    const row = rows[from];
    if (from === -1 || to === -1 || !canSwap(row, rows[to])) return;
    api.moveNextTo(row.id, rows[to].id, from < to);
    say(row, to, rows.length);
  };

  const gripProps = (row: R, index: number) => ({
    type: 'button' as const,
    className: 'ed-grip',
    'aria-label': COPY.gripLabel(nameOf(row), index + 1, rows.length),
    onFocus: () => focusField({ type: 'row', table, id: row.id, field: 'grip' }),
    onBlur: blurField,
    onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => {
      const dir = ({ ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 } as Record<string, number>)[e.key];
      if (!dir) return;
      e.preventDefault();
      const target = rows[index + dir];
      if (!target || !canSwap(row, target)) return;
      capture();
      refocus.current = row.id;
      api.moveNextTo(row.id, target.id, dir > 0);
      say(row, index + dir, rows.length);
    },
  });

  /** Spread on <ReorderList> around the list element. Lists without a grip (the event ledger) leave it out. */
  const listProps = {
    sensors,
    collision,
    ids: rows.map((r) => r.id),
    onDragStart,
    onDragEnd,
    onDragCancel: () => setHeld(null),
  };

  return { gripProps, held, announce, capture, listProps };
}

/** The drag context around one list's element, from useReorder's `listProps`. */
export function ReorderList({
  layout,
  sensors,
  collision,
  ids,
  onDragStart,
  onDragEnd,
  onDragCancel,
  children,
}: ReturnType<typeof useReorder>['listProps'] & { layout: ReorderLayout; children: ReactNode }) {
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      accessibility={SILENT}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <SortableContext items={ids} strategy={STRATEGY[layout]}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

interface ItemDrag {
  setActivatorNodeRef: (el: HTMLElement | null) => void;
  listeners: ReturnType<typeof useSortable>['listeners'];
}

const ItemDragContext = createContext<ItemDrag | null>(null);

type ItemTag = 'li' | 'div';

/**
 * One draggable item. Renders the list's own element (`as`), carries the
 * `data-key` the move row and the removal leave measure, and gives its
 * Grip the drag start. A leaving item cannot be dragged.
 */
export function ReorderItem({
  id,
  as: Tag = 'li',
  disabled,
  style,
  children,
  ...rest
}: {
  id: string;
  as?: ItemTag;
  disabled?: boolean;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, 'id' | 'children'> & { inert?: boolean; 'data-leaving'?: string }) {
  /* Read from the stylesheet once. The engine only renders in the browser,
     so the window is there; null (no slide) under reduced motion. */
  const [motion] = useState(() =>
    reducedMotion() ? null : { duration: ms('--d-move'), easing: token('--e-move') }
  );
  const { setNodeRef, setActivatorNodeRef, listeners, transform, transition } = useSortable({
    id,
    disabled,
    transition: motion,
  });

  return (
    <ItemDragContext.Provider value={{ setActivatorNodeRef, listeners }}>
      <Tag
        ref={setNodeRef}
        data-key={id}
        style={{ ...style, transform: CSS.Translate.toString(transform), transition }}
        {...rest}
      >
        {children}
      </Tag>
    </ItemDragContext.Provider>
  );
}

/** The grip button: `gripProps` plus the drag start of the item it sits in. */
export function Grip({ className, ...props }: ReturnType<ReturnType<typeof useReorder>['gripProps']> & { className?: string }) {
  const drag = useContext(ItemDragContext);
  const onPointerDown = drag?.listeners?.onPointerDown as ((e: PointerEvent<HTMLButtonElement>) => void) | undefined;
  return (
    <button
      {...props}
      ref={drag?.setActivatorNodeRef}
      className={className ?? 'ed-grip'}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.currentTarget.focus();
        onPointerDown?.(e);
      }}
    >
      <GripIcon />
    </button>
  );
}

/* ── Removal on Publish ── */

/**
 * The rows to draw. A row that was marked Will be removed and has just
 * been deleted by Publish stays in place for one leave (--d-move,
 * --e-exit, .ed-leave). When the leave ends the row is dropped and its
 * neighbours close the gap on the move row. Under reduced motion the row
 * is dropped at once.
 */
export function useLeaving<R extends { id: string }>(
  rows: R[],
  api: ListDraftApi,
  capture: () => void,
  listRef: RefObject<HTMLElement | null>
): { items: Array<{ row: R; leaving: boolean }>; done: (id: string) => void } {
  const prev = useRef<{ rows: R[]; removing: Set<string> }>({ rows: [], removing: new Set() });
  const [ghosts, setGhosts] = useState<Array<{ row: R; index: number }>>([]);

  useLayoutEffect(() => {
    const ids = new Set(rows.map((r) => r.id));
    const dropped = prev.current.rows.map((row, index) => ({ row, index })).filter(({ row }) => !ids.has(row.id));
    const gone = dropped.filter(({ row }) => prev.current.removing.has(row.id));
    prev.current = { rows, removing: new Set(rows.filter((r) => api.state(r.id) === 'removing').map((r) => r.id)) };
    focusNeighbour(listRef.current, dropped);
    if (gone.length && !reducedMotion()) setGhosts((g) => [...g, ...gone]);
  }, [rows, api, listRef]);

  const out = rows.map((row) => ({ row, leaving: false }));
  for (const g of ghosts) {
    if (out.some((i) => i.row.id === g.row.id)) continue;
    out.splice(Math.min(g.index, out.length), 0, { row: g.row, leaving: true });
  }

  const done = (id: string) => {
    capture();
    setGhosts((g) => g.filter((x) => x.row.id !== id));
  };

  return { items: out, done };
}

/*
  A row left the list (an added row's Remove, or a removed row deleted by
  Publish, which then leaves inert): if focus was in it, or in the tray
  showing it, it would drop to <body>. It goes to the row that took its
  place instead, or to the Add tile when it was the last row, and the tray
  then shows that row.
*/
const FOCUSABLE = ':is(textarea, input, select, button):not([disabled])';

function focusNeighbour(list: HTMLElement | null, dropped: Array<{ row: { id: string }; index: number }>) {
  const f = getUi().focus;
  if (!list || f?.type !== 'row') return;
  const hit = dropped.find(({ row }) => row.id === f.id);
  if (!hit) return;
  const active = document.activeElement;
  if (active && active !== document.body && !active.closest('[data-ed-tray]')) return;
  const rest = Array.from(items(list)).filter((el) => el.dataset.leaving === undefined);
  const cell = rest[hit.index] ?? list.lastElementChild;
  const target = cell?.querySelector<HTMLElement>(FOCUSABLE);
  if (target) target.focus();
  else setUi({ focus: null });
}

/* ── The tray's view of a row ── */

export interface RowTrayView {
  label: string;
  tone?: Tone;
  body: ReactNode;
  actions?: ReactNode;
}

type RowTray = (id: string, field: string, row: Record<string, unknown>) => RowTrayView;

const trays = new Map<ListTable, RowTray>();

/** A list editor registers how the tray shows one of its rows, while it is mounted. */
export function useRowTray(table: ListTable, view: RowTray) {
  useLayoutEffect(() => {
    trays.set(table, view);
  });
  useLayoutEffect(() => () => void trays.delete(table), [table]);
}

/** For the edit bar: the tray while a row's field, chip or grip has focus. */
export function rowTrayView(table: ListTable, id: string, field: string): RowTrayView | null {
  const row = currentRow(table, id);
  const view = trays.get(table);
  return row && view ? view(id, field, row) : null;
}

/**
 * Remove, or Keep for a row already marked Will be removed. It is in the
 * tray, so focus moving to it keeps the row's context, and stays on it
 * after Remove so Keep is one press away. An added row is dropped at once,
 * and useLeaving moves focus to the row that takes its place.
 */
export function RemoveButton({ api, table, id }: { api: ListDraftApi; table: ListTable; id: string }) {
  const state = api.state(id);
  const copy = COPY.list[table];
  return (
    <Button
      variant="secondary"
      className="ed-small"
      onClick={() => {
        if (state === 'removing') return api.keep(id);
        api.remove(id);
      }}
    >
      {state === 'removing' ? copy.keep : copy.remove}
    </Button>
  );
}
