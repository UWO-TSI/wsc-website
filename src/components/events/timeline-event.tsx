import { format, isBefore, parseISO, startOfDay } from 'date-fns';
import Chip from '@/components/ui/chip';
import type { Event } from '@/types/database';

/*
  TimelineEvent: sequence 10, Row Expand, shared with ExecRow. The `.row`
  classes are in globals.css.

  The events table has no status column and supabase/ is off limits, so status
  is derived from the date: future or today is "Open". A past event is
  reference rather than an offer, so it drops the chip, takes --ink-muted and
  loses the expand entirely, because it should not look pressable.

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
    <li className={`row ${isPast ? 'text-ink-muted' : 'row-live'}`}>
      <div className="flex w-full flex-wrap items-center gap-x-[14px] gap-y-1">
        <span className={`label w-[30px] shrink-0 ${isPast ? '' : 'text-ink-faint'}`}>
          {String(index).padStart(2, '0')}
        </span>

        <span className={`title-sm order-1 flex-1 basis-40 ${isPast ? '' : 'row-name'}`}>
          {event.title}
        </span>

        <time dateTime={event.date} className="meta order-2 shrink-0 pl-[44px] sm:pl-0">
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
          {event.location && <p className="meta">{event.location}</p>}
          {event.description && <p className="body-sm measure">{event.description}</p>}
        </div>
      )}
    </li>
  );
}
