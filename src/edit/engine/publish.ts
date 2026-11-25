import { supabase } from '@/lib/supabase/client';
import { deleteFile, getPublicUrl, uploadFile } from '@/lib/supabase/storage';
import { SITE_IMAGES_BUCKET } from '@/lib/image-slots';
import {
  changeCount,
  markPhotoPublished,
  markTextPublished,
  pendingPhotos,
  pendingTexts,
  publishDone,
} from '@/edit/engine/draft-store';

/*
  Publish writes every change in the draft, in three passes:

   1. Uploads. Each chosen photo goes to the site-images bucket under a new
      object name. Nothing points at it yet, so a failure here changes
      nothing a visitor sees.
   2. Rows. site_content gets UPDATE on `value` only, which is all the
      database grants an admin. site_images is pointed at the new object.
   3. Deletes, storage first, as deleteContentItem does: the photo a row
      no longer points at is removed from the bucket. A failed cleanup
      leaves an unused file, never a row pointing at a missing one.

  The database stores object names only; the public URL is built with
  getPublicUrl when it is shown. A change that fails stays in the draft
  with its count, and the rest go live.

  List changes are counted but not written yet: the edit-lists work in
  phase 3 adds their passes (rows, then files, then removals) here. Until
  then they report as not published and stay in the draft.
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
}

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

  // 3. Deletes
  for (const name of unused) {
    await p.removeObject(name).catch((err: Error) => console.warn('Unused photo not removed:', err.message));
  }

  publishDone();
  /* Whatever is still in the draft did not publish: failed writes, and
     list changes (see the note at the top). */
  return { failed: changeCount(), expired };
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
};
