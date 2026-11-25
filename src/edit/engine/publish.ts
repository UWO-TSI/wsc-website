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
  keeps its draft, and the file uploaded for it is removed again.
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
  /** List writes. Without it (the edit lab) list changes stay in the draft. */
  lists?: ListPublisher;
}

export interface ListPublisher {
  /** Returns the new area's id. */
  insertArea: (name: string) => Promise<string>;
  /** Returns the new row's id. */
  insert: (table: ListTable, fields: Record<string, unknown>) => Promise<string>;
  update: (table: ListTable, id: string, patch: Record<string, unknown>) => Promise<void>;
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

export interface PublishResult {
  failed: number;
  expired: boolean;
}

const isExpired = (err: unknown) => {
  const e = err as { status?: number; code?: string; message?: string };
  return e?.status === 401 || e?.code === 'PGRST301' || /jwt/i.test(e?.message ?? '');
};

export async function publishDraft(
  p: Publisher,
  altFor: (slot: string) => string
): Promise<PublishResult> {
  if ((await p.session().catch(() => 'expired')) === 'expired') {
    return { failed: changeCount(), expired: true };
  }

  let expired = false;
  const fail = (err: unknown) => {
    if (isExpired(err)) expired = true;
  };

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
  const lists = p.lists ? listDrafts() : [];
  const rowUploads = p.lists ? await uploadRowFiles(p.lists, lists, fail) : new Map<string, RowUpload[]>();

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

  const unusedFiles = p.lists ? await writeLists(p.lists, lists, rowUploads, fail) : [];

  // 3. Deletes
  for (const name of unused) {
    await p.removeObject(name).catch((err: Error) => console.warn('Unused photo not removed:', err.message));
  }
  if (p.lists) {
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
  }

  publishDone();
  /* Whatever is still in the draft did not publish. */
  return { failed: changeCount(), expired };
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
  fail: (err: unknown) => void
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
        fail(err);
        dropUploads(draftId);
      }
    }

    /* Updates, including rows whose only change is a new file. */
    const updateIds = new Set([...Object.keys(d.updates), ...fileOnlyRows(table)]);
    for (const id of updateIds) {
      if (d.removed.includes(id)) continue;
      const files = filesFor(id);
      try {
        const patch = resolveArea(d.updates[id] ?? {});
        const sent = withFiles(id, patch);
        const old = spec && files.length ? await lp.fileOf(table, id, spec.column) : null;
        if (Object.keys(sent).length) await lp.update(table, id, sent);
        markUpdated(table, id, patch);
        files.forEach((f) => markFilePublished(table, id, f.column, f.blob));
        if (spec && old && !files.some((f) => f.name === old)) unused.push({ bucket: spec.bucket, name: old });
      } catch (err) {
        fail(err);
        dropUploads(id);
      }
    }

    /* Order, once every insert has its real id. An insert that failed
       keeps its draft id, so the order stays in the draft for next time. */
    if (d.order) {
      const order = d.order.map((id) => realIds.get(id) ?? id);
      const inserted = new Set(realIds.values());
      let ok = !order.some(isDraft);
      for (const [id, n] of orderTargets(table, { ...d, order }, (x) => x)) {
        if (isDraft(id) || inserted.has(id)) continue;
        try {
          await lp.update(table, id, { display_order: n });
        } catch (err) {
          ok = false;
          fail(err);
        }
      }
      if (ok) markOrderPublished(table, order);
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
      /* RLS answers a refused UPDATE with zero rows, not an error. */
      if (!data?.length) throw new Error(`${table}.${id} was not updated`);
    },
    fileOf: async (table, id, column) => {
      const { data, error } = await supabase.from(table).select(column).eq('id', id).maybeSingle();
      if (error) throw error;
      const name = (data as unknown as Record<string, unknown> | null)?.[column];
      return typeof name === 'string' && name ? name : null;
    },
    remove: async (table, id) => {
      const spec = LIST_FILES[table];
      const row: Record<string, unknown> = { id };
      if (spec) {
        const { data, error } = await supabase.from(table).select(spec.column).eq('id', id).maybeSingle();
        if (error) throw error;
        /* Already gone, from another tab: nothing to delete. */
        if (!data) return;
        row[spec.column] = (data as unknown as Record<string, unknown>)[spec.column];
      }
      await deleteContentItem(table, row, spec?.bucket ?? '', spec?.column ?? '');
    },
    upload: async (bucket, file) => (await uploadFile(bucket, file)).objectName,
    removeObject: (bucket, objectName) => deleteFile(bucket, objectName),
  },
};
