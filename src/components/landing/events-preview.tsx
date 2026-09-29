'use client';

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
      <div className="mx-auto flex max-w-[1100px] flex-col gap-10">
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
