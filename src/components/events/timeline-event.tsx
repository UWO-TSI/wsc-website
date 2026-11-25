import { format, isBefore, parseISO, startOfDay } from 'date-fns';
import Button from '@/components/ui/button';
import Chip from '@/components/ui/chip';
import { EditableText, useEditMode } from '@/edit';
import { externalLinkProps } from '@/lib/link-utils';
import { useSiteContent } from '@/providers/site-content-provider';
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

  An upcoming event with a registration link gets a Register button. The
  link is the row's own register_url and opens in a new tab; anything that
  is not an absolute http(s) address renders no button. The row itself
  stays inert, so the button is the one control in it and the expand is a
  pointer-only response to attention.

  Row Expand is off while editing, like every self-running motion. While
  editing, the button's label is a field and the button goes nowhere.
*/

/*
  events.time is 24-hour HH:MM (migration 9). Shown the way the club writes
  times on posters, "6:30 PM". Anything that is not HH:MM is a row from
  before the migration that did not parse, and is shown as written.
*/
function formatTime(time: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return time;
  const hours = Number(match[1]);
  return `${hours % 12 || 12}:${match[2]} ${hours < 12 ? 'AM' : 'PM'}`;
}

interface TimelineEventProps {
  event: Event;
  index: number;
}

export default function TimelineEvent({ event, index }: TimelineEventProps) {
  const { editing } = useEditMode();
  const { text } = useSiteContent();
  const date = parseISO(event.date);
  const isPast = isBefore(startOfDay(date), startOfDay(new Date()));

  /* externalLinkProps is empty for anything that is not an http(s) URL. */
  const registerUrl = event.register_url?.trim() ?? '';
  const registerLink = externalLinkProps(registerUrl);
  const canRegister = !isPast && 'target' in registerLink;

  return (
    <li className={`row ${isPast || editing ? '' : 'row-live'}`}>
      <div className="flex w-full flex-wrap items-center gap-x-[14px] gap-y-1">
        <span className="label text-ink! w-[30px] shrink-0">
          {String(index).padStart(2, '0')}
        </span>

        <span className={`title-sm text-ink order-1 flex-1 basis-40 ${isPast ? '' : 'row-name'}`}>
          {event.title}
        </span>

        <time dateTime={event.date} className="meta text-ink! order-2 shrink-0 pl-[44px] sm:pl-0">
          {format(date, 'MMM d, yyyy')}
          {event.time ? ` · ${formatTime(event.time)}` : ''}
        </time>

        {!isPast && (
          <span className="order-3 ml-auto flex shrink-0 items-center gap-3">
            <Chip status="ok">Open</Chip>
            {canRegister &&
              (editing ? (
                <Button variant="secondary">
                  <EditableText k="events.ledger.register_label" />
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  href={registerUrl}
                  {...registerLink}
                  aria-label={`${text('events.ledger.register_label')}, ${event.title}`}
                >
                  {text('events.ledger.register_label')}
                </Button>
              ))}
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
