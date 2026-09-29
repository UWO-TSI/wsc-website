import Avatar from '@/components/ui/avatar';
import Skeleton from '@/components/ui/skeleton';
import { getPublicUrl } from '@/lib/supabase/storage';
import type { Executive } from '@/types/database';

/*
  The roster, as one grid read left to right.

  This replaced three labelled bands, one per group, with headings reading
  Presidents, Vice Presidents and Assistant Vice Presidents. Splitting people
  into titled tiers made the page about rank rather than about the team, which
  is not what a club roster is for.

  The order still carries the structure: presidents come first, then vice
  presidents, then assistant vice presidents. Anyone who wants to know where
  someone sits can read it from the position and from the title under their
  name. Nothing announces the boundary, and no group gets a bigger cell than
  another. Organization is conveyed by layout.

  Everyone is the same size, in the same kind of cell, with no fill, no
  shadow, no border and no hover: these are people, not controls. Headshots
  are always visible here rather than revealed, because a profile picture is
  the content, not a flourish.
*/

const GRID = 'grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4';
const AVATAR_SIZES = '(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px';

export function ExecutiveGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={GRID}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col items-center gap-4">
          <Skeleton index={i} className="aspect-square w-full rounded-full" />
          <Skeleton index={i} className="h-[19px] w-3/4" />
          <Skeleton index={i} className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function ExecutiveGrid({ executives }: { executives: Executive[] }) {
  return (
    <ul className={`m-0 list-none p-0 ${GRID}`}>
      {executives.map((executive) => (
        <li key={executive.id} className="flex flex-col items-center gap-4 text-center">
          <Avatar
            name={executive.name}
            src={getPublicUrl('headshots', executive.headshot_path)}
            fluid
            sizes={AVATAR_SIZES}
          />

          <div className="flex flex-col gap-1">
            <span className="title-sm">{executive.name}</span>
            <span className="meta">{executive.title}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
