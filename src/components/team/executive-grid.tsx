'use client';

import { useEffect, useRef, useState } from 'react';
import Avatar from '@/components/ui/avatar';
import Skeleton from '@/components/ui/skeleton';
import { getPublicUrl } from '@/lib/supabase/storage';
import { useReveal } from '@/lib/reveal';
import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import type { ExecArea, ExecGroup, Executive } from '@/types/database';
import { ListEditBranch, useListEditBranch } from '@/edit/list-draft';
import { useDraftAreas, useDraftFile } from '@/edit';
import { rowSizes } from '@/lib/exec-tiers';

/*
  The roster, as one centred row group per role, in role order.

  Every portrait is the same size, whatever the role. Only the order of the
  rows shows rank: presidents first, then each role in turn. No heading names
  the tiers: the title under each name already says the role.

  Each tier is split into centred, evenly filled rows of as many full-size
  cells as fit (rowSizes in src/lib/exec-tiers.ts), so a wide screen never
  ends a row with one person on their own. The gap between tiers is larger
  than the gap between rows inside a tier.

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
  The roster editor (src/edit/engine/list-editors.tsx) uses the same tiers,
  cells and portrait size, so edit mode shows the roster as Preview does.
  A drag moves a person within their role; changing the role moves them to
  that role's tier.
*/
export const CELL = SIZE.cell;
export const AVATAR_WIDTH = SIZE.avatar;
export const AVATAR_SIZES = SIZE.sizes;
export const TIER_ROW = 'm-0 flex list-none flex-wrap justify-center gap-x-6 gap-y-10 p-0';
export const TIER_STACK = 'flex flex-col gap-16';

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
  same people in the same tiers: every field inline, the Add tile last,
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
  const { data: savedAreas } = useSupabaseQuery<ExecArea>('exec_areas', { enabled: needsLookups });
  /* An area added in edit mode and not yet published, so Preview shows the
     full built title instead of the stored one (cut at 40 characters). */
  const added = useDraftAreas();
  const areas = added.length
    ? [...savedAreas, ...added.map((a) => ({ ...a, display_order: 0 }) as ExecArea)]
    : savedAreas;

  /* A headshot chosen in edit mode and not yet published shows in Preview. */
  const draftFile = useDraftFile('executives');
  const headshot = (executive: Executive) =>
    draftFile(executive.id, 'headshot_path') ?? getPublicUrl('headshots', executive.headshot_path);

  const photos = executives.flatMap((executive) => {
    const src = headshot(executive);
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

  const [measureRef, perRow] = usePerRow();

  /*
    Each tier is split into explicit, evenly filled rows by rowSizes
    (src/lib/exec-tiers.ts). A wrapping flex row cannot do that: eight people
    at seven per row wrap as seven and one. Each row is centred, does not
    wrap, and never holds more cells than fit at full size.
  */
  return (
    <div ref={measureRef}>
      <div ref={ref} className={TIER_STACK}>
        {tiers.map((tier) => {
          const size = SIZE;
          const rows = rowSizes(tier.length, perRow);
          return (
            <div key={tier[0].group} role="list" className="flex flex-col gap-y-10">
              {rows.map((count, rowIndex) => {
                const start = rows.slice(0, rowIndex).reduce((sum, n) => sum + n, 0);
                return (
                  <div key={rowIndex} className="flex justify-center gap-x-6">
                    {tier.slice(start, start + count).map((executive) => {
                      const src = headshot(executive);
                      return (
                        <div
                          key={executive.id}
                          role="listitem"
                          className={`flex min-w-0 flex-col items-center gap-4 text-center ${size.cell}`}
                        >
                          {/* The width is set on a wrapper, not on the Avatar. Passing
                              a width class to a component that already sets w-full
                              makes Tailwind's output order decide which width applies.
                              max-w-full lets the portrait shrink with its cell. */}
                          <span className={`${size.avatar} max-w-full`}>
                            <Avatar
                              name={executive.name}
                              src={src}
                              fluid
                              sizes={size.sizes}
                              reveal={src !== null}
                              onReady={src ? () => settle(executive.id) : undefined}
                            />
                          </span>

                          {/* A word longer than the cell breaks inside the cell
                              instead of running over the next name. */}
                          <div className="flex flex-col gap-1 [overflow-wrap:anywhere]">
                            <span className="title-sm">{executive.name}</span>
                            <span className="meta">{titleOf(executive, groups, areas)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* The cell's widest size and the gap between cells, matching SIZE.cell and gap-x-6. */
const CELL_MAX = { min: 148, vw: 0.2, max: 220 };
const GAP_X = 24;

/*
  How many full-size cells fit across the roster, measured from its real
  width, and at least one. Starts at 5 for the first frame, before the
  roster has a width.
*/
function usePerRow() {
  const ref = useRef<HTMLDivElement>(null);
  const [perRow, setPerRow] = useState(5);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (!width) return;
      const cell = Math.min(CELL_MAX.max, Math.max(CELL_MAX.min, window.innerWidth * CELL_MAX.vw));
      setPerRow(Math.max(1, Math.floor((width + GAP_X) / (cell + GAP_X))));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, perRow] as const;
}
