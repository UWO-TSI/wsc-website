import type { ExecGroup } from '@/types/database';

/**
 * The three role tiers that used to be a CHECK constraint, kept as a
 * fallback for when the `exec_groups` lookup is loading or fails.
 *
 * Without this the team page would show nothing at all if one of its
 * two queries failed, which is a worse outcome than briefly showing
 * the tiers the club has had since launch.
 */
export const EXEC_GROUP_FALLBACKS: ExecGroup[] = [
  {
    id: 'fallback-president',
    slug: 'president',
    label: 'Presidents',
    singular_label: 'President',
    visible: true,
    display_order: 10,
  },
  {
    id: 'fallback-vice-president',
    slug: 'vice_president',
    label: 'Vice Presidents',
    singular_label: 'Vice President',
    visible: true,
    display_order: 20,
  },
  {
    id: 'fallback-avp',
    slug: 'assistant_vice_president',
    label: 'Assistant Vice Presidents',
    singular_label: 'Assistant Vice President',
    visible: true,
    display_order: 30,
  },
];
