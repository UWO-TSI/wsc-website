'use client';

import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';
import PageHead from '@/components/layout/page-head';
import Timeline from '@/components/events/timeline';
import RowSkeleton from '@/components/ui/row-skeleton';
import ClosingBand from '@/components/layout/closing-band';
import { EditableImage, useEditMode } from '@/edit';
import type { Event } from '@/types/database';
import { useSiteContent } from '@/providers/site-content-provider';
import type { ImageSlotKey } from '@/lib/image-slots';

/*
  Five frames across the content width from 850px up, three below that.
  The first three are the ones that remain: at the threshold a row of
  three already fills the gutter, and narrower than that they shrink in
  place. The last two only exist while five fit. Clip Reveal, --r-md.

  Each frame is a photo slot (events.strip.image1..5), filled from the
  admin. An empty slot holds its 4/3 frame as a still placeholder.

  Newest first: the calendar is read for what is coming and what just
  happened, not from the club's first event forward.

  Order: the page head (inverse, waist ribbon), the photo strip and the
  ledger bare on the page ground, then the closing band. The page head and
  the band are the page's containers; the strip and the ledger between them
  carry no tint and are separated by room (--pad-section). The head sells,
  so it is centred; the ledger is scanned, so it starts from the gutter.
*/
const PHOTO_SLOTS: ImageSlotKey[] = [
  'events.strip.image1',
  'events.strip.image2',
  'events.strip.image3',
  'events.strip.image4',
  'events.strip.image5',
];

export default function EventsPage() {
  const { data: events, loading, error, refetch } = useSupabaseQuery<Event>(
    'events',
    {
      orderBy: 'date',
      ascending: false,
      thenBy: 'created_at',
      /* Not redundant with RLS: a signed-in admin can read drafts. */
      filters: [{ column: 'published', operator: 'eq', value: true }],
      editList: true,
    }
  );
  const { text } = useSiteContent();
  const { editing } = useEditMode();

  return (
    <div className="stack">
      <PageHead
        id="events-heading"
        texture="arc"
        titleKeys={['events.header.title_line1']}
      />

      <section aria-label="Event photos" className="px-[var(--gut)] pt-[var(--pad-section)]">
        <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0 min-[850px]:grid-cols-5 sm:gap-3">
          {PHOTO_SLOTS.map((slot, i) => (
            <li
              key={slot}
              className={`m-0 min-w-0 ${i > 2 ? 'hidden min-[850px]:block' : ''}`}
            >
              <EditableImage
                slot={slot}
                sizes="(max-width: 849px) 33vw, 20vw"
                className="aspect-[4/3] w-full rounded-md"
                index={i}
              />
            </li>
          ))}
        </ul>
      </section>

      {/*
        The section is outside the async wrapper on purpose. Its room is
        known before the query resolves, so it holds its place and only the
        ledger inside fills in.
      */}
      <section aria-label="Events" className="px-[var(--gut)] py-[var(--pad-section)]">
        <AsyncStateWrapper
          loading={loading}
          error={error}
          /* An empty ledger still shows the editor, so its Add tile is there. */
          data={editing ? [editing] : events}
          onRetry={refetch}
          emptyMessage={text('events.header.empty')}
          skeleton={<RowSkeleton count={6} />}
        >
          <Timeline events={events} />
        </AsyncStateWrapper>
      </section>

      <ClosingBand />
    </div>
  );
}
