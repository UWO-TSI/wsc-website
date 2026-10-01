import { format, isBefore, parseISO, startOfDay } from 'date-fns';
import Chip from '@/components/ui/chip';
import type { Event } from '@/types/database';

/*
  TimelineEvent: sequence 10, Row Expand, shared with ExecRow. The `.row`
  classes are in globals.css.

  The events table has no status column and supabase/ is off limits, so status
  is derived from the date: future or today is "Open". A past event is
  reference rather than an offer, so it drops the chip and loses the expand,
  because it should not look pressable. Every line of the row stays on --ink.
  The index, date, and place roles set --ink-muted themselves, so they need
  the important utility to come back up to the same contrast as the title.

  Like ExecRow, a live row is inert: there is no registration URL to link to,
  and the expand is a pointer-only response to attention rather than an
  affordance.
*/

interface TimelineEventProps {
  event: Event;
  index: number;
}

export default function TimelineEvent({ event, index }: TimelineEventProps) {
  const date = parseISO(event.date);
  const isPast = isBefore(startOfDay(date), startOfDay(new Date()));

  return (
    <li className={`row ${isPast ? '' : 'row-live'}`}>
      <div className="flex w-full flex-wrap items-center gap-x-[14px] gap-y-1">
        <span className="label text-ink! w-[30px] shrink-0">
          {String(index).padStart(2, '0')}
        </span>

        <span className={`title-sm text-ink order-1 flex-1 basis-40 ${isPast ? '' : 'row-name'}`}>
          {event.title}
        </span>

        <time dateTime={event.date} className="meta text-ink! order-2 shrink-0 pl-[44px] sm:pl-0">
          {format(date, 'MMM d, yyyy')}
          {event.time ? ` · ${event.time}` : ''}
        </time>

        {!isPast && (
          <span className="order-3 ml-auto shrink-0">
            <Chip status="ok">Open</Chip>
          </span>
        )}
      </div>

      {(event.location || event.description) && (
        <div className="flex flex-col gap-1 pl-[44px]">
          {event.location && <p className="meta text-ink!">{event.location}</p>}
          {event.description && <p className="body text-ink measure">{event.description}</p>}
        </div>
      )}
    </li>
  );
}
