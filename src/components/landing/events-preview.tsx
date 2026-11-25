'use client';

import { format, parseISO, startOfDay } from 'date-fns';

import type { Event, QueryError } from '@/types/database';
import Chip from '@/components/ui/chip';
import CentredHead from '@/components/ui/centred-head';
import { EditableButton, EditableImage, useEditMode } from '@/edit';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';
import RowSkeleton from '@/components/ui/row-skeleton';
import { useReveal } from '@/lib/reveal';
import { useSiteContent } from '@/providers/site-content-provider';

/*
  Events preview: rows, not cards. `events` has no status column, so Open is
  derived from the date (design-system/adoption.md). Past events drop the
  chip, take --ink-muted, and lose the hover treatment, because they are
  reference and should not look pressable.

  Self-contained: another agent owns the full timeline in
  src/components/events/, so nothing here imports from that tree.

  The four most recent, newest first, which is the order the landing page
  already queries in (date DESC, created_at DESC). This used to re-sort
  ascending before slicing, which showed the four OLDEST events ever
  published once the calendar had more than four.
*/
const PREVIEW_COUNT = 4;

interface EventsPreviewProps {
  events: Event[];
  loading: boolean;
  error: QueryError | null;
}

/* parseISO, not new Date(): a bare 'YYYY-MM-DD' parses as UTC midnight,
   which is the previous evening in London, Ontario. */
function isUpcoming(date: string) {
  return parseISO(date) >= startOfDay(new Date());
}

export default function EventsPreview({ events, loading, error }: EventsPreviewProps) {
  const ref = useReveal<HTMLDivElement>();

  const { text } = useSiteContent();
  const upcoming = events.filter((event) => event.published).slice(0, PREVIEW_COUNT);

  return (
    <section className="px-[var(--gut)] py-24 sm:py-32" aria-labelledby="events-heading">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-12">
        <CentredHead
          id="events-heading"
          eyebrowKey="home.events.eyebrow"
          titleKeys={['home.events.title_line1', 'home.events.title_line2']}
        />

        {/*
          Asymmetric on purpose: the ledger carries the information and takes
          the wider column, the photo is support and takes the narrower one.
          The ledger is reading content, so it stays left-aligned under the
          centred head. Below lg the photo drops under the list.
        */}
        <div
          ref={ref}
          className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-14"
        >
          <AsyncStateWrapper
            loading={loading}
            error={error}
            data={upcoming}
            emptyMessage={text('home.events.empty')}
            skeleton={<RowSkeleton count={4} />}
          >
            <div className="arrive flex flex-col gap-1">
              {upcoming.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          </AsyncStateWrapper>

          {/* Clip Reveal, sequence 9. The portrait crop suits the tall column. */}
          <EditableImage
            slot="home.events.image1"
            sizes="(max-width: 1024px) 100vw, 420px"
            className="aspect-[3/4] w-full rounded-md lg:sticky lg:top-28"
          />
        </div>

        <div className="flex justify-center">
          <EditableButton
            labelKey="home.events.link_label"
            hrefKey="home.events.link_href"
            variant="secondary"
            arrow
          />
        </div>
      </div>
    </section>
  );
}

function EventRow({ event }: { event: Event }) {
  const open = isUpcoming(event.date);
  /* Row Expand is off in edit mode, like every self-running motion. */
  const { editing } = useEditMode();
  const formatted = format(parseISO(event.date), 'MMM d').toUpperCase();

  return (
    <div
      className={`flex flex-wrap items-baseline gap-x-6 gap-y-1 rounded-md px-4 py-4 transition-[background-color,box-shadow] duration-[var(--d-move)] ease-move ${
        open && !editing ? 'hover:bg-raised hover:shadow-2' : ''
      }`}
    >
      <span className="meta w-14 shrink-0">{formatted}</span>
      <span className={`title-sm flex-1 ${open ? 'text-ink' : 'text-ink-muted'}`}>{event.title}</span>
      {event.location && <span className="body-sm shrink-0">{event.location}</span>}
      {open && <Chip status="ok">Open</Chip>}
    </div>
  );
}
