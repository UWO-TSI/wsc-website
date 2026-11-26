import { externalLinkProps } from '@/lib/link-utils';

/*
  How an event's time and registration link are shown, in one place for the
  Events page ledger, the home page's next event and the ledger editor.
*/

/**
 * events.time is 24-hour HH:MM (migration 9). Shown the way the club writes
 * times on posters, "6:30 PM". Anything that is not HH:MM is a row from
 * before the migration that did not parse, and is shown as written.
 */
export function formatTime(time: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return time;
  const hours = Number(match[1]);
  return `${hours % 12 || 12}:${match[2]} ${hours < 12 ? 'AM' : 'PM'}`;
}

/**
 * The register_url to link to, trimmed, or null when there is none to show:
 * empty, or not an absolute http(s) address (a row from before the database
 * check, or a draft value in Preview).
 */
export function registerHref(registerUrl: string | null | undefined): string | null {
  const href = registerUrl?.trim() ?? '';
  return 'target' in externalLinkProps(href) ? href : null;
}
