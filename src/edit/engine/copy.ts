/*
  Every line edit mode shows, in one place. The wording is the "States and
  copy" table in docs/redesign/spec.md, section 3, with the example numbers
  replaced by the real ones. Change a line there first, then here.
*/

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const changes = (n: number) => plural(n, 'change', 'changes');

export const COPY = {
  /** The bar's accessible name. */
  firstLabel: 'Edit mode',

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

  // Discard, confirmed in the tray
  confirmDiscard: (n: number) =>
    `Discard ${plural(n, 'unpublished change', 'unpublished changes')}? This cannot be undone.`,
  keepEditing: 'Keep editing',
  discardN: (n: number) => `Discard ${n}`,

  // Publish results
  publishedLabel: 'Published',
  publishedBody: 'Published. Visitors see the changes now.',
  /* Not in the spec table: a change to an item that was removed in another
     tab or by another admin is dropped from the draft. */
  publishedGone: (n: number) =>
    `Published. ${n} ${n === 1 ? 'change was' : 'changes were'} for an item already removed elsewhere, and ${n === 1 ? 'it was' : 'they were'} dropped from your draft.`,
  failedLabel: 'Not published',
  partlyFailed: (n: number) =>
    `${n} ${n === 1 ? 'change did' : 'changes did'} not publish and ${n === 1 ? 'is' : 'are'} still in your draft. Try again.`,
  blockedLabel: 'Cannot publish yet',
  // Missing name: one line per list, in `list` below.
  offlineLabel: 'Offline',
  offline: 'You are offline. Your changes are saved in this browser. Publish when you reconnect.',
  expiredLabel: 'Signed out',
  expired: 'Your sign-in expired. Your changes are saved in this browser. Sign in again to publish them.',
  signIn: 'Sign in',

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
  /** A row field's accessible name: "Name, Mei Chen". */
  rowField: (label: string, who: string) => `${label}, ${who}`,
  /* The control after each row that moves focus to the row's Remove (and
     link address) in the tray. Not in the spec table. */
  rowOptions: 'Options',
  rowOptionsName: (who: string) => `Options for ${who}, in the edit bar. Escape comes back here.`,
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
  formatBodyHint: 'One sentence on what happens there. Leave it empty to show no line.',
  formatMetaHint: 'Who ran it, as in With Owner.com. Leave it empty to show no line.',
  formatHint: 'Cards show on the home page in this order. Empty lines are left off the card.',
  linkPlaceholder: 'https://',
  list: {
    executives: {
      kind: 'Executive',
      fresh: 'New executive',
      add: 'Add executive',
      show: (who: string) => `Show ${who} on team page`,
      remove: 'Remove from team',
      keep: 'Keep on team',
      missing: 'Add a name for the new executive before publishing.',
      cleared: 'Add a name for this executive before publishing.',
      full: (n: number) => `The team page shows up to ${n} executives. Remove one before adding another.`,
    },
    events: {
      kind: 'Event',
      fresh: 'New event',
      add: 'Add event',
      show: (who: string) => `Show ${who} on events page`,
      remove: 'Remove event',
      keep: 'Keep event',
      missing: 'Add a title for the new event before publishing.',
      cleared: 'Add a title for this event before publishing.',
      full: (n: number) => `The events page holds up to ${n} events. Remove a past event before adding another.`,
    },
    sponsors: {
      kind: 'Partner',
      fresh: 'New partner',
      add: 'Add partner',
      show: (who: string) => `Show ${who} on partners page`,
      remove: 'Remove partner',
      keep: 'Keep partner',
      missing: 'Add a name for the new partner before publishing.',
      cleared: 'Add a name for this partner before publishing.',
      full: (n: number) => `The partners page shows up to ${n} partners. Remove one before adding another.`,
    },
    site_stats: {
      kind: 'Figure',
      fresh: 'New figure',
      add: 'Add figure',
      show: (who: string) => `Show ${who} on home page`,
      remove: 'Remove figure',
      keep: 'Keep figure',
      missing: 'Add a label for the new figure before publishing.',
      cleared: 'Add a label for this figure before publishing.',
      full: (n: number) => `The home page shows up to ${n} figures. Remove one before adding another.`,
    },
    event_formats: {
      kind: 'Format',
      fresh: 'New format',
      add: 'Add format',
      show: (who: string) => `Show ${who} on home page`,
      remove: 'Remove format',
      keep: 'Keep format',
      missing: 'Add a name for the new format before publishing.',
      cleared: 'Add a name for this format before publishing.',
      full: (n: number) => `The home page shows up to ${n} formats. Remove one before adding another.`,
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
    photo: 'photo',
    formatName: 'Format name',
    formatBody: 'What happens there',
    formatMeta: 'Companies involved',
  },
  // Bar: Settings and Sign out. Not in the spec table.
  settings: 'Settings',
  signOut: 'Sign out',
  /** Leaves edit mode and stays signed in. */
  exit: 'Exit',
  exitName: 'Exit edit mode and stay signed in',
  accountGroup: 'Settings, exit and sign out',

  // Bar: the changes list, opened from the count. Not in the spec table.
  changesShow: 'Show unpublished changes',
  changesHead: 'Unpublished changes',
  changesHint: 'Select one to go to it.',
  changeWhere: (page: string, what: string) => `${page} · ${what}`,
  changedTo: 'changed to',
  changeEmptyValue: 'empty',
  changePhoto: 'New photo',
  changeArea: (name: string) => `New area: ${name}`,
  changeAdded: 'Added',
  changeRemoved: 'Will be removed',
  changeOrder: 'Order changed',
  changeList: {
    executives: 'Team order',
    events: 'Event order',
    sponsors: 'Partner order',
    site_stats: 'Figure order',
    event_formats: 'Format order',
  } as Record<string, string>,
  /** Row columns as the changes list names them. */
  changeColumn: {
    name: 'Name',
    title: 'Title',
    date: 'Date',
    time: 'Time',
    location: 'Location',
    description: 'Description',
    register_url: 'Register link',
    link: 'Site',
    value: 'Number',
    suffix: 'Suffix',
    label: 'Label',
    body: 'What happens there',
    meta: 'Companies involved',
    visible: 'Visibility',
    published: 'Visibility',
    active: 'Visibility',
  } as Record<string, string>,

  /* A link address the site cannot use (the database accepts https://,
     http://, /, # and mailto: only). Shown in the tray when the field is
     left; the address goes back to what it was. Not in the spec table. */
  linkRefusedLabel: 'Link not changed',
  linkRefused: 'Use https:// for another site, or / for a page on this site, as in /events.',
  /** For a list link (a register link, a partner's site): the database accepts http(s) only. */
  linkRefusedHttps: 'Use a full web address that starts with https://, as in https://example.com.',
  /** The tray head while the editor is back on that button. */
  linkRefusedHead: 'Link not changed. Start it with https:// or /',
  linkRefusedHeadHttps: 'Link not changed. Start it with https://',
};
