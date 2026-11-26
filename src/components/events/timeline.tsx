import TimelineEvent from './timeline-event';
import type { Event } from '@/types/database';
import { ListEditBranch, useListEditBranch } from '@/edit/list-draft';

/*
  A single ledger of event rows, separated by 4px, never by a line.

  Newest first by date. The query already returns that order; sorting
  again keeps it true for drafted rows in Preview, where a new or
  re-dated event is laid over the fetched ones. The sort is stable, so
  events on one date keep the query's created_at order.

  While editing, the engine's ledger editor renders instead, with the same
  rows (src/edit/list-draft.ts).
*/

export const byDateDesc = (a: Pick<Event, 'date'>, b: Pick<Event, 'date'>) =>
  a.date < b.date ? 1 : a.date > b.date ? -1 : 0;

interface TimelineProps {
  events: Event[];
}

export default function Timeline(props: TimelineProps) {
  if (useListEditBranch()) return <ListEditBranch name="events" props={props} />;
  const events = [...props.events].sort(byDateDesc);
  return (
    <ul className="flex list-none flex-col gap-1 p-0">
      {events.map((event, index) => (
        <TimelineEvent key={event.id} event={event} index={index + 1} />
      ))}
    </ul>
  );
}
