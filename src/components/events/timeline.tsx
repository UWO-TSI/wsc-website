import TimelineEvent from './timeline-event';
import type { Event } from '@/types/database';

/*
  A single ledger of event rows, separated by 4px, never by a line.
*/

interface TimelineProps {
  events: Event[];
}

export default function Timeline({ events }: TimelineProps) {
  return (
    <div className="flex flex-col gap-1">
      {events.map((event, index) => (
        <TimelineEvent key={event.id} event={event} index={index + 1} />
      ))}
    </div>
  );
}
