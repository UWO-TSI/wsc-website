/**
 * The roster cut into tiers: each run of consecutive people with the same
 * role is one tier, with the index of its first person. Anyone whose role
 * is not in `roles` (a slug missing from exec_groups) shares one tier with
 * the other unknown roles; the page sorts them last. The team page and the
 * roster editor both cut with this, so edit mode shows the visitor's tiers.
 */
export function cutTiers<T>(
  people: T[],
  roleOf: (person: T) => string,
  roles: string[]
): Array<{ tier: T[]; start: number }> {
  const tierOf = (person: T) => {
    const role = roleOf(person);
    return roles.includes(role) ? role : '';
  };
  const out: Array<{ tier: T[]; start: number }> = [];
  people.forEach((person, i) => {
    const last = out[out.length - 1];
    if (last && tierOf(last.tier[0]) === tierOf(person)) last.tier.push(person);
    else out.push({ tier: [person], start: i });
  });
  return out;
}

/** At least this many people share a row, unless the whole tier is smaller. */
export const MIN_PER_ROW = 3;

/**
 * How many people go in each row of one tier, top row first. A tier that
 * fits in `perRow` is one row. A longer tier takes as few rows as fit, split
 * as evenly as possible with the longer rows first, and no row holds fewer
 * than MIN_PER_ROW: 8 at 7 per row is 4 and 4, never 7 and 1. A tier of 4
 * or 5 with room for only 3 stays one row, and its cells shrink to fit.
 */
export function rowSizes(count: number, perRow: number): number[] {
  if (count <= perRow) return [count];
  const rows = Math.max(1, Math.min(Math.ceil(count / perRow), Math.floor(count / MIN_PER_ROW)));
  const base = Math.floor(count / rows);
  const extra = count % rows;
  return Array.from({ length: rows }, (_, i) => base + (i < extra ? 1 : 0));
}
