'use client';

import { useRef, useState } from 'react';
import Avatar from '@/components/ui/avatar';
import Skeleton from '@/components/ui/skeleton';
import { getPublicUrl } from '@/lib/supabase/storage';
import { useReveal } from '@/lib/reveal';
import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import type { ExecArea, ExecGroup, Executive } from '@/types/database';
import { ListEditBranch, useListEditBranch } from '@/edit/list-draft';

/*
  The roster, as one centred row group per role, in role order.

  Every portrait is the same size, whatever the role. Only the order of the
  rows shows rank: presidents first, then each role in turn. No heading names
  the tiers: the title under each name already says the role.

  Each tier is its own centred flex row, so a short last row is centred under
  the full rows above it. The gap between tiers is larger than the gap between
  rows inside a tier.

  No cell has a fill, shadow, border or hover. These are people, not controls.

  Headshots run Clip Reveal together. Each portrait waits on its own bytes,
  and the roster does not start the sequence until every one has loaded or
  failed, so they all appear at the same moment. The initials disc shows
  until then.
*/

/* One size for every cell and portrait, in every tier and in the editor. */
const SIZE = {
  /** Width of the whole cell, so names wrap at the same width across a row. */
  cell: 'w-[clamp(148px,20vw,220px)]',
  /** Width of the portrait inside the cell. */
  avatar: 'w-[clamp(104px,18vw,176px)]',
  /** Rendered portrait width, for next/image. */
  sizes: '(max-width: 640px) 128px, 176px',
};

/*
  The roster editor (src/edit/engine/list-editors.tsx) stays one flat grid,
  because dragging and changing a role move people between tiers. These are
  its layout and portrait size, the same size as the visitor view.
*/
export const GRID = 'grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4';
export const AVATAR_WIDTH = SIZE.avatar;
export const AVATAR_SIZES = SIZE.sizes;

const TIER_ROW = 'm-0 flex list-none flex-wrap justify-center gap-x-6 gap-y-10 p-0';
const TIER_STACK = 'flex flex-col gap-16';

/*
  The skeleton has the shape of a typical roster: two presidents, then a row
  of vice presidents. This keeps the loading height close to the loaded
  height, so the closing band moves less when the roster arrives.
*/
const SKELETON_TIERS = [2, 6];

export function ExecutiveGridSkeleton() {
  return (
    <div className={TIER_STACK}>
      {SKELETON_TIERS.map((count, tierIndex) => {
        const size = SIZE;
        return (
          <div key={tierIndex} className={TIER_ROW}>
            {Array.from({ length: count }, (_, i) => (
              <div key={i} className={`flex flex-col items-center gap-4 ${size.cell}`}>
                <Skeleton index={i} className={`aspect-square rounded-full ${size.avatar}`} />
                <Skeleton index={i} className="h-[19px] w-3/4" />
                <Skeleton index={i} className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/*
  The line under the name. With an area it is built from the role's short
  label and the area: "VP, Marketing". Without one it is the stored title,
  which keeps the page as it was until the area backfill has been reviewed.
  The stored title is also used if the role or area has not loaded.
*/
export function titleOf(executive: Executive, groups: ExecGroup[], areas: ExecArea[]): string {
  if (!executive.area_id) return executive.title;
  const group = groups.find((g) => g.slug === executive.group);
  const area = areas.find((a) => a.id === executive.area_id);
  const role = group?.short_label;
  return role && area ? `${role}, ${area.name}` : executive.title;
}

/*
  `tiers` is the roster split by role, in role order, with empty roles
  removed. While editing, the engine's roster editor renders instead with the
  same people in the same order, flat: every field inline, the Add tile last,
  the Grip, the chips, and Remove in the tray. A visitor never downloads it
  (src/edit/list-draft.ts).
*/
export default function ExecutiveGrid({ tiers }: { tiers: Executive[][] }) {
  if (useListEditBranch()) return <ListEditBranch name="executives" props={{ executives: tiers.flat() }} />;
  return <ExecutiveGridView tiers={tiers} />;
}

function ExecutiveGridView({ tiers }: { tiers: Executive[][] }) {
  const executives = tiers.flat();

  /* Roles and areas are fetched only once someone has an area set. */
  const needsLookups = executives.some((executive) => !!executive.area_id);
  const { data: groups } = useSupabaseQuery<ExecGroup>('exec_groups', { enabled: needsLookups });
  const { data: areas } = useSupabaseQuery<ExecArea>('exec_areas', { enabled: needsLookups });

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
  const ref = useReveal<HTMLDivElement>({ ready });

  const settle = (id: string) => {
    if (!pending.current.delete(id)) return;
    if (pending.current.size === 0) setReady(true);
  };

  return (
    <div ref={ref} className={TIER_STACK}>
      {tiers.map((tier) => {
        const size = SIZE;
        return (
          <ul key={tier[0].group} className={TIER_ROW}>
            {tier.map((executive) => {
              const src = getPublicUrl('headshots', executive.headshot_path);
              return (
                <li
                  key={executive.id}
                  className={`flex flex-col items-center gap-4 text-center ${size.cell}`}
                >
                  {/* The width is set on a wrapper, not on the Avatar. Passing
                      a width class to a component that already sets w-full
                      makes Tailwind's output order decide which width applies. */}
                  <span className={size.avatar}>
                    <Avatar
                      name={executive.name}
                      src={src}
                      fluid
                      sizes={size.sizes}
                      reveal={src !== null}
                      onReady={src ? () => settle(executive.id) : undefined}
                    />
                  </span>

                  <div className="flex flex-col gap-1">
                    <span className="title-sm">{executive.name}</span>
                    <span className="meta">{titleOf(executive, groups, areas)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        );
      })}
    </div>
  );
}
