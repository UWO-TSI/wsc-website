import { supabase } from '@/lib/supabase/client';
import { deleteFile, getPublicUrl, uploadFile } from '@/lib/supabase/storage';
import { SITE_IMAGES_BUCKET } from '@/lib/image-slots';
import { deleteContentItem } from '@/lib/supabase/hooks/use-supabase-mutation';
import { DRAFT_ID_PREFIX, type ListTable, type StoredListDraft } from '@/edit/list-draft';
import {
  changeCount,
  fileOnlyRows,
  markAreaPublished,
  markFilePublished,
  markInserted,
  markOrderPublished,
  markPhotoPublished,
  markRemoved,
  markTextPublished,
  markUpdated,
  orderTargets,
  pendingAreas,
  pendingLists,
  pendingPhotos,
  pendingRowFiles,
  pendingTexts,
  publishDone,
  reloadDrafts,
} from '@/edit/engine/draft-store';

/*
  Publish writes every change in the draft, in three passes:

   1. Uploads. Each chosen photo goes to the site-images bucket under a new
      object name, and each drafted headshot or logo to its own bucket.
      Nothing points at them yet, so a failure here changes nothing a
      visitor sees.
   2. Rows. site_content gets UPDATE on `value` only, which is all the
      database grants an admin. site_images is pointed at the new object.
      Then the lists: areas typed in with Add an area first, because
      executives point at them; then each list's inserts, field updates
      (with the new object name in the file column) and display_order.
   3. Deletes, storage first, as deleteContentItem does. A removed row goes
      through deleteContentItem itself, which removes its file and then the
      row. A photo or file a row no longer points at is removed from its
      bucket. A failed cleanup leaves an unused file, never a row pointing
      at a missing one.

  The database stores object names only; the public URL is built with
  getPublicUrl when it is shown. A change that fails stays in the draft
  with its count, and the rest go live. A row whose insert or update fails
  keeps its draft, and the file uploaded for it is removed again. A change
  to a row that was already deleted (in another tab, or by another admin)
  is dropped from the draft and counted apart from the failures.

  Two tabs of one admin share one draft in IndexedDB, so Publish holds the
  'wsc-publish' lock and reads the draft again inside it: the second tab
  then sees what the first one published and does not insert it twice.
*/

export interface Publisher {
  /** 'expired' when there is no session at aal2 to write with. */
  session: () => Promise<'ok' | 'expired'>;
  /** Returns the value as stored, after the database normalises it. */
  updateText: (key: string, value: string) => Promise<string>;
  currentImage: (slot: string) => Promise<{ object_name: string; alt: string } | null>;
  upload: (file: File) => Promise<string>;
  pointImage: (slot: string, objectName: string, alt: string) => Promise<void>;
  removeObject: (objectName: string) => Promise<void>;
  publicUrl: (objectName: string) => string | null;
  lists: ListPublisher;
}

export interface ListPublisher {
  /** Returns the new area's id. */
  insertArea: (name: string) => Promise<string>;
  /** Returns the new row's id. */
  insert: (table: ListTable, fields: Record<string, unknown>) => Promise<string>;
  /** 'gone' when the row no longer exists. */
  update: (table: ListTable, id: string, patch: Record<string, unknown>) => Promise<'ok' | 'gone'>;
  /** The object name in a row's file column, or null. */
  fileOf: (table: ListTable, id: string, column: string) => Promise<string | null>;
  /** The row's file, then the row: deleteContentItem. */
  remove: (table: ListTable, id: string) => Promise<void>;
  upload: (bucket: string, file: File) => Promise<string>;
  removeObject: (bucket: string, objectName: string) => Promise<void>;
}

/** The bucket and column of each list's file, where it has one. */
export const LIST_FILES: Partial<Record<ListTable, { bucket: string; column: string }>> = {
  executives: { bucket: 'headshots', column: 'headshot_path' },
  sponsors: { bucket: 'sponsor-logos', column: 'logo_path' },
};

/*
  The field that names a row in each list: an executive's name, an event's
  title, a partner's name, a figure's label. A new row without it, or a
  published row whose name was cleared, blocks Publish (spec section 3,
  Lists; the column is NOT NULL), so the bar checks missingName() before it
  calls publishDraft.
*/
export const NAME_FIELD: Record<ListTable, string> = {
  executives: 'name',
  events: 'title',
  sponsors: 'name',
  site_stats: 'label',
};

/** The first row whose name field is empty, or null when every row has one. */
export function missingName(): { table: ListTable; id: string; field: string; added: boolean } | null {
  const empty = (v: unknown) => !String(v ?? '').trim();
  for (const [table, d] of pendingLists()) {
    const field = NAME_FIELD[table];
    const added = Object.keys(d.added).find((rowId) => empty(d.added[rowId][field]));
    if (added) return { table, id: added, field, added: true };
    const cleared = Object.keys(d.updates).find(
      (rowId) => !d.removed.includes(rowId) && field in d.updates[rowId] && empty(d.updates[rowId][field])
    );
    if (cleared) return { table, id: cleared, field, added: false };
  }
  return null;
}

export interface PublishResult {
  /** Changes that were sent and did not publish. */
  failed: number;
  /** Changes dropped because their row was already deleted elsewhere. */
  gone: number;
  expired: boolean;
}

const isExpired = (err: unknown) => {
  const e = err as { status?: number; code?: string; message?: string };
  return e?.status === 401 || e?.code === 'PGRST301' || /jwt/i.test(e?.message ?? '');
};

/** Publishes under the 'wsc-publish' lock where the browser has one. */
export async function publishDraft(p: Publisher, altFor: (slot: string) => string): Promise<PublishResult> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  if (!locks) return publishUnlocked(p, altFor);
  return locks.request('wsc-publish', async () => {
    await reloadDrafts();
    return publishUnlocked(p, altFor);
  });
}

async function publishUnlocked(p: Publisher, altFor: (slot: string) => string): Promise<PublishResult> {
  if ((await p.session().catch(() => 'expired')) === 'expired') {
    return { failed: changeCount(), gone: 0, expired: true };
  }

  let expired = false;
  /* Each call is one change that stays in the draft; `n` is 0 when the
     change is counted elsewhere. Changes typed while Publish runs were
     never sent, so they are not counted. */
  let failed = 0;
  const fail = (err: unknown, n = 1) => {
    failed += n;
    if (isExpired(err)) expired = true;
  };
  const gone = { n: 0 };

  // 1. Uploads
  const uploads: Array<{ slot: string; blob: Blob; name: string; old: { object_name: string; alt: string } | null }> = [];
  for (const [slot, d] of pendingPhotos()) {
    try {
      const old = await p.currentImage(slot);
      const name = await p.upload(new File([d.blob], slot, { type: d.type }));
      uploads.push({ slot, blob: d.blob, name, old });
    } catch (err) {
      fail(err);
    }
  }
  const lists = listDrafts();
  const rowUploads = await uploadRowFiles(p.lists, lists, fail);

  // 2. Rows
  const texts = await Promise.allSettled(
    pendingTexts().map(async ([key, value]) => markTextPublished(key, value, await p.updateText(key, value)))
  );
  texts.forEach((r) => r.status === 'rejected' && fail(r.reason));

  const unused: string[] = [];
  for (const u of uploads) {
    const alt = u.old?.alt || altFor(u.slot);
    try {
      await p.pointImage(u.slot, u.name, alt);
      markPhotoPublished(u.slot, u.blob, p.publicUrl(u.name), alt);
      if (u.old && u.old.object_name !== u.name) unused.push(u.old.object_name);
    } catch (err) {
      fail(err);
      unused.push(u.name);
    }
  }

  const unusedFiles = await writeLists(p.lists, lists, rowUploads, fail, gone);

  // 3. Deletes
  for (const name of unused) {
    await p.removeObject(name).catch((err: Error) => console.warn('Unused photo not removed:', err.message));
  }
  for (const [table, d] of lists) {
    for (const id of d.removed) {
      try {
        await p.lists.remove(table, id);
        markRemoved(table, id);
      } catch (err) {
        fail(err);
      }
    }
  }
  for (const { bucket, name } of unusedFiles) {
    await p.lists.removeObject(bucket, name).catch((err: Error) =>
      console.warn('Unused file not removed:', err.message)
    );
  }

  publishDone();
  return { failed, gone: gone.n, expired };
}

/* ── Lists ── */

type ListDrafts = Array<[ListTable, StoredListDraft]>;
interface RowUpload {
  column: string;
  blob: Blob;
  name: string;
}

const isDraft = (id: string) => id.startsWith(DRAFT_ID_PREFIX);
const fieldsOf = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).filter(([k]) => k !== 'id'));

/** Every list with a change, including one whose only change is a new file. */
function listDrafts(): ListDrafts {
  const out = pendingLists();
  for (const table of Object.keys(LIST_FILES) as ListTable[]) {
    if (!out.some(([t]) => t === table) && fileOnlyRows(table).length) {
      out.push([table, { added: {}, updates: {}, order: null, removed: [], updatedAt: 0 }]);
    }
  }
  return out;
}

async function uploadRowFiles(lp: ListPublisher, lists: ListDrafts, fail: (err: unknown) => void) {
  const out = new Map<string, RowUpload[]>();
  for (const [table, d] of lists) {
    const spec = LIST_FILES[table];
    if (!spec) continue;
    const ids = new Set([...Object.keys(d.added), ...Object.keys(d.updates), ...fileOnlyRows(table)]);
    for (const id of ids) {
      if (d.removed.includes(id)) continue;
      const sent: RowUpload[] = [];
      for (const f of pendingRowFiles(table, id)) {
        try {
          const name = await lp.upload(spec.bucket, new File([f.blob], f.column, { type: f.type }));
          sent.push({ column: f.column, blob: f.blob, name });
        } catch (err) {
          fail(err);
        }
      }
      if (sent.length) out.set(`${table}:${id}`, sent);
    }
  }
  return out;
}

/*
  The row pass for lists: areas, then per list its inserts, updates and
  order. Returns the files nothing points at any more, for the delete pass.
*/
async function writeLists(
  lp: ListPublisher,
  lists: ListDrafts,
  rowUploads: Map<string, RowUpload[]>,
  fail: (err: unknown, n?: number) => void,
  gone: { n: number }
): Promise<Array<{ bucket: string; name: string }>> {
  const unused: Array<{ bucket: string; name: string }> = [];

  const areaIds = new Map<string, string>();
  for (const a of pendingAreas()) {
    try {
      const id = await lp.insertArea(a.name);
      areaIds.set(a.id, id);
      markAreaPublished(a.id, a.name, id);
    } catch (err) {
      fail(err);
    }
  }
  /* A row that points at an area which did not publish cannot publish either. */
  const resolveArea = (fields: Record<string, unknown>) => {
    const area = fields.area_id;
    if (typeof area !== 'string' || !isDraft(area)) return fields;
    const real = areaIds.get(area);
    if (!real) throw new Error('The new area did not publish');
    return { ...fields, area_id: real };
  };

  for (const [table, d] of lists) {
    const spec = LIST_FILES[table];
    const filesFor = (id: string) => rowUploads.get(`${table}:${id}`) ?? [];
    const withFiles = (id: string, fields: Record<string, unknown>) => ({
      ...fields,
      ...Object.fromEntries(filesFor(id).map((f) => [f.column, f.name])),
    });
    const dropUploads = (id: string) => {
      if (spec) filesFor(id).forEach((f) => unused.push({ bucket: spec.bucket, name: f.name }));
    };

    /* Inserts, each with its display_order. */
    const realIds = new Map<string, string>();
    const firstOrder = orderTargets(table, d, (id) => id);
    for (const [draftId, row] of Object.entries(d.added)) {
      try {
        /* Resolved before the write, and compared resolved afterwards: the
           area pass has already pointed the draft at the area's real id. */
        const fields = resolveArea(fieldsOf(row));
        const sent = withFiles(draftId, fields);
        const n = firstOrder.get(draftId);
        const id = await lp.insert(table, n === undefined ? sent : { ...sent, display_order: n });
        realIds.set(draftId, id);
        markInserted(table, draftId, fields, id);
        filesFor(draftId).forEach((f) => markFilePublished(table, draftId, f.column, f.blob, id));
      } catch (err) {
        /* The row and each of its drafted files stay in the draft. */
        fail(err, 1 + filesFor(draftId).length);
        dropUploads(draftId);
      }
    }

    /* Updates, including rows whose only change is a new file. */
    const updateIds = new Set([...Object.keys(d.updates), ...fileOnlyRows(table)]);
    const goneIds = new Set<string>();
    /* A row deleted elsewhere: its patch and files leave the draft, and the
       files just uploaded for it are removed again. */
    const dropGone = (id: string, changes: number) => {
      goneIds.add(id);
      gone.n += changes;
      markRemoved(table, id);
      dropUploads(id);
    };
    for (const id of updateIds) {
      if (d.removed.includes(id)) continue;
      const files = filesFor(id);
      /* The patch and each drafted file are one change each. */
      const changes = (d.updates[id] ? 1 : 0) + files.length;
      try {
        const patch = resolveArea(d.updates[id] ?? {});
        const sent = withFiles(id, patch);
        const old = spec && files.length ? await lp.fileOf(table, id, spec.column) : null;
        if (Object.keys(sent).length && (await lp.update(table, id, sent)) === 'gone') {
          dropGone(id, changes);
          continue;
        }
        markUpdated(table, id, patch);
        files.forEach((f) => markFilePublished(table, id, f.column, f.blob));
        if (spec && old && !files.some((f) => f.name === old)) unused.push({ bucket: spec.bucket, name: old });
      } catch (err) {
        fail(err, changes);
        dropUploads(id);
      }
    }

    /* Order, once every insert has its real id. An insert that failed
       keeps its draft id, so the order stays in the draft for next time. */
    if (d.order) {
      let order = d.order.map((id) => realIds.get(id) ?? id);
      const inserted = new Set(realIds.values());
      let ok = !order.some(isDraft);
      for (const [id, n] of orderTargets(table, { ...d, order }, (x) => x)) {
        if (isDraft(id) || inserted.has(id) || goneIds.has(id)) continue;
        try {
          if ((await lp.update(table, id, { display_order: n })) === 'gone') dropGone(id, 0);
        } catch (err) {
          ok = false;
          /* The order is one change, counted once below. */
          fail(err, 0);
        }
      }
      /* markRemoved took the deleted rows out of the draft's order. */
      order = order.filter((id) => !goneIds.has(id));
      if (ok) markOrderPublished(table, order);
      else fail(null);
    }
  }
  return unused;
}

/** Writes to the project the site reads from, as the signed-in admin. */
export const supabasePublisher: Publisher = {
  session: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return 'expired';
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return aal?.currentLevel === 'aal2' ? 'ok' : 'expired';
  },
  updateText: async (key, value) => {
    const { data, error } = await supabase
      .from('site_content')
      .update({ value })
      .eq('key', key)
      .select('value');
    if (error) throw error;
    /* RLS answers a refused UPDATE with zero rows, not an error. */
    if (!data?.length) throw new Error(`site_content.${key} was not updated`);
    return (data[0] as { value: string }).value;
  },
  currentImage: async (slot) => {
    const { data, error } = await supabase
      .from('site_images')
      .select('object_name,alt')
      .eq('slot', slot)
      .maybeSingle();
    if (error) throw error;
    return data as { object_name: string; alt: string } | null;
  },
  upload: async (file) => (await uploadFile(SITE_IMAGES_BUCKET, file)).objectName,
  pointImage: async (slot, objectName, alt) => {
    const { error } = await supabase
      .from('site_images')
      .upsert({ slot, object_name: objectName, alt }, { onConflict: 'slot' });
    if (error) throw error;
  },
  removeObject: (objectName) => deleteFile(SITE_IMAGES_BUCKET, objectName),
  publicUrl: (objectName) => getPublicUrl(SITE_IMAGES_BUCKET, objectName),
  lists: {
    insertArea: async (name) => {
      const { data, error } = await supabase.from('exec_areas').insert({ name }).select('id').single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    insert: async (table, fields) => {
      const { data, error } = await supabase.from(table).insert(fields).select('id').single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    update: async (table, id, patch) => {
      const { data, error } = await supabase.from(table).update(patch).eq('id', id).select('id');
      if (error) throw error;
      if (data?.length) return 'ok';
      /* RLS answers a refused UPDATE with zero rows, not an error, and so
         does a row that is gone. An admin at aal2 can read every row, so a
         row that cannot be read was deleted. */
      const { data: row, error: readError } = await supabase.from(table).select('id').eq('id', id).maybeSingle();
      if (readError) throw readError;
      if (!row) return 'gone';
      throw new Error(`${table}.${id} was not updated`);
    },
    fileOf: async (table, id, column) => {
      const { data, error } = await supabase.from(table).select(column).eq('id', id).maybeSingle();
      if (error) throw error;
      const name = (data as unknown as Record<string, unknown> | null)?.[column];
      return typeof name === 'string' && name ? name : null;
    },
    remove: async (table, id) => {
      const spec = LIST_FILES[table];
      const { data, error } = await supabase
        .from(table)
        .select(spec ? `id,${spec.column}` : 'id')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      /* Already gone, from another tab: nothing to delete. deleteContentItem
         treats a delete of zero rows as refused, so this check comes first. */
      if (!data) return;
      const row: Record<string, unknown> = { id };
      if (spec) row[spec.column] = (data as unknown as Record<string, unknown>)[spec.column];
      await deleteContentItem(table, row, spec?.bucket ?? '', spec?.column ?? '');
    },
    upload: async (bucket, file) => (await uploadFile(bucket, file)).objectName,
    removeObject: (bucket, objectName) => deleteFile(bucket, objectName),
  },
};
