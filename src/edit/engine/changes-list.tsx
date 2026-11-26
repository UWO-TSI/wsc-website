'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSiteContent } from '@/providers/site-content-provider';
import { SITE_CONTENT, type SiteContentKey } from '@/lib/site-content-defaults';
import { IMAGE_SLOTS, type ImageSlotKey } from '@/lib/image-slots';
import { LIST_VISIBILITY_COLUMN, type ListTable } from '@/edit/list-draft';
import { COPY } from '@/edit/engine/copy';
import { changeList, type Change, type FieldChange } from '@/edit/engine/draft-store';

/*
  The bar's list of unpublished changes, opened from the change count.

  One entry per change, newest first: where it is (page, section, field
  or row) and what it changed, the published value struck through beside
  the draft value. Pressing an entry closes the list and focuses the
  field when it is on this page, or opens the page it is on. Escape
  closes the list and returns focus to the count, and a press outside the
  bar closes it. The bar also closes it on Escape at the count, when the
  count reaches 0, and on Discard and Publish (edit-bar.tsx), so it is
  only ever opened from the count.

  It opens above the bar and scrolls inside itself, so the bar keeps its
  size and the page under it does not move.
*/

/** The route each page name in site-content-defaults.ts and image-slots.ts is shown on. */
const PAGE_PATH: Record<string, string> = {
  Home: '/',
  About: '/about',
  Team: '/executive-team',
  Events: '/events',
  Partners: '/sponsors',
  Contact: '/contact-us',
};

/** Where each list is edited. */
const LIST_PAGE: Record<ListTable, string> = {
  executives: 'Team',
  events: 'Events',
  sponsors: 'Partners',
  site_stats: 'Home',
  event_formats: 'Home',
};

/** The column that names a row, per list. */
const NAME_COLUMN: Record<ListTable, string> = {
  executives: 'name',
  events: 'title',
  sponsors: 'name',
  site_stats: 'label',
  event_formats: 'title',
};

/* An executive's title is built from the role and the area, so the title
   change says both and the two id columns are left out. */
const HIDDEN_COLUMNS = new Set(['group', 'area_id']);

interface Entry {
  id: string;
  where: string;
  page?: string;
  /** Selector of the field or row on the page. */
  target: string;
  lines: Array<{ label?: string; from?: string; to?: string; note?: string }>;
}

const text = (v: unknown): string => (v === null || v === undefined ? '' : String(v));

function rowName(table: ListTable, row: Record<string, unknown>) {
  return text(row[NAME_COLUMN[table]]).trim() || COPY.list[table].fresh;
}

function fieldLine(table: ListTable, f: FieldChange) {
  const label = COPY.changeColumn[f.column] ?? f.column;
  if (f.column === LIST_VISIBILITY_COLUMN[table]) {
    return { label, from: f.from ? COPY.visible : COPY.hidden, to: f.to ? COPY.visible : COPY.hidden };
  }
  return { label, from: text(f.from), to: text(f.to) };
}

function toEntry(c: Change, published: (k: SiteContentKey) => string): Entry {
  if (c.kind === 'text') {
    const m = SITE_CONTENT[c.key as SiteContentKey];
    return {
      id: `text:${c.key}`,
      where: COPY.changeWhere(m.page, `${m.section}, ${m.label}`),
      page: m.page,
      target: `[data-ed-field~="${c.key}"]`,
      lines: [{ from: published(c.key as SiteContentKey), to: c.to }],
    };
  }
  if (c.kind === 'photo') {
    const def = IMAGE_SLOTS[c.slot as ImageSlotKey];
    return {
      id: `photo:${c.slot}`,
      where: COPY.changeWhere(def.page, `${def.section}, ${def.label}`),
      page: def.page,
      target: `[data-ed-field="${c.slot}"]`,
      lines: [{ note: COPY.changePhoto }],
    };
  }
  if (c.kind === 'area') {
    return {
      id: `area:${c.name}`,
      where: COPY.changeWhere('Team', COPY.field.area),
      page: 'Team',
      target: '',
      lines: [{ note: COPY.changeArea(c.name) }],
    };
  }
  const { table } = c;
  const kind = COPY.list[table].kind;
  const page = LIST_PAGE[table];
  if (c.kind === 'order') {
    return {
      id: `order:${table}`,
      where: COPY.changeWhere(page, COPY.changeList[table]),
      page,
      target: '',
      lines: [{ note: COPY.changeOrder }],
    };
  }
  const where = COPY.changeWhere(page, `${kind}, ${rowName(table, c.row)}`);
  const target = `[data-key="${c.id}"]`;
  if (c.kind === 'added') return { id: `added:${c.id}`, where, page, target, lines: [{ note: COPY.changeAdded }] };
  if (c.kind === 'removed') return { id: `removed:${c.id}`, where, page, target, lines: [{ note: COPY.changeRemoved }] };
  if (c.kind === 'file') return { id: `file:${c.id}:${c.column}`, where, page, target, lines: [{ note: COPY.changePhoto }] };
  return {
    id: `changed:${c.id}`,
    where,
    page,
    target,
    lines: c.fields.filter((f) => !HIDDEN_COLUMNS.has(f.column)).map((f) => fieldLine(table, f)),
  };
}

function Value({ value, as: Tag }: { value: string; as: 'del' | 'ins' }) {
  return value ? <Tag>{value}</Tag> : <Tag className="ed-change-empty">{COPY.changeEmptyValue}</Tag>;
}

export default function ChangesList({ id, onClose }: { id: string; onClose: (refocus: boolean) => void }) {
  const { published } = useSiteContent();
  const router = useRouter();
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const entries = changeList().map((c) => toEntry(c, published.text));

  useEffect(() => {
    panel.current?.querySelector<HTMLElement>('button')?.focus();
  }, []);

  /* A press anywhere outside the bar closes the list. The count's own
     press is inside the bar, so it toggles the list instead. */
  useEffect(() => {
    const away = (ev: PointerEvent) => {
      if (!(ev.target as Element | null)?.closest('.ed-bar')) onClose(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [onClose]);

  const go = (e: Entry) => {
    const el = e.target ? document.querySelector<HTMLElement>(e.target) : null;
    onClose(false);
    if (el) {
      el.scrollIntoView({ block: 'center' });
      el.querySelector<HTMLElement>('textarea, input, select, button')?.focus({ preventScroll: true });
      return;
    }
    const path = e.page ? PAGE_PATH[e.page] : undefined;
    if (path && path !== pathname) router.push(path);
  };

  return (
    <div
      ref={panel}
      id={id}
      className="ed-changes"
      role="region"
      aria-label={COPY.changesHead}
      onKeyDown={(ev) => {
        if (ev.key === 'Escape') {
          ev.stopPropagation();
          onClose(true);
        }
      }}
    >
      <div className="ed-changes-head">
        <span className="label">{COPY.changesHead}</span>
        <span className="meta">{COPY.changesHint}</span>
      </div>
      <ul>
        {entries.map((e) => (
          <li key={e.id}>
            <button type="button" className="ed-change" onClick={() => go(e)}>
              <span className="meta">{e.where}</span>
              {e.lines.map((l, i) => (
                <span key={i} className="ed-change-diff">
                  {l.label && <span className="meta">{l.label}</span>}
                  {l.note ? (
                    <span>{l.note}</span>
                  ) : (
                    <>
                      <Value value={l.from ?? ''} as="del" />
                      <span aria-hidden="true">&rarr;</span>
                      <span className="sr-only">{COPY.changedTo}</span>
                      <Value value={l.to ?? ''} as="ins" />
                    </>
                  )}
                </span>
              ))}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
