'use client';

import { useRef, useState } from 'react';
import Avatar from '@/components/ui/avatar';
import Skeleton from '@/components/ui/skeleton';
import { getPublicUrl } from '@/lib/supabase/storage';
import { useReveal } from '@/lib/reveal';
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
  shadow, no border and no hover: these are people, not controls.

  Headshots run Clip Reveal together. Each portrait waits on its own bytes,
  and the grid does not start the sequence until every one has settled, so
  they arrive as one moment instead of popping in as each response lands.
  The initials disc is what shows until then.
*/

const GRID = 'grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4';

/*
  The headshot is capped rather than filling its column, and the cap is set so
  the disc lands at roughly the width of the name under it.

  Filling the column put it near 290px on a wide screen, which made the page a
  wall of faces with the names as an afterthought. The first cap overcorrected
  and left the photos looking like tiny tokens. This sits between the two: the
  disc reads as a portrait and the name still holds its own beneath it.
*/
const AVATAR_WIDTH = 'w-[clamp(104px,18vw,176px)]';
const AVATAR_SIZES = '(max-width: 640px) 128px, 176px';

export function ExecutiveGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={GRID}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col items-center gap-4">
          {/* Same cap as the real avatar, or the grid would reflow on load. */}
          <Skeleton index={i} className={`aspect-square rounded-full ${AVATAR_WIDTH}`} />
          <Skeleton index={i} className="h-[19px] w-3/4" />
          <Skeleton index={i} className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function ExecutiveGrid({ executives }: { executives: Executive[] }) {
  const photos = executives.flatMap((executive) => {
    const src = getPublicUrl('headshots', executive.headshot_path);
    return src ? [{ id: executive.id, src }] : [];
  });

  /*
    A ref, not state, for the set itself: marking a portrait ready must not
    rebuild the list. State flips once, when the last one settles, which is
    what releases the shared Clip Reveal.
  */
  const pending = useRef(new Set(photos.map((photo) => photo.id)));
  const [ready, setReady] = useState(photos.length === 0);
  const ref = useReveal<HTMLUListElement>({ ready });

  const settle = (id: string) => {
    if (!pending.current.delete(id)) return;
    if (pending.current.size === 0) setReady(true);
  };

  return (
    <ul ref={ref} className={`m-0 list-none p-0 ${GRID}`}>
      {executives.map((executive) => {
        const src = getPublicUrl('headshots', executive.headshot_path);
        return (
        <li key={executive.id} className="flex flex-col items-center gap-4 text-center">
          {/* The cap lives on a wrapper, not on the Avatar. Passing a width
              class to a component that already sets w-full leaves the winner
              to Tailwind's output order rather than to intent. */}
          <span className={AVATAR_WIDTH}>
            <Avatar
              name={executive.name}
              src={src}
              fluid
              sizes={AVATAR_SIZES}
              reveal={src !== null}
              onReady={src ? () => settle(executive.id) : undefined}
            />
          </span>

          <div className="flex flex-col gap-1">
            <span className="title-sm">{executive.name}</span>
            <span className="meta">
              {executive.title}
              {executive.year_of_study ? ` · Year ${executive.year_of_study}` : ''}
            </span>
          </div>
        </li>
        );
      })}
    </ul>
  );
}
