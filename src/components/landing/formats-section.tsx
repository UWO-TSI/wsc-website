'use client';

import { useRef } from 'react';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';
import Slab from '@/components/ui/slab';
import CardRow, { CARD_ROW_ITEM } from '@/components/ui/card-row';
import CentredHead from '@/components/ui/centred-head';
import RevealImage from '@/components/ui/reveal-image';
import { ListEditBranch, useListEditBranch } from '@/edit/list-draft';
import { useDraftFile } from '@/edit';
import { EVENT_FORMAT_FALLBACKS } from '@/lib/event-format-fallbacks';
import { SITE_IMAGES_BUCKET } from '@/lib/image-slots';
import { getPublicUrl } from '@/lib/supabase/storage';
import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import type { EventFormat } from '@/types/database';

/*
  What we run: a CardRow of FormatCards, one card per kind of event, from
  the event_formats table in display_order. Each card leads with a 4:5
  photo, then the format's name, one sentence on what happens there, and
  the companies involved in .meta. An empty body or meta line is left out,
  so the live site never shows a placeholder.

  The fallback cards show while the query is in flight and if it fails, so
  the row never shows empty; once it answers, the database wins. When it
  answers with no visible card the whole section is left out, so the
  heading never shows over nothing. `visible` is filtered here too: a
  signed-in admin's RLS can read hidden rows.

  While editing, the engine's formats editor renders every row instead,
  hidden ones included, in the same CardRow with the Add tile last
  (src/edit/list-draft.ts). If the query fails while editing, the error
  and its retry show in place of the row: the fallback cards are not rows
  and cannot be edited.

  design-system/components.md, FormatCard and CardRow.
*/

const VISIBLE = [{ column: 'visible', operator: 'eq', value: true }];

/* The card frame, shared with the editor so both draw the same card. */
export const FORMAT_CARD = 'flex h-full flex-col gap-5 rounded-lg bg-page p-3 shadow-1';
export const FORMAT_PHOTO = 'aspect-[4/5] w-full rounded-md';
export const FORMAT_PHOTO_SIZES = '(max-width: 700px) 280px, 460px';

export default function FormatsSection() {
  const { data, loading, error, refetch } = useSupabaseQuery<EventFormat>('event_formats', {
    filters: VISIBLE,
    editList: true,
  });
  const listEditing = useListEditBranch();
  /* A photo chosen in edit mode and not yet published shows in Preview. */
  const draftFile = useDraftFile('event_formats');
  const listRef = useRef<HTMLUListElement>(null);

  const formats = (loading || error ? EVENT_FORMAT_FALLBACKS : data).filter((f) => f.visible);

  if (!listEditing && !loading && !error && formats.length === 0) return null;

  return (
    <Slab tone="raised" aria-labelledby="formats-heading" className="px-0!">
      <div className="flex flex-col gap-10 py-[clamp(1rem,4vw,2.5rem)]">
        <div className="px-[var(--gut)]">
          <CentredHead id="formats-heading" titleKeys={['home.formats.title_line1']} className="max-w-none!" />
        </div>

        {listEditing && error ? (
          <AsyncStateWrapper loading={false} error={error} data={data} onRetry={refetch}>
            {null}
          </AsyncStateWrapper>
        ) : listEditing && !loading ? (
          <ListEditBranch name="formats" props={{ formats: data }} />
        ) : (
          formats.length > 0 && (
            <CardRow label="Event formats" count={formats.length} listRef={listRef}>
              {formats.map((format, i) => (
                <li key={format.id} className={CARD_ROW_ITEM}>
                  {/* While the query is in flight the photo is not known
                      yet, so the frame loads; after an error it is empty. */}
                  <FormatCard
                    format={format}
                    src={
                      loading
                        ? undefined
                        : (draftFile(format.id, 'image_path') ?? getPublicUrl(SITE_IMAGES_BUCKET, format.image_path))
                    }
                    index={i}
                  />
                </li>
              ))}
            </CardRow>
          )
        )}
      </div>
    </Slab>
  );
}

function FormatCard({ format, src, index }: { format: EventFormat; src: string | null | undefined; index: number }) {
  return (
    <article className={FORMAT_CARD}>
      {/* Decorative: the title under the photo names the format. */}
      <RevealImage src={src} alt="" sizes={FORMAT_PHOTO_SIZES} className={FORMAT_PHOTO} index={index} />
      <div className="flex flex-col gap-2 px-3 pb-3">
        <h3 className="title-sm m-0">{format.title}</h3>
        {format.body && <p className="body m-0 text-ink-muted">{format.body}</p>}
        {format.meta && <p className="meta m-0">{format.meta}</p>}
      </div>
    </article>
  );
}
