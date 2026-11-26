'use client';

import { format, parseISO, startOfDay } from 'date-fns';

import type { Event, QueryError } from '@/types/database';
import SectionHead from '@/components/ui/section-head';
import { EditableButton, EditableImage, EditableText } from '@/edit';
import RowSkeleton from '@/components/ui/row-skeleton';
import { useReveal } from '@/lib/reveal';

/*
  NextEvent: what is coming up, with the soonest event given the space.

  A left-aligned head, then a photo beside a raised panel. The section is
  scanned, not sold, so the head starts from the same edge as the panel. The panel holds the
  next upcoming event: date, time and room in .meta, the title, the
  description, and Register as the section's one primary button when the
  event has a registration link. Up to two more upcoming events follow as
  plain rows under it. See all events is the secondary button.

  Upcoming means today or later, derived from `date` because `events` has no
  status column (design-system/adoption.md). Upcoming events are shown
  soonest first. Past events are not shown here; the Events page lists them.

  With nothing upcoming the panel says so and keeps See all events, so the
  section still has its photo and a next step.

  Self-contained: another agent owns the full timeline in
  src/components/events/, so nothing here imports from that tree.
  design-system/components.md, NextEvent.
*/

const MORE_COUNT = 2;

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

function whenOf(event: Event) {
  const parts = [format(parseISO(event.date), 'EEE MMM d'), event.time, event.location];
  return parts.filter(Boolean).join(' · ');
}

export default function EventsPreview({ events, loading, error }: EventsPreviewProps) {
  const ref = useReveal<HTMLDivElement>();

  const upcoming = events
    .filter((event) => event.published && isUpcoming(event.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  const [next, ...rest] = upcoming;
  const more = rest.slice(0, MORE_COUNT);

  return (
    <section className="px-[var(--gut)] py-24 sm:py-32" aria-labelledby="events-heading">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-12">
        <SectionHead
          id="events-heading"
          titleKeys={['home.events.title_line1', 'home.events.title_line2']}
        />

        {/*
          The photo takes the narrower column and the event the wider one.
          Below 900px the photo drops under the panel.
        */}
        <div
          ref={ref}
          className="grid grid-cols-1 items-start gap-6 min-[900px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
        >
          <EditableImage
            slot="home.events.image1"
            sizes="(max-width: 900px) 100vw, 460px"
            className="order-2 aspect-[3/4] w-full rounded-lg min-[900px]:order-1"
          />

          <div className="arrive order-1 flex flex-col gap-2 min-[900px]:order-2">
            {loading ? (
              <RowSkeleton count={3} />
            ) : (
              <>
                <article className="flex flex-col gap-4 rounded-lg bg-raised p-[clamp(1.5rem,3vw,2rem)]">
                  {error ? (
                    <p className="body m-0">We could not load the calendar. The Events page has the full list.</p>
                  ) : next ? (
                    <>
                      <p className="meta m-0">{whenOf(next)}</p>
                      <h3 className="title m-0">{next.title}</h3>
                      {next.description && <p className="body measure m-0 text-ink-muted">{next.description}</p>}
                    </>
                  ) : (
                    <EditableText k="home.events.empty" as="p" className="body m-0" />
                  )}

                  <div className="flex flex-wrap gap-3 pt-2">
                    {next?.register_url && (
                      <EditableButton labelKey="events.ledger.register_label" href={next.register_url} />
                    )}
                    <EditableButton
                      labelKey="home.events.link_label"
                      hrefKey="home.events.link_href"
                      variant="secondary"
                      arrow
                    />
                  </div>
                </article>

                {more.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-wrap items-baseline gap-x-6 gap-y-1 rounded-md bg-raised px-5 py-4"
                  >
                    <span className="meta w-14 shrink-0">{format(parseISO(event.date), 'MMM d').toUpperCase()}</span>
                    <span className="title-sm flex-1">{event.title}</span>
                    {event.location && <span className="body-sm shrink-0">{event.location}</span>}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
