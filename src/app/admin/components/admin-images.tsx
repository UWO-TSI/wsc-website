'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import { uploadFile, getPublicUrl } from '@/lib/supabase/storage';
import { classifyError } from '@/lib/error-utils';
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
import SaveBar from './save-bar';
import { useUnsavedChanges } from '../unsaved-changes';

/*
  Images: every photo slot on the public site, by page.

  Edits batch, like Site text: choose photos, rewrite descriptions and mark
  slots to empty across the page, then "Save all changes" writes every
  changed slot. Switching page or tab with edits pending asks first. A slot
  that fails keeps its draft and shows why; the others still save.

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

/** What an editor has changed on one slot and not saved yet. */
interface SlotDraft {
  pending?: Pending;
  alt?: string;
  /** Marked to be emptied on save. */
  empty?: boolean;
}

type Drafts = Partial<Record<ImageSlotKey, SlotDraft>>;

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

const altFor = (slot: ImageSlotKey, row: SiteImage | null, draft: SlotDraft | undefined) =>
  draft?.alt ?? row?.alt ?? IMAGE_SLOTS[slot].alt;

const altErrorFor = (alt: string) =>
  validateField({ label: 'Description', required: true, maxLength: ALT_MAX }, alt);

/** A draft that would write nothing is not a change. */
function isDirty(row: SiteImage | null, draft: SlotDraft | undefined): boolean {
  if (!draft) return false;
  if (draft.pending) return true;
  if (draft.empty) return !!row;
  return !!row && draft.alt !== undefined && normalizeLine(draft.alt) !== row.alt;
}

export default function AdminImages() {
  const { data: rows, loading, error, refetch } = useSupabaseQuery<SiteImage>('site_images', {
    orderBy: 'slot',
  });
  const [page, setPage] = useState<(typeof PAGES)[number]>('Home');
  const [drafts, setDrafts] = useState<Drafts>({});
  const [slotErrors, setSlotErrors] = useState<Partial<Record<ImageSlotKey, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const bySlot = useMemo(() => new Map(rows.map((r) => [r.slot, r])), [rows]);
  const slots = IMAGE_SLOT_KEYS.filter((key) => IMAGE_SLOTS[key].page === page);
  const filled = IMAGE_SLOT_KEYS.filter((key) => bySlot.has(key)).length;

  const dirtySlots = IMAGE_SLOT_KEYS.filter((key) => isDirty(bySlot.get(key) ?? null, drafts[key]));
  const confirmLeave = useUnsavedChanges('site_images', dirtySlots.length > 0);

  /* Object URLs for chosen files live until replaced, discarded or saved,
     and any left are released when the editor unmounts. */
  const draftsRef = useRef(drafts);
  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);
  useEffect(
    () => () => {
      for (const d of Object.values(draftsRef.current)) if (d?.pending) URL.revokeObjectURL(d.pending.url);
    },
    []
  );

  const updateDraft = (slot: ImageSlotKey, patch: Partial<SlotDraft>) => {
    setSlotErrors((prev) => ({ ...prev, [slot]: undefined }));
    setDrafts((prev) => {
      const current = prev[slot] ?? {};
      if ('pending' in patch && current.pending && current.pending !== patch.pending) {
        URL.revokeObjectURL(current.pending.url);
      }
      return { ...prev, [slot]: { ...current, ...patch } };
    });
  };

  const discardAll = () => {
    for (const d of Object.values(drafts)) if (d?.pending) URL.revokeObjectURL(d.pending.url);
    setDrafts({});
    setSlotErrors({});
    setSubmitted(false);
  };

  const saveSlot = async (slot: ImageSlotKey, row: SiteImage | null, draft: SlotDraft) => {
    if (draft.empty && row) {
      const { error: delRowErr } = await supabase.from('site_images').delete().eq('slot', slot);
      if (delRowErr) throw delRowErr;
      const { error: delErr } = await supabase.storage.from(SITE_IMAGES_BUCKET).remove([row.object_name]);
      if (delErr) console.warn('File cleanup failed:', delErr.message);
      return;
    }

    let objectName = row?.object_name;
    if (draft.pending) {
      ({ objectName } = await uploadFile(SITE_IMAGES_BUCKET, draft.pending.file));
    }
    const { error: upsertErr } = await supabase
      .from('site_images')
      .upsert(
        { slot, object_name: objectName, alt: normalizeLine(altFor(slot, row, draft)) },
        { onConflict: 'slot' }
      );
    if (upsertErr) throw upsertErr;

    if (draft.pending && row?.object_name && row.object_name !== objectName) {
      const { error: delErr } = await supabase.storage.from(SITE_IMAGES_BUCKET).remove([row.object_name]);
      if (delErr) console.warn('Old file cleanup failed:', delErr.message);
    }
  };

  const saveAll = async () => {
    setSubmitted(true);
    if (dirtySlots.length === 0) return;
    const invalid = dirtySlots.filter(
      (slot) => !drafts[slot]?.empty && altErrorFor(altFor(slot, bySlot.get(slot) ?? null, drafts[slot]))
    );
    if (invalid.length > 0) return;

    setSaving(true);
    const failed: Partial<Record<ImageSlotKey, string>> = {};
    /* One at a time: each slot is an upload plus a row, and a failure on
       one should not stop or roll back the rest. */
    for (const slot of dirtySlots) {
      try {
        await saveSlot(slot, bySlot.get(slot) ?? null, drafts[slot]!);
      } catch (err) {
        failed[slot] = classifyError(err as Error)?.message ?? 'Could not save this slot.';
      }
    }

    await refetch();
    setDrafts((prev) => {
      const next: Drafts = {};
      for (const [slot, d] of Object.entries(prev) as [ImageSlotKey, SlotDraft][]) {
        if (failed[slot]) next[slot] = d;
        else if (d.pending) URL.revokeObjectURL(d.pending.url);
      }
      return next;
    });
    setSlotErrors(failed);
    setSaving(false);
    if (Object.keys(failed).length === 0) {
      setSubmitted(false);
      setSavedAt(Date.now());
    }
  };

  return (
    <div>
      <SaveBar
        title="Images"
        hint={`${filled} / ${IMAGE_SLOT_KEYS.length} slots filled. An empty slot shows a still placeholder at the same size.`}
        pending={dirtySlots.length}
        saving={saving}
        savedAt={savedAt}
        onSave={saveAll}
        onDiscard={discardAll}
      />

      {Object.values(slotErrors).some(Boolean) && (
        <p className="body-sm text-alert mb-5">
          Some slots did not save. Their changes are still here; see each slot below.
        </p>
      )}

      <div className="flex gap-1 mb-6 flex-wrap" role="tablist" aria-label="Page">
        {PAGES.map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={page === p}
            onClick={() => {
              if (p === page) return;
              confirmLeave(() => {
                discardAll();
                setPage(p);
              });
            }}
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
            <SlotEditor
              key={slot}
              slot={slot}
              row={bySlot.get(slot) ?? null}
              draft={drafts[slot]}
              dirty={dirtySlots.includes(slot)}
              onChange={(patch) => updateDraft(slot, patch)}
              saveError={slotErrors[slot] ?? null}
              submitted={submitted}
              saving={saving}
            />
          ))}
        </div>
      </AsyncStateWrapper>
    </div>
  );
}

function SlotEditor({
  slot,
  row,
  draft,
  dirty,
  onChange,
  saveError,
  submitted,
  saving,
}: {
  slot: ImageSlotKey;
  row: SiteImage | null;
  draft: SlotDraft | undefined;
  dirty: boolean;
  onChange: (patch: Partial<SlotDraft>) => void;
  saveError: string | null;
  submitted: boolean;
  saving: boolean;
}) {
  const def: ImageSlot = IMAGE_SLOTS[slot];
  const [altTouched, setAltTouched] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const pending = draft?.pending ?? null;
  const emptying = !!draft?.empty && !!row;
  const alt = altFor(slot, row, draft);

  const currentUrl = row ? getPublicUrl(SITE_IMAGES_BUCKET, row.object_name) : null;
  const shown = emptying ? null : (pending?.url ?? currentUrl);

  const altError = altErrorFor(alt);
  const showAltError = (altTouched || (submitted && dirty)) && !emptying && altError;
  const lowRes = pending && pending.width < def.minWidth;

  const choose = async (file: File | undefined) => {
    setFileError(null);
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
      onChange({ pending: { file, ...dims }, empty: false });
    } catch (err) {
      setFileError((err as Error).message);
    }
  };

  const inputId = `slot-${slot}`;
  const chip = emptying
    ? { status: 'warn' as const, text: 'Will be emptied' }
    : dirty
        ? { status: 'warn' as const, text: 'Unsaved' }
        : row
          ? { status: 'ok' as const, text: 'Filled' }
          : { status: 'neutral' as const, text: 'Empty' };

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
            <Chip status={chip.status}>{chip.text}</Chip>
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

          {!emptying && (
            <div>
              <label htmlFor={`${inputId}-alt`} className="label mb-2 block">
                Description *
              </label>
              <input
                id={`${inputId}-alt`}
                type="text"
                value={alt}
                onChange={(e) => onChange({ alt: e.target.value })}
                onBlur={() => {
                  setAltTouched(true);
                  onChange({ alt: normalizeLine(alt) });
                }}
                aria-invalid={!!showAltError}
                style={showAltError ? FIELD_ERROR_RING : undefined}
                className={FIELD_WELL}
              />
              <div className="mt-1.5 flex items-start justify-between gap-4">
                <p className="meta text-ink-faint">
                  Read aloud by screen readers. Describe what is in this photo.
                </p>
                <CharCount length={alt.length} max={ALT_MAX} />
              </div>
              {showAltError && <p className="body-sm text-alert mt-1.5">{altError}</p>}
            </div>
          )}

          {saveError && <p className="body-sm text-alert">{saveError}</p>}

          <div className="flex gap-3 flex-wrap">
            {pending && (
              <Button variant="tertiary" onClick={() => onChange({ pending: undefined })} disabled={saving}>
                {row ? 'Keep the current photo' : 'Remove this photo'}
              </Button>
            )}
            {row && !pending && !emptying && (
              <Button variant="tertiary" onClick={() => onChange({ empty: true })} disabled={saving}>
                Empty this slot
              </Button>
            )}
            {emptying && (
              <Button variant="tertiary" onClick={() => onChange({ empty: false })} disabled={saving}>
                Keep the photo
              </Button>
            )}
          </div>
        </div>
      </div>
    </Slab>
  );
}
