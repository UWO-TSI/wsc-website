'use client';

import Image from 'next/image';
import { format } from 'date-fns';

import type { Event, QueryError } from '@/types/database';
import Button from '@/components/ui/button';
import Chip from '@/components/ui/chip';
import SectionHead from '@/components/ui/section-head';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';
import { useReveal } from '@/lib/reveal';

/*
  Events preview: rows, not cards. `events` has no status column, so Open is
  derived from the date (design-system/adoption.md). Past events drop the
  chip, take --ink-muted, and lose the hover treatment, because they are
  reference and should not look pressable.

  Self-contained: another agent owns the full timeline in
  src/components/events/, so nothing here imports from that tree.
*/
const PREVIEW_COUNT = 4;

interface EventsPreviewProps {
  events: Event[];
  loading: boolean;
  error: QueryError | null;
}

function isUpcoming(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) >= today;
}

export default function EventsPreview({ events, loading, error }: EventsPreviewProps) {
  const ref = useReveal<HTMLElement>();

  const upcoming = events
    .filter((event) => event.published)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, PREVIEW_COUNT);

  return (
    <section ref={ref} className="px-[var(--gut)] py-24 sm:py-32" aria-labelledby="events-heading">
      {/*
        Asymmetric on purpose: the list carries the information and takes the
        wider column, the photo is support and takes the narrower one. A 50/50
        split would give the image equal billing with the calendar. Below the
        lg breakpoint the image drops under the list rather than squeezing.
      */}
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-14">
        <div className="flex flex-col gap-10">
          <SectionHead eyebrow="Events" index="02" id="events-heading" title={['On the', 'calendar']} />

          <AsyncStateWrapper
            loading={loading}
            error={error}
            data={upcoming}
            emptyMessage="No events on the calendar yet."
          >
            <div className="arrive flex flex-col gap-1">
              {upcoming.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          </AsyncStateWrapper>

          <div>
            <Button href="/events" variant="secondary" arrow>
              See all events
            </Button>
          </div>
        </div>

        {/* Clip Reveal, sequence 9. The portrait crop suits the tall column. */}
        <figure className="clip-cell relative m-0 aspect-[3/4] w-full overflow-hidden rounded-md lg:sticky lg:top-28">
          <Image
            src="/events/college-pro.avif"
            alt="Western Sales Club members at a College Pro event"
            fill
            sizes="(max-width: 1024px) 100vw, 420px"
            className="clip-inner object-cover"
          />
        </figure>
      </div>
    </section>
  );
}

function EventRow({ event }: { event: Event }) {
  const open = isUpcoming(event.date);
  const formatted = format(new Date(event.date), 'MMM d').toUpperCase();

  return (
    <div
      className={`flex flex-wrap items-baseline gap-x-6 gap-y-1 rounded-md px-4 py-4 transition-[background-color,box-shadow] duration-[var(--d-move)] ease-move ${
        open ? 'hover:bg-raised hover:shadow-2' : ''
      }`}
    >
      <span className="meta w-14 shrink-0">{formatted}</span>
      <span className={`title-sm flex-1 ${open ? 'text-ink' : 'text-ink-muted'}`}>{event.title}</span>
      {event.location && <span className="body-sm shrink-0">{event.location}</span>}
      {open && <Chip status="ok">Open</Chip>}
    </div>
  );
}
