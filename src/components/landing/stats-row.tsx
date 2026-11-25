'use client';

import StatFigure from '@/components/ui/stat-figure';
import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import { SITE_STAT_FALLBACKS } from '@/lib/site-stat-fallbacks';
import { ListEditBranch, useListEditBranch } from '@/edit/list-draft';
import type { SiteStat } from '@/types/database';

/*
  The three counted figures, directly under the hero: a number right after
  the promise. Bare on --page, centred, Counter Roll on each (StatFigure).

  The figures are the club's own claims in site_stats. Three in a row at
  most, so only the first three visible rows render. The fallback trio
  shows while the query is in flight and if it fails, so the row never
  appears half-built; once it answers, the database wins. `visible` is
  filtered here too: a signed-in admin's RLS can read hidden rows.

  While editing, the engine's figures editor renders every row instead,
  hidden ones included, with InlineNumber for each number and the Add tile
  last (src/edit/list-draft.ts). Counter Roll stays at rest in edit mode.
*/

export default function StatsRow() {
  const { data, loading, error } = useSupabaseQuery<SiteStat>('site_stats', { editList: true });
  const editing = useListEditBranch();
  const stats = (loading || error ? SITE_STAT_FALLBACKS : data)
    .filter((stat) => stat.visible)
    .slice(0, 3);

  if (stats.length === 0 && !editing) return null;

  return (
    <section aria-label="The club in numbers" className="px-[var(--gut)] pb-[clamp(3rem,7vw,5.5rem)]">
      {editing && !loading && !error ? (
        <ListEditBranch name="stats" props={{ stats: data }} />
      ) : (
        <div className="mx-auto grid max-w-[720px] grid-cols-3 gap-4">
          {stats.map((stat) => (
            <StatFigure
              key={stat.id}
              value={stat.value}
              suffix={stat.suffix ?? undefined}
              label={stat.label}
              className="items-center text-center"
            />
          ))}
        </div>
      )}
    </section>
  );
}
