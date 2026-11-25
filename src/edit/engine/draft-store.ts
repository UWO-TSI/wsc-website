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
  clearMemory();
  const records = await db.all().catch(() => []);
  for (const { id, value } of records) {
    const [kind, ...rest] = id.split(':');
    const name = rest.join(':');
    if (kind === 'text') texts.set(name, value as TextDraft);
    if (kind === 'photo') {
      const v = value as FileDraft;
      photos.set(name, { ...v, url: URL.createObjectURL(v.blob) });
    }
    if (kind === 'file') {
      const v = value as FileDraft;
      files.set(name, { ...v, url: URL.createObjectURL(v.blob) });
    }
    if (kind === 'list') lists.set(name as ListTable, value as StoredListDraft);
  }
  emit();
}

function clearMemory() {
  photos.forEach((p) => URL.revokeObjectURL(p.url));
  files.forEach((f) => URL.revokeObjectURL(f.url));
  texts.clear();
  photos.clear();
  files.clear();
  lists.clear();
}

/** Closes the session's view of the draft. The database keeps it. */
export function unloadDrafts() {
  clearMemory();
  publishedText.clear();
  publishedImage.clear();
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

export function markTextPublished(key: string, value: string) {
  publishedText.set(key, value);
  texts.delete(key);
  persist(`text:${key}`, undefined);
}

export function markPhotoPublished(slot: string, src: string | null, alt: string) {
  publishedImage.set(slot, { src, alt });
  const old = photos.get(slot);
  if (old) URL.revokeObjectURL(old.url);
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
  let n = texts.size + photos.size + files.size;
  lists.forEach((d) => (n += listChangeCount(d)));
  return n;
}

/** When the newest draft change was made, for "Draft from earlier". */
export function lastChangeAt(): number | null {
  let at = 0;
  texts.forEach((t) => (at = Math.max(at, t.at)));
  photos.forEach((p) => (at = Math.max(at, p.at)));
  files.forEach((f) => (at = Math.max(at, f.at)));
  lists.forEach((l) => (at = Math.max(at, l.updatedAt)));
  return at || null;
}

export function pendingTexts(): Array<[string, string]> {
  return [...texts].map(([k, t]) => [k, t.value]);
}

export function pendingPhotos(): Array<[string, PhotoDraft]> {
  return [...photos];
}

/** Added executives with no name, which Publish refuses. */
export function missingNameIds(): string[] {
  const d = lists.get('executives');
  if (!d) return [];
  return Object.entries(d.added)
    .filter(([, row]) => !String(row.name ?? '').trim())
    .map(([id]) => id);
}

export async function discardAll() {
  clearMemory();
  await db.clear().catch(() => {});
  emit();
}

/* ── Lists ── */

const emptyList = (): StoredListDraft => ({ added: {}, updates: {}, order: null, removed: [], updatedAt: 0 });

function editList(table: ListTable, change: (d: StoredListDraft) => void) {
  const d = structuredClone(lists.get(table) ?? emptyList());
  change(d);
  d.updatedAt = Date.now();
  if (listChangeCount(d) === 0) {
    lists.delete(table);
    persist(`list:${table}`, undefined);
  } else {
    lists.set(table, d);
    persist(`list:${table}`, d);
  }
  emit();
}

function currentOrder(table: ListTable, d: StoredListDraft): string[] {
  return d.order ?? [...(seenIds.get(table) ?? []), ...Object.keys(d.added)];
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
        else d.updates[id] = { ...d.updates[id], ...patch };
      }),
    move: (id, index) =>
      editList(table, (d) => {
        const order = currentOrder(table, d).filter((x) => x !== id);
        order.splice(Math.max(0, Math.min(index, order.length)), 0, id);
        const published = seenIds.get(table) ?? [];
        const unchanged =
          Object.keys(d.added).length === 0 &&
          order.length === published.length &&
          order.every((x, i) => x === published[i]);
        d.order = unchanged ? null : order;
      }),
    hide: (id, hidden) =>
      editList(table, (d) => {
        if (isAdded(id)) d.added[id] = { ...d.added[id], [vis]: !hidden };
        else d.updates[id] = { ...d.updates[id], [vis]: !hidden };
      }),
    remove: (id) =>
      editList(table, (d) => {
        if (isAdded(id)) {
          delete d.added[id];
          if (d.order) d.order = d.order.filter((x) => x !== id);
          const f = [...files.keys()].filter((k) => k.startsWith(`${table}:${id}:`));
          f.forEach((k) => {
            URL.revokeObjectURL(files.get(k)!.url);
            files.delete(k);
            persist(`file:${k}`, undefined);
          });
        } else if (!d.removed.includes(id)) {
          d.removed.push(id);
        }
      }),
    keep: (id) => editList(table, (d) => (d.removed = d.removed.filter((x) => x !== id))),
    state: (id): ListRowState => {
      const d = lists.get(table);
      if (!d) return null;
      if (d.removed.includes(id)) return 'removing';
      if (isAdded(id)) return 'added';
      return d.updates[id] || [...files.keys()].some((k) => k.startsWith(`${table}:${id}:`))
        ? 'changed'
        : null;
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
  const withIds = rows as Array<T & { id?: string }>;
  seenIds.set(
    t,
    withIds.map((r) => r.id).filter((id): id is string => typeof id === 'string')
  );
  const d = lists.get(t);
  if (!d) return rows;

  const byId = new Map<string, T>();
  for (const r of withIds) {
    if (typeof r.id !== 'string') continue;
    byId.set(r.id, d.updates[r.id] ? ({ ...r, ...d.updates[r.id] } as T) : r);
  }
  for (const [id, fields] of Object.entries(d.added)) byId.set(id, fields as T);

  const order = currentOrder(t, d).filter((id) => byId.has(id));
  for (const id of byId.keys()) if (!order.includes(id)) order.push(id);

  const preview = getEditSnapshot().status === 'preview';
  const vis = LIST_VISIBILITY_COLUMN[t];
  return order
    .map((id) => byId.get(id)!)
    .filter((r) => {
      if (!preview) return true;
      const row = r as Record<string, unknown>;
      return !d.removed.includes(String(row.id)) && row[vis] !== false;
    });
}
