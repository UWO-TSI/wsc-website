import { useSyncExternalStore } from 'react';
import { getEditSnapshot, setEditSnapshot } from '@/edit/edit-mode';
import {
  DRAFT_ID_PREFIX,
  LIST_VISIBILITY_COLUMN,
  type ListDraftApi,
  type ListRowState,
  type ListTable,
  type StoredListDraft,
} from '@/edit/list-draft';
import { memoryDraftDb, openDraftDb, type DraftDb } from '@/edit/engine/idb';
import { IMAGE_SLOTS } from '@/lib/image-slots';
import { SITE_CONTENT } from '@/lib/site-content-defaults';

/*
  The draft: every change an editor has made and not published.

  Held in memory for synchronous reads while typing, and written through to
  IndexedDB on every change, so a reload or a closed tab loses nothing. A
  draft value equal to the published one is not a change and is dropped,
  so typing a word back the way it was brings the count down.

  Records in the database, keyed by string:
    text:<site_content key>      { value, at }
    photo:<site_images slot>     { blob, type, width, at }
    list:<table>                 StoredListDraft
    file:<table>:<id>:<column>   { blob, type, width, at }
    areas:new                    { [draft id]: { name, at } }, areas typed
                                 in with Add an area, written on Publish

  The store keeps only object names and blobs. Published photos are
  resolved with getPublicUrl at runtime by the provider; drafted ones are
  shown through object URLs made here and revoked when they are dropped.
*/

interface TextDraft {
  value: string;
  at: number;
}

interface FileDraft {
  blob: Blob;
  type: string;
  width: number;
  at: number;
}

interface PhotoDraft extends FileDraft {
  url: string;
}

let db: DraftDb = memoryDraftDb;
const texts = new Map<string, TextDraft>();
const photos = new Map<string, PhotoDraft>();
const lists = new Map<ListTable, StoredListDraft>();
const files = new Map<string, PhotoDraft>();
/** Rows each list query last returned, so a move knows the current order. */
const seenIds = new Map<ListTable, string[]>();
/* The published rows each list query last returned, by id: a patch back
   to a published value is dropped, and Publish writes only the
   display_order values that change. */
const seenRows = new Map<ListTable, Map<string, Record<string, unknown>>>();
/** Areas added in the draft, by draft id. Written before the rows that use them. */
const areas = new Map<string, { name: string; at: number }>();
/* Rows deleted by Publish in this session. They are left out until the
   refetch drops them, so a removed row never shows again without its
   Will be removed chip before it leaves. */
const departed = new Set<string>();

/* Values that went live in this session. They cover the gap between
   Publish and the provider's refetch, so a field never shows the old
   value for a moment after its draft is cleared. */
const publishedText = new Map<string, string>();
const publishedImage = new Map<string, { src: string | null; alt: string }>();

let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version++;
  setEditSnapshot({ rev: getEditSnapshot().rev + 1 });
  listeners.forEach((fn) => fn());
}

function persist(id: string, value: unknown | undefined) {
  (value === undefined ? db.remove(id) : db.put(id, value)).catch((err: Error) =>
    console.warn('Draft not saved in this browser:', err.message)
  );
}

export function useDraftVersion(): number {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => version,
    () => 0
  );
}

/** Loads one admin's draft. Resolves once fields can read it. */
export async function loadDrafts(userId: string): Promise<void> {
  try {
    db = await openDraftDb(`wsc-edit-${userId}`);
  } catch {
    db = memoryDraftDb;
  }
  readDrafts(await db.all().catch(() => []));
}

/**
 * Reads the open draft again, for Publish: another tab of the same admin
 * may have published or changed it. A photo or file drafted at the same
 * moment as the one in memory keeps its object URL, so nothing on the
 * page reloads.
 */
export async function reloadDrafts(): Promise<void> {
  /* Without IndexedDB the draft lives in this tab only, and a failed read
     keeps the draft in memory as it is. */
  if (db === memoryDraftDb) return;
  const records = await db.all().catch(() => null);
  if (records) readDrafts(records);
}

function readDrafts(records: Array<{ id: string; value: unknown }>) {
  const keep = (map: Map<string, PhotoDraft>, name: string, v: FileDraft) => {
    const old = map.get(name);
    return old && old.at === v.at && old.type === v.type ? old : { ...v, url: URL.createObjectURL(v.blob) };
  };
  const oldPhotos = new Map(photos);
  const oldFiles = new Map(files);
  photos.clear();
  files.clear();
  clearMemory();
  for (const { id, value } of records) {
    const [kind, ...rest] = id.split(':');
    const name = rest.join(':');
    /* A draft saved before a key or slot left the code (the home format
       cards moved to event_formats) is skipped. Publishing it would point
       a slot no page reads at a new photo and delete the object the slot
       had, which a format card may now use. */
    if (kind === 'text' && name in SITE_CONTENT) texts.set(name, value as TextDraft);
    if (kind === 'photo' && name in IMAGE_SLOTS) photos.set(name, keep(oldPhotos, name, value as FileDraft));
    if (kind === 'file') files.set(name, keep(oldFiles, name, value as FileDraft));
    if (kind === 'list') lists.set(name as ListTable, value as StoredListDraft);
    if (kind === 'areas') {
      for (const [id, a] of Object.entries(value as Record<string, { name: string; at: number }>)) {
        areas.set(id, a);
      }
    }
  }
  const kept = new Set([...photos.values(), ...files.values()].map((d) => d.url));
  [...oldPhotos.values(), ...oldFiles.values()].forEach((d) => kept.has(d.url) || URL.revokeObjectURL(d.url));
  emit();
}

function clearMemory() {
  photos.forEach((p) => URL.revokeObjectURL(p.url));
  files.forEach((f) => URL.revokeObjectURL(f.url));
  texts.clear();
  photos.clear();
  files.clear();
  lists.clear();
  areas.clear();
}

/** Closes the session's view of the draft. The database keeps it. */
export function unloadDrafts() {
  clearMemory();
  publishedText.clear();
  publishedImage.clear();
  departed.clear();
  db = memoryDraftDb;
}

/* ── Text and links ── */

export function draftText(key: string): string | undefined {
  return texts.get(key)?.value;
}

export function setDraftText(key: string, value: string, published: string) {
  if (value === (publishedText.get(key) ?? published)) {
    if (!texts.delete(key)) return;
    persist(`text:${key}`, undefined);
  } else {
    const record = { value, at: Date.now() };
    texts.set(key, record);
    persist(`text:${key}`, record);
  }
  emit();
}

/* ── Photo slots ── */

export function draftPhoto(slot: string): PhotoDraft | undefined {
  return photos.get(slot);
}

export function setDraftPhoto(slot: string, file: File, width: number) {
  const old = photos.get(slot);
  if (old) URL.revokeObjectURL(old.url);
  const record: FileDraft = { blob: file, type: file.type, width, at: Date.now() };
  photos.set(slot, { ...record, url: URL.createObjectURL(file) });
  persist(`photo:${slot}`, record);
  emit();
}

/* ── After Publish ── */

/*
  Fields stay editable while Publish runs. A draft is cleared only when it
  still holds what was sent, so a change made during Publish stays a draft.
*/
export function markTextPublished(key: string, sent: string, stored: string) {
  publishedText.set(key, stored);
  if (texts.get(key)?.value !== sent) return;
  texts.delete(key);
  persist(`text:${key}`, undefined);
}

export function markPhotoPublished(slot: string, sent: Blob, src: string | null, alt: string) {
  publishedImage.set(slot, { src, alt });
  const current = photos.get(slot);
  if (!current || current.blob !== sent) return;
  URL.revokeObjectURL(current.url);
  photos.delete(slot);
  persist(`photo:${slot}`, undefined);
}

export function publishDone() {
  emit();
  setEditSnapshot({ refresh: getEditSnapshot().refresh + 1 });
}

/* ── The overlay the provider and the query hook read through ── */

export function overlayText(key: string, published: string): string {
  return texts.get(key)?.value ?? publishedText.get(key) ?? published;
}

export function overlayImage<I extends { src: string | null | undefined; alt: string }>(
  slot: string,
  published: I
): I {
  const draft = photos.get(slot);
  if (draft) return { ...published, src: draft.url };
  const live = publishedImage.get(slot);
  return live ? { ...published, ...live } : published;
}

/* ── Counting ── */

function listChangeCount(d: StoredListDraft): number {
  return (
    Object.keys(d.added).length +
    Object.keys(d.updates).filter((id) => !d.removed.includes(id)).length +
    d.removed.length +
    (d.order ? 1 : 0)
  );
}

/** The number on the bar and on the Publish and Discard buttons. */
export function changeCount(): number {
  let n = texts.size + photos.size + files.size + areas.size;
  lists.forEach((d) => (n += listChangeCount(d)));
  return n;
}

export function pendingTexts(): Array<[string, string]> {
  return [...texts].map(([k, t]) => [k, t.value]);
}

export function pendingPhotos(): Array<[string, PhotoDraft]> {
  return [...photos];
}

export async function discardAll() {
  clearMemory();
  await db.clear().catch(() => {});
  emit();
}

/* ── Lists ── */

const emptyList = (): StoredListDraft => ({ added: {}, updates: {}, order: null, removed: [], updatedAt: 0 });

function saveList(table: ListTable, d: StoredListDraft) {
  if (listChangeCount(d) === 0) {
    lists.delete(table);
    persist(`list:${table}`, undefined);
  } else {
    lists.set(table, d);
    persist(`list:${table}`, d);
  }
  if (table === 'executives') pruneAreas();
}

function editList(table: ListTable, change: (d: StoredListDraft) => void) {
  const d = structuredClone(lists.get(table) ?? emptyList());
  change(d);
  d.updatedAt = Date.now();
  saveList(table, d);
  emit();
}

function currentOrder(table: ListTable, d: StoredListDraft): string[] {
  return d.order ?? [...(seenIds.get(table) ?? []), ...Object.keys(d.added)];
}

function dropFiles(table: ListTable, id: string) {
  const f = [...files.keys()].filter((k) => k.startsWith(`${table}:${id}:`));
  f.forEach((k) => {
    URL.revokeObjectURL(files.get(k)!.url);
    files.delete(k);
    persist(`file:${k}`, undefined);
  });
}

/* A move is stored as the full order, and cleared when it puts every row
   back where the database has it. */
function placeAt(table: ListTable, d: StoredListDraft, id: string, place: (order: string[]) => number) {
  const order = currentOrder(table, d).filter((x) => x !== id);
  order.splice(Math.max(0, Math.min(place(order), order.length)), 0, id);
  const published = seenIds.get(table) ?? [];
  const unchanged =
    Object.keys(d.added).length === 0 &&
    order.length === published.length &&
    order.every((x, i) => x === published[i]);
  d.order = unchanged ? null : order;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/* A patch on a published row keeps only the fields that differ from the
   published row, so typing a value back the way it was is no change. */
function patchPublished(table: ListTable, d: StoredListDraft, id: string, patch: Record<string, unknown>) {
  const published = seenRows.get(table)?.get(id) ?? {};
  const next = { ...d.updates[id], ...patch };
  for (const k of Object.keys(next)) if (k in published && same(next[k], published[k])) delete next[k];
  if (Object.keys(next).length) d.updates[id] = next;
  else delete d.updates[id];
}

export function listApi(table: ListTable): ListDraftApi {
  const vis = LIST_VISIBILITY_COLUMN[table];
  const isAdded = (id: string) => id.startsWith(DRAFT_ID_PREFIX);

  return {
    add: (fields, index) => {
      const id = `${DRAFT_ID_PREFIX}${crypto.randomUUID()}`;
      editList(table, (d) => {
        const order = currentOrder(table, d);
        d.added[id] = { ...fields, id };
        if (index !== undefined) {
          order.splice(Math.max(0, Math.min(index, order.length)), 0, id);
          d.order = order;
        } else if (d.order) {
          d.order.push(id);
        }
      });
      return id;
    },
    update: (id, patch) =>
      editList(table, (d) => {
        if (isAdded(id)) d.added[id] = { ...d.added[id], ...patch, id };
        else patchPublished(table, d, id, patch);
      }),
    move: (id, index) => editList(table, (d) => placeAt(table, d, id, () => index)),
    moveNextTo: (id, targetId, after) =>
      editList(table, (d) =>
        placeAt(table, d, id, (order) => {
          const i = order.indexOf(targetId);
          return i === -1 ? order.length : after ? i + 1 : i;
        })
      ),
    hide: (id, hidden) =>
      editList(table, (d) => {
        if (isAdded(id)) d.added[id] = { ...d.added[id], [vis]: !hidden };
        else patchPublished(table, d, id, { [vis]: !hidden });
      }),
    remove: (id) =>
      editList(table, (d) => {
        if (isAdded(id)) {
          delete d.added[id];
          if (d.order) d.order = d.order.filter((x) => x !== id);
          dropFiles(table, id);
        } else if (!d.removed.includes(id)) {
          d.removed.push(id);
        }
      }),
    keep: (id) => editList(table, (d) => (d.removed = d.removed.filter((x) => x !== id))),
    state: (id): ListRowState => {
      const d = lists.get(table);
      const hasFile = [...files.keys()].some((k) => k.startsWith(`${table}:${id}:`));
      if (!d) return hasFile ? 'changed' : null;
      if (d.removed.includes(id)) return 'removing';
      if (isAdded(id)) return 'added';
      return d.updates[id] || hasFile ? 'changed' : null;
    },
    setFile: async (id, column, file) => {
      const key = `${table}:${id}:${column}`;
      const width = await new Promise<number>((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img.naturalWidth);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(0);
        };
        img.src = url;
      });
      const old = files.get(key);
      if (old) URL.revokeObjectURL(old.url);
      const record: FileDraft = { blob: file, type: file.type, width, at: Date.now() };
      files.set(key, { ...record, url: URL.createObjectURL(file) });
      persist(`file:${key}`, record);
      emit();
    },
    fileUrl: (id, column) => files.get(`${table}:${id}:${column}`)?.url ?? null,
  };
}

/**
 * Drafted rows over fetched ones. Editing keeps removed and hidden rows in
 * place so their chips show; Preview leaves them out, as a visitor's page
 * would.
 */
export function overlayRows<T>(table: string, rows: T[]): T[] {
  if (!(table in LIST_VISIBILITY_COLUMN)) return rows;
  const t = table as ListTable;
  const withIds = (rows as Array<T & { id?: string }>).filter(
    (r) => typeof r.id === 'string' && !departed.has(r.id)
  );
  seenIds.set(t, withIds.map((r) => r.id!));
  seenRows.set(t, new Map(withIds.map((r) => [r.id!, r as Record<string, unknown>])));
  const preview = getEditSnapshot().status === 'preview';
  const vis = LIST_VISIBILITY_COLUMN[t];
  const d = lists.get(t);
  /* With no draft for the table nothing is removed, but published rows can
     still be hidden, and Preview leaves those out too. */
  if (!d) return preview ? withIds.filter((r) => (r as Record<string, unknown>)[vis] !== false) : withIds;

  const byId = new Map<string, T>();
  for (const r of withIds) byId.set(r.id!, d.updates[r.id!] ? ({ ...r, ...d.updates[r.id!] } as T) : r);
  for (const [id, fields] of Object.entries(d.added)) byId.set(id, fields as T);

  const order = currentOrder(t, d).filter((id) => byId.has(id));
  for (const id of byId.keys()) if (!order.includes(id)) order.push(id);

  return order
    .map((id) => byId.get(id)!)
    .filter((r) => {
      if (!preview) return true;
      const row = r as Record<string, unknown>;
      return !d.removed.includes(String(row.id)) && row[vis] !== false;
    });
}

/** One row as the editor sees it now: the published row with its patch, or the added row. */
export function currentRow(table: ListTable, id: string): Record<string, unknown> | null {
  const d = lists.get(table);
  if (id.startsWith(DRAFT_ID_PREFIX)) return d?.added[id] ?? null;
  const published = seenRows.get(table)?.get(id);
  if (!published) return null;
  return d?.updates[id] ? { ...published, ...d.updates[id] } : published;
}

/* ── Areas typed in with Add an area ── */

const AREA_PREFIX = `${DRAFT_ID_PREFIX}area-`;

function persistAreas() {
  persist('areas:new', areas.size ? Object.fromEntries(areas) : undefined);
}

/** Areas added in this draft, for the area select. */
export function draftAreas(): Array<{ id: string; name: string }> {
  return [...areas].map(([id, a]) => ({ id, name: a.name }));
}

/** Adds an area to the draft and returns its draft id. The row is written on Publish. */
export function addDraftArea(name: string): string {
  const id = `${AREA_PREFIX}${crypto.randomUUID()}`;
  areas.set(id, { name, at: Date.now() });
  persistAreas();
  emit();
  return id;
}

/* An area nobody in the draft points at is dropped, so picking it and
   then picking another area leaves no change behind. */
function pruneAreas() {
  if (!areas.size) return;
  const d = lists.get('executives');
  const used = new Set<unknown>();
  if (d) {
    Object.values(d.added).forEach((r) => used.add(r.area_id));
    Object.values(d.updates).forEach((r) => used.add(r.area_id));
  }
  let dropped = false;
  for (const id of [...areas.keys()]) {
    if (!used.has(id)) {
      areas.delete(id);
      dropped = true;
    }
  }
  if (dropped) persistAreas();
}

/* ── Publishing lists ── */

/* ── The changes list on the bar ── */

/** One column of a published row that the draft changes. */
export interface FieldChange {
  column: string;
  from: unknown;
  to: unknown;
}

/** One entry of the bar's changes list, newest first. */
export type Change =
  | { kind: 'text'; key: string; to: string; at: number }
  | { kind: 'photo'; slot: string; at: number }
  | { kind: 'area'; name: string; at: number }
  | { kind: 'added'; table: ListTable; id: string; row: Record<string, unknown>; at: number }
  | { kind: 'changed'; table: ListTable; id: string; row: Record<string, unknown>; fields: FieldChange[]; at: number }
  | { kind: 'removed'; table: ListTable; id: string; row: Record<string, unknown>; at: number }
  | { kind: 'order'; table: ListTable; at: number }
  | { kind: 'file'; table: ListTable; id: string; column: string; row: Record<string, unknown>; at: number };

/**
 * Every unpublished change, for the bar's list. Text entries carry the
 * draft value only; the bar reads the published value from the site
 * content provider. A row's changed columns carry the published value
 * and the draft value. display_order is left out: a move is one Order
 * changed entry per list.
 */
export function changeList(): Change[] {
  const out: Change[] = [];
  texts.forEach((t, key) => out.push({ kind: 'text', key, to: t.value, at: t.at }));
  photos.forEach((p, slot) => out.push({ kind: 'photo', slot, at: p.at }));
  areas.forEach((a) => out.push({ kind: 'area', name: a.name, at: a.at }));
  lists.forEach((d, table) => {
    const seen = seenRows.get(table);
    Object.entries(d.added).forEach(([id, row]) => out.push({ kind: 'added', table, id, row, at: d.updatedAt }));
    Object.entries(d.updates).forEach(([id, patch]) => {
      if (d.removed.includes(id)) return;
      const published = seen?.get(id) ?? {};
      const fields = Object.entries(patch)
        .filter(([column]) => column !== 'display_order')
        .map(([column, to]) => ({ column, from: published[column], to }));
      if (fields.length) {
        out.push({ kind: 'changed', table, id, row: { ...published, ...patch }, fields, at: d.updatedAt });
      }
    });
    d.removed.forEach((id) => out.push({ kind: 'removed', table, id, row: seen?.get(id) ?? {}, at: d.updatedAt }));
    if (d.order) out.push({ kind: 'order', table, at: d.updatedAt });
  });
  files.forEach((f, k) => {
    const [table, id, column] = k.split(':') as [ListTable, string, string];
    if (id.startsWith(DRAFT_ID_PREFIX)) return;
    out.push({ kind: 'file', table, id, column, row: currentRow(table, id) ?? {}, at: f.at });
  });
  return out.sort((a, b) => b.at - a.at);
}

export function pendingAreas(): Array<{ id: string; name: string }> {
  return draftAreas();
}

export function pendingLists(): Array<[ListTable, StoredListDraft]> {
  return [...lists].map(([t, d]) => [t, structuredClone(d)]);
}

/** Drafted files for one row: column to blob. */
export function pendingRowFiles(table: ListTable, id: string): Array<{ column: string; blob: Blob; type: string }> {
  const prefix = `${table}:${id}:`;
  return [...files]
    .filter(([k]) => k.startsWith(prefix))
    .map(([k, f]) => ({ column: k.slice(prefix.length), blob: f.blob, type: f.type }));
}

/** Ids of the rows with a drafted file and no other change. */
export function fileOnlyRows(table: ListTable): string[] {
  const d = lists.get(table);
  const ids = new Set<string>();
  for (const k of files.keys()) {
    const [t, id] = k.split(':');
    if (t !== table || id.startsWith(DRAFT_ID_PREFIX)) continue;
    if (d && (d.updates[id] || d.removed.includes(id))) continue;
    ids.add(id);
  }
  return [...ids];
}

/**
 * The display_order each row needs after Publish. After a move every row
 * is numbered in tens in the draft order, and only rows whose number
 * changes are returned. With no move, added rows go after the last row.
 */
export function orderTargets(table: ListTable, d: StoredListDraft, idFor: (id: string) => string): Map<string, number> {
  const seen = new Map<string, number>();
  seenRows.get(table)?.forEach((r, id) => {
    if (typeof r.display_order === 'number') seen.set(id, r.display_order);
  });
  const out = new Map<string, number>();
  const live = (id: string) => !d.removed.includes(id);
  if (d.order) {
    d.order.filter(live).forEach((id, i) => {
      const n = (i + 1) * 10;
      if (seen.get(id) !== n) out.set(idFor(id), n);
    });
    return out;
  }
  let last = Math.max(0, ...seen.values());
  for (const id of Object.keys(d.added)) out.set(idFor(id), (last += 10));
  return out;
}

/* Each mark below clears only what was sent, so a change typed while
   Publish runs stays in the draft. */

export function markAreaPublished(draftId: string, sentName: string, realId: string) {
  const d = lists.get('executives');
  if (d) {
    const next = structuredClone(d);
    for (const r of [...Object.values(next.added), ...Object.values(next.updates)]) {
      if (r.area_id === draftId) r.area_id = realId;
    }
    lists.set('executives', next);
    persist('list:executives', next);
  }
  if (areas.get(draftId)?.name === sentName) areas.delete(draftId);
  persistAreas();
}

export function markInserted(table: ListTable, draftId: string, sent: Record<string, unknown>, realId: string) {
  const d = lists.get(table);
  if (!d) return;
  const next = structuredClone(d);
  const current = next.added[draftId];
  delete next.added[draftId];
  if (current) {
    const left = Object.fromEntries(
      Object.entries(current).filter(([k, v]) => k !== 'id' && !same(v, sent[k]))
    );
    if (Object.keys(left).length) next.updates[realId] = left;
  }
  if (next.order) next.order = next.order.map((x) => (x === draftId ? realId : x));
  saveList(table, next);
}

export function markUpdated(table: ListTable, id: string, sent: Record<string, unknown>) {
  const d = lists.get(table);
  if (!d?.updates[id]) return;
  const next = structuredClone(d);
  for (const [k, v] of Object.entries(sent)) {
    if (same(next.updates[id][k], v)) delete next.updates[id][k];
  }
  if (!Object.keys(next.updates[id]).length) delete next.updates[id];
  saveList(table, next);
}

export function markOrderPublished(table: ListTable, sent: string[]) {
  const d = lists.get(table);
  if (!d?.order || !same(d.order, sent)) return;
  saveList(table, { ...structuredClone(d), order: null });
}

export function markRemoved(table: ListTable, id: string) {
  departed.add(id);
  /* Before the list check: a row deleted elsewhere may have only a file. */
  dropFiles(table, id);
  const d = lists.get(table);
  if (!d) return;
  const next = structuredClone(d);
  next.removed = next.removed.filter((x) => x !== id);
  delete next.updates[id];
  if (next.order) next.order = next.order.filter((x) => x !== id);
  saveList(table, next);
}

export function markFilePublished(table: ListTable, id: string, column: string, sent: Blob, nowId = id) {
  const key = `${table}:${id}:${column}`;
  const current = files.get(key);
  if (!current) return;
  if (current.blob === sent) {
    URL.revokeObjectURL(current.url);
    files.delete(key);
    persist(`file:${key}`, undefined);
  } else if (nowId !== id) {
    /* Replaced during Publish: keep the newer file on the row's real id. */
    files.delete(key);
    persist(`file:${key}`, undefined);
    const moved = `${table}:${nowId}:${column}`;
    files.set(moved, current);
    persist(`file:${moved}`, { blob: current.blob, type: current.type, width: current.width, at: current.at });
  }
}
