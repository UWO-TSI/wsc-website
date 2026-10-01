'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import { useSupabaseMutation } from '@/lib/supabase/hooks/use-supabase-mutation';
import { uploadFile, getPublicUrl } from '@/lib/supabase/storage';
import { LIMITS } from '@/lib/admin-config';
import { normalizeLine, validateField } from '@/lib/normalize';
import {
  IMAGE_SLOTS,
  IMAGE_SLOT_KEYS,
  SITE_IMAGES_BUCKET,
  type ImageSlot,
  type ImageSlotKey,
} from '@/lib/image-slots';
import type { SiteImage } from '@/types/database';
import { FIELD_ERROR_RING, FIELD_WELL } from '@/components/contact/field';
import Slab from '@/components/ui/slab';
import Button from '@/components/ui/button';
import Chip from '@/components/ui/chip';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';
import CharCount from './char-count';

/*
  Images: every photo slot on the public site, by page.

  The preview IS the slot's frame: same aspect class, same object-fit:
  cover. A panorama dropped into the 3/4 events portrait shows here exactly
  as it will on the site, scaled up and cropped at the sides, before
  anything is saved. The stored file is the original; cropping stays the
  frame's job, so a later layout change does not inherit a crop made for
  an old frame.

  Resolution: below the slot's minWidth the photo will look soft, so the
  editor is warned and can still save. Below half of it the photo would be
  visibly blurry at any size, and is refused.

  Replacing: upload the new file, point the row at it, then remove the old
  file. Emptying: delete the row first, then the file. Either way a failure
  part-way leaves at worst an orphaned file in the bucket, never a row
  pointing at a file that is gone, which would show a broken image.
*/

const ALT_MAX = 120;
const PAGES = ['Home', 'About', 'Events'] as const;

interface Pending {
  file: File;
  url: string;
  width: number;
  height: number;
}

function readDimensions(file: File): Promise<{ url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => resolve({ url, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that file as an image. Try a JPEG or PNG.'));
    };
    img.src = url;
  });
}

export default function AdminImages() {
  const { data: rows, loading, error, refetch } = useSupabaseQuery<SiteImage>('site_images', {
    orderBy: 'slot',
  });
  const [page, setPage] = useState<(typeof PAGES)[number]>('Home');

  const bySlot = useMemo(() => new Map(rows.map((r) => [r.slot, r])), [rows]);
  const slots = IMAGE_SLOT_KEYS.filter((key) => IMAGE_SLOTS[key].page === page);
  const filled = IMAGE_SLOT_KEYS.filter((key) => bySlot.has(key)).length;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="title-sm text-ink">Images</h2>
          <p className="meta text-ink-faint mt-1">
            {filled} / {IMAGE_SLOT_KEYS.length} slots filled. An empty slot shows a still
            placeholder at the same size.
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 flex-wrap" role="tablist" aria-label="Page">
        {PAGES.map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={page === p}
            onClick={() => setPage(p)}
            className={`label rounded-md px-3 py-2 cursor-pointer transition-colors duration-[var(--d-hover)] ease-enter ${
              page === p ? 'bg-accent-veil text-accent-ink' : 'text-ink-muted hover:text-ink hover:bg-sunken'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <AsyncStateWrapper loading={loading} error={error} data={IMAGE_SLOT_KEYS} onRetry={refetch}>
        <div className="flex flex-col gap-4">
          {slots.map((slot) => (
            <SlotEditor key={slot} slot={slot} row={bySlot.get(slot) ?? null} onSaved={refetch} />
          ))}
        </div>
      </AsyncStateWrapper>
    </div>
  );
}

function SlotEditor({
  slot,
  row,
  onSaved,
}: {
  slot: ImageSlotKey;
  row: SiteImage | null;
  onSaved: () => void;
}) {
  const def: ImageSlot = IMAGE_SLOTS[slot];
  const { mutate, loading: saving, error: mutError, reset } = useSupabaseMutation();

  const [pending, setPending] = useState<Pending | null>(null);
  const [alt, setAlt] = useState(row?.alt ?? def.alt);
  const [altTouched, setAltTouched] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  /* A refetch after save brings the stored alt back. */
  const [syncedAlt, setSyncedAlt] = useState(row?.alt);
  if (row?.alt !== syncedAlt) {
    setSyncedAlt(row?.alt);
    setAlt(row?.alt ?? def.alt);
  }

  useEffect(() => () => {
    if (pending) URL.revokeObjectURL(pending.url);
  }, [pending]);

  const currentUrl = row ? getPublicUrl(SITE_IMAGES_BUCKET, row.object_name) : null;
  const shown = pending?.url ?? currentUrl;

  const altError = validateField({ label: 'Description', required: true, maxLength: ALT_MAX }, alt);
  const lowRes = pending && pending.width < def.minWidth;
  const altChanged = !!row && normalizeLine(alt) !== row.alt;
  const dirty = !!pending || altChanged;

  const choose = async (file: File | undefined) => {
    setFileError(null);
    reset();
    if (!file) return;
    if (!LIMITS.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFileError('Use a JPEG, PNG, WebP or AVIF image.');
      return;
    }
    if (file.size > LIMITS.MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setFileError(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${LIMITS.MAX_IMAGE_SIZE_MB} MB; export it smaller.`);
      return;
    }
    try {
      const dims = await readDimensions(file);
      if (dims.width < def.minWidth / 2) {
        URL.revokeObjectURL(dims.url);
        setFileError(`That photo is ${dims.width}px wide. This slot needs at least ${Math.ceil(def.minWidth / 2)}px, ideally ${def.minWidth}px.`);
        return;
      }
      setPending({ file, ...dims });
    } catch (err) {
      setFileError((err as Error).message);
    }
  };

  const save = async () => {
    setAltTouched(true);
    if (altError || (!pending && !row)) return;
    try {
      await mutate(async () => {
        let objectName = row?.object_name;
        if (pending) {
          ({ objectName } = await uploadFile(SITE_IMAGES_BUCKET, pending.file));
        }
        const { error } = await supabase
          .from('site_images')
          .upsert({ slot, object_name: objectName, alt: normalizeLine(alt) }, { onConflict: 'slot' });
        if (error) throw error;

        if (pending && row?.object_name && row.object_name !== objectName) {
          const { error: delErr } = await supabase.storage.from(SITE_IMAGES_BUCKET).remove([row.object_name]);
          if (delErr) console.warn('Old file cleanup failed:', delErr.message);
        }
      });
      setPending(null);
      onSaved();
    } catch {
      // shown via mutError
    }
  };

  const empty = async () => {
    if (!row) return;
    try {
      await mutate(async () => {
        const { error } = await supabase.from('site_images').delete().eq('slot', slot);
        if (error) throw error;
        const { error: delErr } = await supabase.storage.from(SITE_IMAGES_BUCKET).remove([row.object_name]);
        if (delErr) console.warn('File cleanup failed:', delErr.message);
      });
      setConfirmEmpty(false);
      setPending(null);
      onSaved();
    } catch {
      // shown via mutError
    }
  };

  const inputId = `slot-${slot}`;

  return (
    <Slab tone="raised">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* The slot's own frame. Width is capped so a tall frame stays on screen. */}
        <div className={def.aspect < 1 ? 'max-w-[260px]' : ''}>
          <div className={`relative w-full overflow-hidden rounded-md ${def.aspectClass}`}>
            {shown ? (
              <Image
                src={shown}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                unoptimized={!!pending}
                className="object-cover"
              />
            ) : (
              <span className="skeleton absolute inset-0 rounded-[inherit]" aria-hidden="true" />
            )}
          </div>
          <p className="meta text-ink-faint mt-2">
            Frame {def.aspectClass.replace(/aspect-\[(\d+)\/(\d+)\]/, '$1:$2')}. What falls outside
            it is cropped on the site.
          </p>
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="label text-ink">
                {def.section}: {def.label}
              </p>
              <p className="meta text-ink-faint mt-1">{slot}</p>
            </div>
            <Chip status={pending ? 'warn' : row ? 'ok' : 'neutral'}>
              {pending ? 'Unsaved' : row ? 'Filled' : 'Empty'}
            </Chip>
          </div>

          {def.note && <p className="body-sm text-ink-muted">{def.note}</p>}

          <div>
            <input
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(e) => {
                choose(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <Button
              variant="secondary"
              onClick={() => document.getElementById(inputId)?.click()}
              disabled={saving}
            >
              {row || pending ? 'Choose a different photo' : 'Choose a photo'}
            </Button>
            <p className="meta text-ink-faint mt-2">
              JPEG, PNG, WebP or AVIF, up to {LIMITS.MAX_IMAGE_SIZE_MB} MB. At least {def.minWidth}px
              wide looks sharp here.
            </p>
            {pending && (
              <p className={`body-sm mt-2 ${lowRes ? 'text-warn' : 'text-ink-muted'}`}>
                {pending.width} x {pending.height}px.
                {lowRes ? ` Smaller than ${def.minWidth}px, so it may look soft. You can still save it.` : ''}
              </p>
            )}
            {fileError && <p className="body-sm text-alert mt-2">{fileError}</p>}
          </div>

          <div>
            <label htmlFor={`${inputId}-alt`} className="label mb-2 block">
              Description *
            </label>
            <input
              id={`${inputId}-alt`}
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              onBlur={() => {
                setAltTouched(true);
                setAlt((v) => normalizeLine(v));
              }}
              aria-invalid={altTouched && !!altError}
              style={altTouched && altError ? FIELD_ERROR_RING : undefined}
              className={FIELD_WELL}
            />
            <div className="mt-1.5 flex items-start justify-between gap-4">
              <p className="meta text-ink-faint">
                Read aloud by screen readers. Describe what is in this photo.
              </p>
              <CharCount length={alt.length} max={ALT_MAX} />
            </div>
            {altTouched && altError && <p className="body-sm text-alert mt-1.5">{altError}</p>}
          </div>

          {mutError && <p className="body-sm text-alert">{mutError.message}</p>}

          <div className="flex gap-3 flex-wrap">
            <Button onClick={save} disabled={saving || !dirty || (!pending && !row)}>
              {saving ? 'Saving' : 'Save'}
            </Button>
            {pending && (
              <Button variant="tertiary" onClick={() => setPending(null)} disabled={saving}>
                Discard
              </Button>
            )}
            {row && !pending && !confirmEmpty && (
              <Button variant="tertiary" onClick={() => setConfirmEmpty(true)} disabled={saving}>
                Empty this slot
              </Button>
            )}
            {confirmEmpty && (
              <>
                <Button variant="secondary" onClick={empty} disabled={saving}>
                  Remove the photo
                </Button>
                <Button variant="tertiary" onClick={() => setConfirmEmpty(false)}>
                  Keep it
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Slab>
  );
}
