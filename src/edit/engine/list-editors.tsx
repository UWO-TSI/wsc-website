'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { isBefore, parseISO, startOfDay, format } from 'date-fns';
import Avatar from '@/components/ui/avatar';
import Chip from '@/components/ui/chip';
import RevealImage from '@/components/ui/reveal-image';
import { AVATAR_SIZES, AVATAR_WIDTH, GRID, titleOf } from '@/components/team/executive-grid';
import { byDateDesc } from '@/components/events/timeline';
import { TILE_SIZE, scaleFor } from '@/components/sponsors/logo-card';
import CardRow, { CARD_ROW_ITEM } from '@/components/ui/card-row';
import { FORMAT_CARD, FORMAT_PHOTO, FORMAT_PHOTO_SIZES } from '@/components/landing/formats-section';
import { EditableButton, useEditSnapshot } from '@/edit';
import { externalLinkProps } from '@/lib/link-utils';
import { LIMITS } from '@/lib/admin-config';
import { SITE_IMAGES_BUCKET } from '@/lib/image-slots';
import { getPublicUrl } from '@/lib/supabase/storage';
import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import { useSiteContent } from '@/providers/site-content-provider';
import { EXEC_GROUP_FALLBACKS } from '@/lib/exec-group-fallbacks';
import type { ListDraftApi, ListRowState, ListTable } from '@/edit/list-draft';
import type { Event, EventFormat, ExecArea, ExecGroup, Executive, SiteStat, Sponsor } from '@/types/database';
import { COPY } from '@/edit/engine/copy';
import { addDraftArea, draftAreas, useDraftVersion } from '@/edit/engine/draft-store';
import {
  AddTile,
  Grip,
  InlineNumber,
  InlineSelect,
  RemoveButton,
  ReorderItem,
  ReorderList,
  RowField,
  RowInput,
  RowOptions,
  RowPhoto,
  StateChip,
  VisibilityChip,
  useHeldOrder,
  useLeaving,
  useReorder,
  useRowTray,
  type RowTrayView,
} from '@/edit/engine/list-parts';
import { LinkField } from '@/edit/engine/link-field';
import { blurField, edited, focusField, setUi } from '@/edit/engine/ui-store';

/*
  The edit branches of the five lists: the roster, the event ledger, the
  logo wall, the counted figures and the format cards. Each takes the same props as the
  visitor component it replaces, gets its rows from the page's
  useSupabaseQuery (drafts already laid over them), and writes through the
  list draft. Every field is inline, the Add tile is the last cell, the
  Grip reorders, the chips hide and show the state, and Remove is in the
  tray.

  Column limits are the database's CHECK constraints (migrations 7, 9, the
  register_url migration and the event_formats migration), so a field
  never accepts more than the row can store.
*/

const LIMIT = {
  executiveName: 40,
  areaName: 40,
  eventTitle: 80,
  eventLocation: 60,
  eventDescription: 800,
  url: 200,
  sponsorName: 40,
  statValue: 99999,
  statSuffix: 2,
  statLabel: 24,
  formatTitle: 28,
  formatBody: 140,
  formatMeta: 60,
};

/** The characters a figure's number row reserves: the number's digits and its suffix. */
const FIGURE_CHARS = String(LIMIT.statValue).length + LIMIT.statSuffix;

const ADD_AREA = '__add';

function useList<R extends { id: string }>(table: ListTable): ListDraftApi<R> {
  useDraftVersion();
  return useEditSnapshot().engine!.list(table) as unknown as ListDraftApi<R>;
}

/** After an add, focus the new row's first field once it is on the page. */
function useFocusNew(): (selector: string) => void {
  const next = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (!next.current) return;
    const el = document.querySelector<HTMLElement>(next.current);
    if (el) {
      el.focus();
      next.current = null;
    }
  });
  return (selector) => {
    next.current = selector;
  };
}

/** Class names an item takes for its state, shared by every list. */
function itemClass(state: ListRowState, hidden: boolean, held: boolean, leaving: boolean) {
  return [
    'ed-item',
    hidden ? 'ed-hid' : '',
    state === 'removing' ? 'ed-removing' : '',
    held ? 'ed-held' : '',
    leaving ? 'ed-leave' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/*
  A row's link address in the tray: an event's register link, a partner's
  site. Both columns accept http(s) only (events_register_url_scheme,
  sponsors_link_scheme), so LinkField refuses anything else on blur.
*/
function TrayLink({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string | null) => void;
}) {
  return (
    <LinkField
      label={label}
      value={value}
      format="https"
      maxLength={LIMIT.url}
      placeholder={COPY.linkPlaceholder}
      onSave={(v) => onChange(v || null)}
    />
  );
}

/** The cap's tray line while a list is full, or undefined. Removed rows do not count. */
function fullAt(api: ListDraftApi, rows: Array<{ id: string }>, max: number, line: (n: number) => string) {
  return rows.filter((r) => api.state(r.id) !== 'removing').length >= max ? line(max) : undefined;
}

/* ── Executives ── */

export function ExecutivesEditor({ executives }: { executives: Executive[] }) {
  const table = 'executives';
  const api = useList<Executive>(table);
  const copy = COPY.list[table];
  const { data: groupRows } = useSupabaseQuery<ExecGroup>('exec_groups');
  const { data: areaRows } = useSupabaseQuery<ExecArea>('exec_areas', { orderBy: 'name' });
  const groups = groupRows.length ? groupRows : EXEC_GROUP_FALLBACKS;
  const areas = [...areaRows, ...draftAreas().map((a) => ({ ...a, display_order: 0 }))].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const listRef = useRef<HTMLUListElement>(null);
  const focusNew = useFocusNew();
  const [adds, setAdds] = useState(0);
  const [addingArea, setAddingArea] = useState<string | null>(null);

  const nameOf = (e: Executive) => e.name.trim() || copy.fresh;
  const built = (group: string, areaId: string | null) => {
    const role = groups.find((g) => g.slug === group)?.short_label ?? '';
    const area = areas.find((a) => a.id === areaId)?.name;
    return (area ? `${role}, ${area}` : role).slice(0, LIMIT.areaName);
  };

  /* A role change re-groups the roster; the row stays put until focus leaves the list. */
  const held = useHeldOrder(table, executives);
  const rows = held.rows;
  const reorder = useReorder({ api, table, rows, listRef, nameOf, canSwap: (a, b) => a.group === b.group });
  held.onRelease(reorder.capture);
  const { items, done } = useLeaving(rows, api, reorder.capture, listRef);

  useRowTray(table, (id, field, row): RowTrayView => {
    const e = row as unknown as Executive;
    const shown = titleOf(e, groups, areas);
    const text =
      field === 'group' ? COPY.roleHint(shown)
      : field === 'grip' ? COPY.gripHint
      : field === 'headshot_path' ? COPY.rowPhotoHint
      : COPY.showsAs(shown);
    return {
      label: COPY.rowHead(copy.kind, e.name.trim() || copy.fresh),
      body: text,
      actions: <RemoveButton api={api} table={table} id={id} />,
    };
  });

  const add = () => {
    reorder.capture();
    const group = rows[rows.length - 1]?.group ?? groups[0]?.slug ?? '';
    const id = api.add({ name: '', group, area_id: null, title: built(group, null), visible: true } as Partial<Executive>);
    setAdds((n) => n + 1);
    focusNew(`[data-ed-field="executives.${id}.name"] textarea`);
  };

  return (
    <ReorderList layout="grid" {...reorder.listProps}>
      <ul ref={listRef} className={`m-0 list-none p-0 ${GRID}`}>
        {items.map(({ row: e, leaving }, index) => {
          const state = api.state(e.id);
          const src = api.fileUrl(e.id, 'headshot_path') ?? getPublicUrl('headshots', e.headshot_path);
          const who = nameOf(e);
          const head = COPY.rowHead(copy.kind, who);
          return (
            <ReorderItem
              key={e.id}
              id={e.id}
              as="li"
              disabled={leaving}
              data-leaving={leaving ? '' : undefined}
              inert={leaving}
              onAnimationEnd={(ev) => leaving && ev.target === ev.currentTarget && done(e.id)}
              className={`${itemClass(state, !e.visible, reorder.held === e.id, leaving)} relative flex flex-col items-center gap-3 text-center`}
            >
              <span className={`relative ${AVATAR_WIDTH}`}>
                <Avatar name={e.name} src={src} fluid sizes={AVATAR_SIZES} />
                <RowPhoto
                  api={api}
                  table={table}
                  id={e.id}
                  column="headshot_path"
                  filled={!!src}
                  what={COPY.field.headshot}
                  who={nameOf(e)}
                  head={head}
                />
              </span>
              <VisibilityChip
                table={table}
                id={e.id}
                who={who}
                visible={e.visible}
                onToggle={() => api.hide(e.id, e.visible)}
                className="ed-over-tl"
              />
              <Grip {...reorder.gripProps(e, index)} className="ed-grip ed-over-tr" />

              <div className="flex w-full flex-col gap-2">
                <RowField
                  table={table}
                  id={e.id}
                  column="name"
                  value={e.name}
                  max={LIMIT.executiveName}
                  label={COPY.field.name}
                  who={who}
                  placeholder={COPY.field.fullName}
                  block
                  className="title-sm"
                  onChange={(name) => api.update(e.id, { name })}
                />
                <span className="meta flex flex-col gap-2">
                  <InlineSelect
                    table={table}
                    id={e.id}
                    column="group"
                    value={e.group}
                    label={COPY.field.role}
                    who={who}
                    options={groups.map((g) => ({ value: g.slug, label: g.short_label, title: g.singular_label }))}
                    onChange={(group) =>
                      api.update(e.id, { group, title: built(group, e.area_id ?? null) } as Partial<Executive>)
                    }
                  />
                  {addingArea === e.id ? (
                    <NewArea
                      areas={areas}
                      onDone={(name) => {
                        setAddingArea(null);
                        if (name) {
                          const areaId = addDraftArea(name);
                          api.update(e.id, { area_id: areaId, title: `${built(e.group, null)}, ${name}`.slice(0, LIMIT.areaName) } as Partial<Executive>);
                        }
                        focusNew(`[data-ed-field="executives.${e.id}.area_id"] select`);
                      }}
                      onFocus={() => focusField({ type: 'area', id: e.id })}
                    />
                  ) : (
                    <InlineSelect
                      table={table}
                      id={e.id}
                      column="area_id"
                      value={e.area_id ?? ''}
                      label={COPY.field.area}
                      who={who}
                      options={[
                        { value: '', label: COPY.noArea },
                        ...areas.map((a) => ({ value: a.id, label: a.name })),
                        { value: ADD_AREA, label: COPY.addArea },
                      ]}
                      onChange={(value) => {
                        if (value === ADD_AREA) return setAddingArea(e.id);
                        const areaId = value || null;
                        api.update(e.id, { area_id: areaId, title: built(e.group, areaId) } as Partial<Executive>);
                      }}
                    />
                  )}
                </span>
              </div>
              <RowOptions table={table} id={e.id} who={who} />
              <StateChip state={state} />
            </ReorderItem>
          );
        })}
        <li key={`add-${adds}`} className="flex flex-col items-center">
          <span className={AVATAR_WIDTH}>
            <AddTile
              label={copy.add}
              shape="disc"
              appear={adds > 0}
              full={fullAt(api, rows, LIMITS.MAX_EXECUTIVES, copy.full)}
              onAdd={add}
            />
          </span>
        </li>
      </ul>
      <p className="sr-only" role="status">
        {reorder.announce}
      </p>
    </ReorderList>
  );
}

/*
  Add an area, in place of the area select. Enter keeps the name, Escape
  and an empty name go back to the select. A name that matches an existing
  area, ignoring case, is refused in the tray and the field stays open.
*/
function NewArea({
  areas,
  onDone,
  onFocus,
}: {
  areas: Array<{ id: string; name: string }>;
  onDone: (name: string | null) => void;
  onFocus: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const closed = useRef(false);
  useLayoutEffect(() => ref.current?.focus(), []);

  const finish = (save: boolean) => {
    if (closed.current) return;
    const name = (ref.current?.value ?? '').trim().replace(/\s+/g, ' ');
    if (save && name) {
      const dup = areas.find((a) => a.name.toLowerCase() === name.toLowerCase());
      if (dup) {
        setUi({ flash: { tone: 'alert', label: COPY.newArea, text: COPY.duplicateArea(dup.name), announce: true } });
        ref.current?.select();
        return;
      }
      closed.current = true;
      return onDone(name.charAt(0).toUpperCase() + name.slice(1));
    }
    closed.current = true;
    onDone(null);
  };

  return (
    <span className="ed ed-sel ed-sel-input">
      <input
        ref={ref}
        maxLength={LIMIT.areaName}
        placeholder={COPY.newArea}
        aria-label={COPY.newAreaName}
        onFocus={onFocus}
        onChange={() => edited()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            finish(true);
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            finish(false);
          }
        }}
        onBlur={() => {
          blurField();
          setTimeout(() => finish(true), 0);
        }}
      />
    </span>
  );
}

/* ── Events ── */

const today = () => format(new Date(), 'yyyy-MM-dd');

export function EventsEditor({ events }: { events: Event[] }) {
  const table = 'events';
  const api = useList<Event>(table);
  const copy = COPY.list[table];
  const { text } = useSiteContent();
  const listRef = useRef<HTMLUListElement>(null);
  const focusNew = useFocusNew();
  const [adds, setAdds] = useState(0);
  const nameOf = (e: Event) => e.title.trim() || copy.fresh;

  /* Events are read newest first, so the ledger has no Grip: its order is
     the date, and display_order is not shown anywhere. A row whose date
     changes keeps its place until focus leaves the list, then moves once
     on the move row, which also closes the gap after a removal. */
  const held = useHeldOrder(table, [...events].sort(byDateDesc));
  const rows = held.rows;
  const reorder = useReorder({ api, table, rows, listRef, nameOf });
  held.onRelease(reorder.capture);
  const { items, done } = useLeaving(rows, api, reorder.capture, listRef);

  useRowTray(table, (id, _field, row): RowTrayView => {
    const e = row as unknown as Event;
    const title = e.title.trim() || copy.fresh;
    return {
      label: COPY.rowHead(copy.kind, title),
      body: (
        <TrayLink
          label={COPY.registerLink(title)}
          value={e.register_url ?? ''}
          onChange={(register_url) => api.update(id, { register_url } as Partial<Event>)}
        />
      ),
      actions: <RemoveButton api={api} table={table} id={id} />,
    };
  });

  const add = () => {
    reorder.capture();
    const id = api.add({
      title: '',
      date: today(),
      time: null,
      location: null,
      description: null,
      register_url: null,
      published: true,
    } as unknown as Partial<Event>);
    setAdds((n) => n + 1);
    focusNew(`[data-ed-field="events.${id}.title"] textarea`);
  };

  return (
    <ul ref={listRef} className="flex list-none flex-col gap-1 p-0">
      {items.map(({ row: e, leaving }, index) => {
        const state = api.state(e.id);
        const isPast = isBefore(startOfDay(parseISO(e.date)), startOfDay(new Date()));
        const registerUrl = e.register_url?.trim() ?? '';
        const canRegister = !isPast && 'target' in externalLinkProps(registerUrl);
        const who = nameOf(e);
        return (
          <li
            key={e.id}
            data-key={e.id}
            data-leaving={leaving ? '' : undefined}
            inert={leaving}
            onAnimationEnd={(ev) => leaving && ev.target === ev.currentTarget && done(e.id)}
            className={`${itemClass(state, !e.published, false, leaving)} row`}
          >
            <div className="flex w-full flex-wrap items-center gap-x-[14px] gap-y-2">
              <span className="label text-ink! w-[30px] shrink-0">{String(index + 1).padStart(2, '0')}</span>
              <RowField
                table={table}
                id={e.id}
                column="title"
                value={e.title}
                max={LIMIT.eventTitle}
                label={COPY.field.title}
                who={who}
                block
                className="title-sm text-ink min-w-0 flex-1 basis-60"
                onChange={(title) => api.update(e.id, { title })}
              />
              <span className="meta text-ink! flex flex-wrap items-center gap-2">
                <RowInput
                  table={table}
                  id={e.id}
                  column="date"
                  type="date"
                  value={e.date}
                  label={COPY.field.date}
                  who={who}
                  onChange={(date) => date && api.update(e.id, { date })}
                />
                <RowInput
                  table={table}
                  id={e.id}
                  column="time"
                  type="time"
                  value={e.time ?? ''}
                  label={COPY.field.time}
                  who={who}
                  onChange={(time) => api.update(e.id, { time: time || null } as Partial<Event>)}
                />
              </span>
              {/* Takes the rest of the row, so the Register label measures
                  against a real column rather than a shrink-wrapped one. */}
              <span className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3">
                {!isPast && <Chip status="ok">Open</Chip>}
                {/* An upcoming event keeps the Register button's slot while
                    its link is empty or invalid, so typing the link never
                    changes the width of the title field beside it. */}
                {!isPast && (
                  <span
                    className={`inline-flex${canRegister ? '' : ' ed-off'}`}
                    aria-hidden={!canRegister}
                    inert={!canRegister}
                  >
                    <EditableButton
                      labelKey="events.ledger.register_label"
                      variant="secondary"
                      href={registerUrl}
                      aria-label={`${text('events.ledger.register_label')}, ${e.title}`}
                    />
                  </span>
                )}
                <VisibilityChip
                  table={table}
                  id={e.id}
                  who={who}
                  visible={e.published}
                  onToggle={() => api.hide(e.id, e.published)}
                />
                <RowOptions table={table} id={e.id} who={who} />
                <StateChip state={state} />
              </span>
            </div>
            <div className="flex w-full flex-col gap-2 pl-[44px]">
              <RowField
                table={table}
                id={e.id}
                column="location"
                value={e.location ?? ''}
                max={LIMIT.eventLocation}
                label={COPY.field.location}
                who={who}
                className="meta text-ink"
                onChange={(location) => api.update(e.id, { location: location || null } as Partial<Event>)}
              />
              <RowField
                table={table}
                id={e.id}
                column="description"
                value={e.description ?? ''}
                max={LIMIT.eventDescription}
                label={COPY.field.description}
                who={who}
                block
                className="body text-ink measure"
                onChange={(description) => api.update(e.id, { description: description || null } as Partial<Event>)}
              />
            </div>
          </li>
        );
      })}
      <li key={`add-${adds}`} className="flex">
        <AddTile
          label={copy.add}
          shape="row"
          appear={adds > 0}
          full={fullAt(api, rows, LIMITS.MAX_EVENTS, copy.full)}
          onAdd={add}
        />
      </li>
    </ul>
  );
}

/* ── Sponsors ── */

export function SponsorsEditor({ sponsors }: { sponsors: Sponsor[] }) {
  const table = 'sponsors';
  const api = useList<Sponsor>(table);
  const copy = COPY.list[table];
  const listRef = useRef<HTMLDivElement>(null);
  const focusNew = useFocusNew();
  const [adds, setAdds] = useState(0);
  const nameOf = (s: Sponsor) => s.name.trim() || copy.fresh;

  const reorder = useReorder({ api, table, rows: sponsors, listRef, nameOf });
  const { items, done } = useLeaving(sponsors, api, reorder.capture, listRef);

  useRowTray(table, (id, field, row): RowTrayView => {
    const s = row as unknown as Sponsor;
    const name = s.name.trim() || copy.fresh;
    return {
      label: COPY.rowHead(copy.kind, name),
      body:
        field === 'grip' ? (
          COPY.gripHint
        ) : (
          <TrayLink
            label={COPY.partnerLink(name)}
            value={s.link ?? ''}
            onChange={(link) => api.update(id, { link } as Partial<Sponsor>)}
          />
        ),
      actions: <RemoveButton api={api} table={table} id={id} />,
    };
  });

  const add = () => {
    reorder.capture();
    const id = api.add({ name: '', link: null, logo_path: null, active: true } as unknown as Partial<Sponsor>);
    setAdds((n) => n + 1);
    focusNew(`[data-ed-field="sponsors.${id}.name"] textarea`);
  };

  return (
    <ReorderList layout="grid" {...reorder.listProps}>
      <div
        ref={listRef}
        className="flex flex-wrap items-start justify-center gap-x-[clamp(2.5rem,6vw,5rem)] gap-y-8 py-[clamp(1rem,4vw,2.5rem)]"
      >
        {items.map(({ row: s, leaving }, index) => {
          const state = api.state(s.id);
          const src = api.fileUrl(s.id, 'logo_path') ?? getPublicUrl('sponsor-logos', s.logo_path ?? null);
          const scale = scaleFor(index, items.length);
          const who = nameOf(s);
          return (
            <ReorderItem
              key={s.id}
              id={s.id}
              as="div"
              disabled={leaving}
              data-leaving={leaving ? '' : undefined}
              inert={leaving}
              onAnimationEnd={(ev) => leaving && ev.target === ev.currentTarget && done(s.id)}
              className={`${itemClass(state, !s.active, reorder.held === s.id, leaving)} relative flex flex-col items-center gap-3`}
            >
              <span className={`relative flex flex-none items-center justify-center rounded-md p-2 ${TILE_SIZE[scale]}`}>
                {/* No name fallback while editing: the name field under the
                    tile already shows it, and Add logo takes the tile. */}
                {src && (
                  <RevealImage src={src} alt="" sizes="220px" className="h-full w-full" fit="contain" sequence="fade" />
                )}
                <RowPhoto
                  api={api}
                  table={table}
                  id={s.id}
                  column="logo_path"
                  filled={!!src}
                  what={COPY.field.logo}
                  who={nameOf(s)}
                  head={COPY.rowHead(copy.kind, nameOf(s))}
                  replaceLabel={COPY.replaceLogo}
                  addLabel={COPY.addLogo}
                />
                <Grip {...reorder.gripProps(s, index)} className="ed-grip ed-over-tr" />
              </span>
              <RowField
                table={table}
                id={s.id}
                column="name"
                value={s.name}
                max={LIMIT.sponsorName}
                label={COPY.field.name}
                who={who}
                className="meta text-on-logo-ground text-center"
                onChange={(name) => api.update(s.id, { name })}
              />
              <span className="flex flex-wrap items-center justify-center gap-2">
                <VisibilityChip table={table} id={s.id} who={who} visible={s.active} onToggle={() => api.hide(s.id, s.active)} />
                <RowOptions table={table} id={s.id} who={who} />
                <StateChip state={state} />
              </span>
            </ReorderItem>
          );
        })}
        <div key={`add-${adds}`} className={`flex-none ${TILE_SIZE.std}`}>
          <AddTile
            label={copy.add}
            shape="logo"
            appear={adds > 0}
            full={fullAt(api, sponsors, LIMITS.MAX_SPONSORS, copy.full)}
            onAdd={add}
          />
        </div>
      </div>
      <p className="sr-only" role="status">
        {reorder.announce}
      </p>
    </ReorderList>
  );
}

/* ── Counted figures ── */

export function StatsEditor({ stats }: { stats: SiteStat[] }) {
  const table = 'site_stats';
  const api = useList<SiteStat>(table);
  const copy = COPY.list[table];
  const listRef = useRef<HTMLDivElement>(null);
  const focusNew = useFocusNew();
  const [adds, setAdds] = useState(0);
  const nameOf = (s: SiteStat) => s.label.trim() || copy.fresh;

  const reorder = useReorder({ api, table, rows: stats, listRef, nameOf });
  const { items, done } = useLeaving(stats, api, reorder.capture, listRef);

  useRowTray(table, (id, field, row): RowTrayView => {
    const s = row as unknown as SiteStat;
    const text = field === 'grip' ? COPY.gripHint : COPY.showsAs(`${s.value}${s.suffix ?? ''} ${s.label}`.trim());
    return {
      label: COPY.rowHead(copy.kind, s.label.trim() || copy.fresh),
      body: text,
      actions: <RemoveButton api={api} table={table} id={id} />,
    };
  });

  const add = () => {
    reorder.capture();
    const id = api.add({ value: 0, suffix: null, label: '', visible: true } as unknown as Partial<SiteStat>);
    setAdds((n) => n + 1);
    focusNew(`[data-ed-field="site_stats.${id}.value"] input`);
  };

  return (
    <ReorderList layout="grid" {...reorder.listProps}>
      {/* Wider than the visitor row: each field reserves the largest
          number (99999) and a two-character suffix in the figure's font.
          One centred row that wraps, with the Add tile as its last cell:
          three figures and the tile fit one row at 1280, and on phones
          each takes its own centred row. */}
      <div ref={listRef} className="flex flex-wrap justify-center gap-x-4 gap-y-8">
        {items.map(({ row: s, leaving }, index) => {
          const state = api.state(s.id);
          const who = nameOf(s);
          return (
            <ReorderItem
              key={s.id}
              id={s.id}
              as="div"
              disabled={leaving}
              data-leaving={leaving ? '' : undefined}
              inert={leaving}
              onAnimationEnd={(ev) => leaving && ev.target === ev.currentTarget && done(s.id)}
              className={`${itemClass(state, !s.visible, reorder.held === s.id, leaving)} flex flex-col items-center gap-2 text-center`}
            >
              <span className="flex items-baseline gap-1 font-text text-[clamp(2.4rem,7vw,56px)] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                <InlineNumber
                  table={table}
                  id={s.id}
                  column="value"
                  value={s.value}
                  max={LIMIT.statValue}
                  label={COPY.field.value}
                  who={who}
                  onChange={(value) => api.update(s.id, { value })}
                />
                <RowField
                  table={table}
                  id={s.id}
                  column="suffix"
                  value={s.suffix ?? ''}
                  max={LIMIT.statSuffix}
                  label={COPY.field.suffix}
                  who={who}
                  className="accent-mark"
                  onChange={(suffix) => api.update(s.id, { suffix: suffix || null } as Partial<SiteStat>)}
                />
              </span>
              <RowField
                table={table}
                id={s.id}
                column="label"
                value={s.label}
                max={LIMIT.statLabel}
                label={COPY.field.label}
                who={who}
                className="label"
                onChange={(label) => api.update(s.id, { label })}
              />
              <span className="flex items-center gap-2">
                <VisibilityChip table={table} id={s.id} who={who} visible={s.visible} onToggle={() => api.hide(s.id, s.visible)} />
                <Grip {...reorder.gripProps(s, index)} />
                <RowOptions table={table} id={s.id} who={who} />
              </span>
              <StateChip state={state} />
            </ReorderItem>
          );
        })}
        {/* As wide as a figure's number row, in the figure's font: seven
            characters (five digits and the suffix) at -0.02em tracking,
            plus two fields' 26px (24px shell padding and the 2px measure
            allowance) and the 4px gap between them. The tile sets its own
            type, so only the width uses this font. */}
        <div
          key={`add-${adds}`}
          className="flex max-w-full font-text font-semibold text-[clamp(2.4rem,7vw,56px)]"
          style={{ width: `calc(${FIGURE_CHARS}ch - ${FIGURE_CHARS * 0.02}em + 56px)` }}
        >
          <AddTile
            label={copy.add}
            shape="figure"
            appear={adds > 0}
            full={fullAt(api, stats, LIMITS.MAX_SITE_STATS, copy.full)}
            onAdd={add}
          />
        </div>
      </div>
      <p className="sr-only" role="status">
        {reorder.announce}
      </p>
    </ReorderList>
  );
}

/* ── Format cards ── */

/*
  The home page's CardRow with every card, hidden ones included, as the
  visitor card with its fields inline: the photo with Replace or Add photo,
  the name, the sentence and the companies line. The chips and the Grip sit
  on the photo's corners, as on a headshot. The Add tile is the last card.
*/
export function FormatsEditor({ formats }: { formats: EventFormat[] }) {
  const table = 'event_formats';
  const api = useList<EventFormat>(table);
  const copy = COPY.list[table];
  const listRef = useRef<HTMLUListElement>(null);
  const focusNew = useFocusNew();
  const [adds, setAdds] = useState(0);
  const nameOf = (f: EventFormat) => f.title.trim() || copy.fresh;

  const reorder = useReorder({ api, table, rows: formats, listRef, nameOf });
  const { items, done } = useLeaving(formats, api, reorder.capture, listRef);

  useRowTray(table, (id, field, row): RowTrayView => {
    const f = row as unknown as EventFormat;
    const text =
      field === 'grip' ? COPY.gripHint
      : field === 'image_path' ? COPY.rowPhotoHint
      : field === 'body' ? COPY.formatBodyHint
      : field === 'meta' ? COPY.formatMetaHint
      : COPY.formatHint;
    return {
      label: COPY.rowHead(copy.kind, f.title.trim() || copy.fresh),
      body: text,
      actions: <RemoveButton api={api} table={table} id={id} />,
    };
  });

  const add = () => {
    reorder.capture();
    const id = api.add({ title: '', body: null, meta: null, image_path: null, visible: true } as Partial<EventFormat>);
    setAdds((n) => n + 1);
    focusNew(`[data-ed-field="event_formats.${id}.title"] textarea`);
  };

  return (
    <ReorderList layout="row" {...reorder.listProps}>
      <CardRow label="Event formats" count={items.length + 1} listRef={listRef}>
        {items.map(({ row: f, leaving }, index) => {
          const state = api.state(f.id);
          const src = api.fileUrl(f.id, 'image_path') ?? getPublicUrl(SITE_IMAGES_BUCKET, f.image_path);
          const who = nameOf(f);
          return (
            <ReorderItem
              key={f.id}
              id={f.id}
              as="li"
              disabled={leaving}
              data-leaving={leaving ? '' : undefined}
              inert={leaving}
              onAnimationEnd={(ev) => leaving && ev.target === ev.currentTarget && done(f.id)}
              className={`${itemClass(state, !f.visible, reorder.held === f.id, leaving)} ${CARD_ROW_ITEM}`}
            >
              <article className={FORMAT_CARD}>
                <span className="relative block rounded-md">
                  <RevealImage src={src} alt="" sizes={FORMAT_PHOTO_SIZES} className={FORMAT_PHOTO} index={index} />
                  <RowPhoto
                    api={api}
                    table={table}
                    id={f.id}
                    column="image_path"
                    filled={!!src}
                    what={COPY.field.photo}
                    who={who}
                    head={COPY.rowHead(copy.kind, who)}
                  />
                  <VisibilityChip
                    table={table}
                    id={f.id}
                    who={who}
                    visible={f.visible}
                    onToggle={() => api.hide(f.id, f.visible)}
                    className="ed-over-tl"
                  />
                  <Grip {...reorder.gripProps(f, index)} className="ed-grip ed-over-tr" />
                </span>
                <div className="flex flex-col gap-2 px-3 pb-3">
                  <RowField
                    table={table}
                    id={f.id}
                    column="title"
                    value={f.title}
                    max={LIMIT.formatTitle}
                    label={COPY.field.formatName}
                    who={who}
                    block
                    className="title-sm"
                    onChange={(title) => api.update(f.id, { title })}
                  />
                  <RowField
                    table={table}
                    id={f.id}
                    column="body"
                    value={f.body ?? ''}
                    max={LIMIT.formatBody}
                    label={COPY.field.formatBody}
                    who={who}
                    block
                    className="body text-ink-muted"
                    onChange={(body) => api.update(f.id, { body: body || null })}
                  />
                  <RowField
                    table={table}
                    id={f.id}
                    column="meta"
                    value={f.meta ?? ''}
                    max={LIMIT.formatMeta}
                    label={COPY.field.formatMeta}
                    who={who}
                    block
                    className="meta"
                    onChange={(meta) => api.update(f.id, { meta: meta || null })}
                  />
                  <span className="flex flex-wrap items-center gap-2">
                    <RowOptions table={table} id={f.id} who={who} />
                    <StateChip state={state} />
                  </span>
                </div>
              </article>
            </ReorderItem>
          );
        })}
        <li key={`add-${adds}`} className={CARD_ROW_ITEM}>
          <AddTile
            label={copy.add}
            shape="card"
            appear={adds > 0}
            full={fullAt(api, formats, LIMITS.MAX_EVENT_FORMATS, copy.full)}
            onAdd={add}
          />
        </li>
      </CardRow>
      <p className="sr-only" role="status">
        {reorder.announce}
      </p>
    </ReorderList>
  );
}

export const LIST_EDITORS = {
  executives: ExecutivesEditor,
  events: EventsEditor,
  sponsors: SponsorsEditor,
  stats: StatsEditor,
  formats: FormatsEditor,
};
