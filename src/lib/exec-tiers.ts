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
