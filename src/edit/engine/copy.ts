/*
  Every line edit mode shows, in one place. The wording is the "States and
  copy" table in docs/redesign/spec.md, section 3, with the example numbers
  replaced by the real ones. Change a line there first, then here.
*/

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const changes = (n: number) => plural(n, 'change', 'changes');

export const COPY = {
  // First sign-in: the tray until there is something else to say.
  firstLabel: 'Edit mode',
  first:
    'Every text and photo on the page is a field. Change it where it is. Nothing goes live until you press Publish.',

  // Field focused: "About · Body copy." and "212 of 320 characters."
  fieldHead: (section: string, label: string) => `${section} · ${label}`,
  fieldCount: (n: number, max: number) => `${n} of ${max} characters.`,
  /** The short count beside the link address of a button. */
  labelCount: (n: number, max: number) => `${n} of ${max}`,

  // Heading focused
  headingCount: (lines: Array<{ n: number; max: number }>) =>
    lines.map((l, i) => `Line ${i + 1}: ${l.n} of ${l.max}.`).join(' '),
  headingHint: 'Enter starts line 2; leave it empty for one line.',
  headingHintMany: 'Enter starts the next line; leave a line empty to skip it.',
  lineTooWide: 'This line wraps on phones. Shorten it to keep the heading on one line.',

  // Link address in the tray
  linkAddress: (fieldName: string) => `Link address for ${fieldName}`,

  // Photos
  photoHead: (section: string, label: string) => `${section} · Photo, ${label.toLowerCase()}`,
  photoHint: (min: number) => `Opens your files or photo library. Use a photo at least ${min}px wide.`,
  photoTooSmall: (width: number, min: number) =>
    `This photo is ${width}px wide and will look soft here. Use one at least ${min}px wide.`,
  photoRefused: (width: number, min: number) =>
    `This photo is ${width}px wide, too small for this spot. Use one at least ${min}px wide.`,
  /* These two are today's uploader copy (admin-images.tsx); the spec table
     does not list file type or size. */
  photoType: 'Use a JPEG, PNG, WebP or AVIF image.',
  photoSize: (mb: number, limit: number) =>
    `That file is ${mb.toFixed(1)} MB. The limit is ${limit} MB; export it smaller.`,
  photoUnreadable: 'Could not read that file as an image. Try a JPEG or PNG.',
  replacePhoto: 'Replace photo',
  addPhoto: 'Add photo',

  // Bar
  editing: 'Editing',
  previewing: 'Preview',
  noChanges: 'No changes',
  pending: (n: number) => `${plural(n, 'unpublished change', 'unpublished changes')}.`,
  pendingShort: (n: number) => plural(n, 'unpublished change', 'unpublished changes'),
  publish: (n: number) => (n ? `Publish ${changes(n)}` : 'Publish'),
  publishing: 'Publishing',
  published: 'Published',
  discard: 'Discard',
  edit: 'Edit',
  modeGroup: 'Edit or preview',
  previewIdle: 'Preview shows the page as visitors will see it after you publish.',

  // Discard, confirmed in the tray
  confirmDiscard: (n: number) =>
    `Discard ${plural(n, 'unpublished change', 'unpublished changes')}? This cannot be undone.`,
  keepEditing: 'Keep editing',
  discardN: (n: number) => `Discard ${n}`,

  // Publish results
  publishedLabel: 'Published',
  publishedBody: 'Published. Visitors see the changes now.',
  failedLabel: 'Not published',
  partlyFailed: (n: number) =>
    `${n} ${n === 1 ? 'change did' : 'changes did'} not publish and ${n === 1 ? 'is' : 'are'} still in your draft. Try again.`,
  blockedLabel: 'Cannot publish yet',
  missingName: 'Add a name for the new executive before publishing.',
  offlineLabel: 'Offline',
  offline: 'You are offline. Your changes are saved in this browser. Publish when you reconnect.',
  expiredLabel: 'Signed out',
  expired: 'Your sign-in expired. Your changes are saved in this browser. Sign in again to publish them.',
  signIn: 'Sign in',

  // Draft from earlier: "You have 3 unpublished changes from Tuesday."
  draftFromEarlier: (n: number, when: string) =>
    `You have ${plural(n, 'unpublished change', 'unpublished changes')} from ${when}.`,

  // Areas, used by the list editors in phase 3
  duplicateArea: (name: string) => `${name} already exists. Pick it from the list.`,

  /* Lists: executives, events, partners and the counted figures. Lines the
     spec table does not give follow the edit-mode demo in
     docs/redesign/reference.html. */
  visible: 'Visible',
  hidden: 'Hidden',
  unpublished: 'Unpublished',
  willBeRemoved: 'Will be removed',
  gripLabel: (who: string, i: number, n: number) => `Reorder ${who}, position ${i} of ${n}. Drag, or use arrow keys.`,
  moved: (who: string, i: number, n: number) => `Moved ${who} to position ${i} of ${n}`,
  gripHint: 'Drag to move, or use the arrow keys.',
  rowHead: (kind: string, name: string) => `${kind} · ${name}`,
  showsAs: (shown: string) => `Shows on the site as ${shown}.`,
  roleHint: (shown: string) => `Roles are added in Settings. Shows as ${shown}.`,
  rowPhotoHint: 'Opens your files or photo library.',
  rowPhotoName: (action: string, what: string, who: string) => `${action}, ${what} for ${who}`,
  photoTooLarge: (width: number, height: number, max: number) =>
    `This photo is ${width} by ${height}px. Use one at most ${max}px on each side.`,
  replaceLogo: 'Replace logo',
  addLogo: 'Add logo',
  noArea: 'No area',
  addArea: 'Add an area',
  newArea: 'New area',
  newAreaName: 'New area name',
  newAreaHint: 'Type the area name and press Enter. Escape cancels.',
  registerLink: (title: string) => `Register link for ${title}`,
  partnerLink: (name: string) => `Link for ${name}`,
  linkPlaceholder: 'https://',
  list: {
    executives: {
      kind: 'Executive',
      fresh: 'New executive',
      add: 'Add executive',
      show: 'Show on team page',
      remove: 'Remove from team',
      keep: 'Keep on team',
    },
    events: {
      kind: 'Event',
      fresh: 'New event',
      add: 'Add event',
      show: 'Show on events page',
      remove: 'Remove event',
      keep: 'Keep event',
    },
    sponsors: {
      kind: 'Partner',
      fresh: 'New partner',
      add: 'Add partner',
      show: 'Show on partners page',
      remove: 'Remove partner',
      keep: 'Keep partner',
    },
    site_stats: {
      kind: 'Figure',
      fresh: 'New figure',
      add: 'Add figure',
      show: 'Show on home page',
      remove: 'Remove figure',
      keep: 'Keep figure',
    },
  },
  /** Names of the row fields, for screen readers and placeholders. */
  field: {
    name: 'Name',
    fullName: 'Full name',
    role: 'Role',
    area: 'Area',
    title: 'Event title',
    date: 'Date',
    time: 'Time',
    location: 'Location',
    description: 'Description',
    value: 'Number',
    suffix: 'Suffix',
    label: 'Label',
    headshot: 'headshot',
    logo: 'logo',
  },
  // Bar: Settings and Sign out. Not in the spec table.
  settings: 'Settings',
  signOut: 'Sign out',
  accountGroup: 'Settings and sign out',

  /* A link address the site cannot use (the database accepts https://,
     http://, /, # and mailto: only). Shown in the tray when the field is
     left; the address goes back to what it was. Not in the spec table. */
  linkRefusedLabel: 'Link not changed',
  linkRefused: 'Use https:// for another site, or / for a page on this site, as in /events.',
  /** The tray head while the editor is back on that button. */
  linkRefusedHead: 'Link not changed. Start it with https:// or /',
};

/**
 * "Tuesday" in "from Tuesday". Within the last six days the weekday, then
 * the date, so a week-old draft never reads as this week's.
 */
export function draftDay(at: number, now = Date.now()): string {
  const day = (t: number) => {
    const d = new Date(t);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };
  const days = Math.round((day(now) - day(at)) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return new Date(at).toLocaleDateString('en-CA', { weekday: 'long' });
  return new Date(at).toLocaleDateString('en-CA', { month: 'long', day: 'numeric' });
}
