import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import Chip from '@/components/ui/chip';
import type { Event } from '@/types/database';

/*
  TimelineEvent — Row Expand, sequence 10, shared with ExecRow.

  Status has no column in the events table, so it is derived from date: future
  or today is "Open". A past event is reference, not an offer, so it drops the
  chip, takes --ink-muted and is rendered as a plain div rather than a button:
  it never gets the hover expand.
*/

interface TimelineEventProps {
  event: Event;
  index: number;
}

export default function TimelineEvent({ event, index }: TimelineEventProps) {
  const parsedDate = parseISO(event.date);
  const isPast = isBefore(startOfDay(parsedDate), startOfDay(new Date()));
  const dateLabel = format(parsedDate, 'MMM d, yyyy');
  const ix = String(index).padStart(2, '0');

  const summary = (
    <div className="flex w-full flex-wrap items-center gap-x-[14px] gap-y-1">
      <span className={`label w-[30px] shrink-0 ${isPast ? '' : 'text-ink-faint'}`}>{ix}</span>
      <span
        className={`title-sm order-1 flex-1 basis-40 ${
          isPast
            ? 'text-ink-muted'
            : 'transition-transform duration-[var(--d-move)] ease-move group-hover:translate-x-[10px] group-focus-visible:translate-x-[10px] motion-reduce:group-hover:translate-x-0 motion-reduce:group-focus-visible:translate-x-0'
        }`}
      >
        {event.title}
      </span>
      <time dateTime={event.date} className="meta order-2 shrink-0 pl-[44px] sm:pl-0">
        {dateLabel}
        {event.time ? ` · ${event.time}` : ''}
      </time>
      {!isPast && (
        <span className="order-3 ml-auto shrink-0">
          <Chip status="ok">Open</Chip>
        </span>
      )}
    </div>
  );

  const details = (event.location || event.description) && (
    <div className="flex flex-col gap-1 pl-[44px]">
      {event.location && <p className="meta">{event.location}</p>}
      {event.description && (
        <p className={`body-sm measure ${isPast ? 'text-ink-muted' : ''}`}>{event.description}</p>
      )}
    </div>
  );

  if (isPast) {
    return (
      <div className="flex w-full flex-col gap-2 rounded-md px-[14px] py-[14px] text-ink-muted">
        {summary}
        {details}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="group flex w-full flex-col gap-2 rounded-md bg-transparent px-[14px] py-[14px] text-left shadow-none transition-[padding,background-color,box-shadow] duration-[var(--d-move)] ease-move hover:bg-raised hover:py-[22px] hover:shadow-2 focus-visible:bg-raised focus-visible:py-[22px] focus-visible:shadow-2 motion-reduce:hover:py-[14px] motion-reduce:focus-visible:py-[14px]"
    >
      {summary}
      {details}
    </button>
  );
}
