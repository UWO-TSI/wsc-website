/*
  Every line the Settings page shows (spec section 3, "Settings page").
  The duplicate area line is shared with the area select on the team page,
  so titles.tsx takes it from the edit engine's copy. This file imports
  nothing, because the sign-in screen of this route reads it too.
*/

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const SETTINGS_COPY = {
  eyebrow: 'Edit mode',
  title: 'Settings',
  intro: 'Who can edit the site, and the roles and areas that make up executive titles.',
  backToEditing: 'Back to editing',
  signOut: 'Sign out',
  loading: 'Loading settings',
  checkFailed: 'Your access could not be confirmed. Sign in again to open Settings.',
  signInAgain: 'Sign in again',
  retry: 'Try again',
  loadFailed: (what: string) => `${what} did not load. Check your connection and try again.`,
  expired: 'Your sign-in expired. Sign in again to change settings.',
  writeFailed: 'That change did not save. Check your connection and try again.',
  edit: 'Edit',
  rename: 'Rename',
  save: 'Save',
  saving: 'Saving',
  cancel: 'Cancel',
  delete: 'Delete',
  keep: 'Keep',
  tooLong: (n: number, max: number) => `${n} of ${max} characters. Cut ${n - max}.`,

  // Admin accounts
  accounts: 'Admin accounts',
  accountsNote:
    'Any admin can invite or remove any other admin. The owner account cannot be removed.',
  you: 'You',
  owner: 'Owner',
  signedIn: (when: string) => `Signed in ${when}`,
  neverSignedIn: 'Never signed in',
  signInUnknown: 'Last sign-in not available',
  remove: 'Remove',
  removing: 'Removing',
  confirmRemove: (email: string) =>
    `Remove ${email}? Their account and two-factor setup are deleted now. A new invite lets them set up again from the start.`,
  confirmRemoveSelf:
    'Remove your own account? It is deleted now, and another admin has to invite you again.',
  setupUnfinished: 'Two-factor not set up yet',
  removeFailed: (email: string) => `${email} was not removed. Reload the page and try again.`,
  invitedRow: (days: number) =>
    days < 1 ? 'Invited, expires today' : `Invited, expires in ${plural(days, 'day', 'days')}`,
  withdraw: 'Withdraw',
  inviteLabel: 'Invite by Google email',
  invite: 'Invite',
  inviting: 'Inviting',
  inviteHelp:
    'Nothing is emailed. Tell them to sign in at /admin with this Google account within 14 days.',
  invited: (email: string) =>
    `${email} is invited. Tell them to sign in at /admin with this Google account within 14 days.`,
  inviteEmpty: 'Type the Google email address to invite.',
  inviteSelf: 'That is your own address. You already have access.',
  inviteAdmin: (email: string) => `${email} already has access.`,
  inviteWaiting: (email: string) => `${email} already has an invite waiting.`,
  /* RLS refused the insert after the checks above passed: the session is not
     an admin with two-step verification, or no longer an admin. */
  inviteRefused: 'The invite was refused because your access could not be confirmed. Sign in again and try again.',

  // Roles
  roles: 'Roles',
  rolesNote: 'The short label starts each executive title, as in VP, Marketing.',
  roleUse: (short: string, n: number) =>
    `${short} · ${n ? plural(n, 'executive', 'executives') : 'not used'}`,
  roleName: 'Role',
  roleShort: 'Short label',
  rolePlural: 'Heading on the team page',
  addRole: 'Add a role',
  add: 'Add',
  missing: (field: string) => `Add the ${field.toLowerCase()}.`,
  roleExists: (name: string) => `${name} already exists.`,
  roleInUse: (name: string) => `${name} has executives. Move them to another role first.`,

  // Areas
  areas: 'Areas',
  areasNote: 'An area in use cannot be deleted. Renaming one renames it on every executive.',
  areaUse: (n: number) => (n ? plural(n, 'executive', 'executives') : 'Not used'),
  areaName: 'Area name',
  addArea: 'Add an area',
  areaEmpty: 'Type a name for the area.',
  areaInUse: (name: string) => `${name} is used by an executive. Move them to another area first.`,
};

/** "today", "yesterday", "3 days ago", then the date. */
export function signedInWhen(at: string, now = Date.now()): string {
  const day = (t: number) => {
    const d = new Date(t);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };
  const t = new Date(at).getTime();
  const days = Math.round((day(now) - day(t)) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return `on ${new Date(t).toLocaleDateString('en-CA', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}
