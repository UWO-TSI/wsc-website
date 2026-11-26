'use client';

import Slab from '@/components/ui/slab';
import CentredHead from '@/components/ui/centred-head';
import StatFigure, { rowEm } from '@/components/ui/stat-figure';
import { EditableText, useEditMode } from '@/edit';
import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import { SITE_STAT_FALLBACKS } from '@/lib/site-stat-fallbacks';
import { LIMITS } from '@/lib/admin-config';
import { ListEditBranch, useListEditBranch } from '@/edit/list-draft';
import { useSiteContent } from '@/providers/site-content-provider';
import type { SiteStat } from '@/types/database';

/*
  ProofBand: the club's record, on Home's one inverse slab with the arc
  texture (the stats band shape).

  A centred head, then up to four figures from site_stats at the hero size
  (LIMITS.MAX_SITE_STATS, the editor's cap too), then one named result on
  an --inverse-tile. The result is a site_content string and is hidden
  while it is empty, so the band never shows a placeholder on the live
  site. With no visible figures and no result, the band is left off the
  page; with a result only, the head and the result show.

  The figures are a centred row that wraps (FIGURE_ROW). Every cell has
  one width (figureCell): half the row on a phone, a third from 700px, a
  quarter with four figures. One to three figures are centred in the
  middle with the spacing three have, and a third figure on a phone is
  centred under the first two. Each figure fits its cell (StatFigure,
  `fit`), so no value the editor allows overlaps its neighbour.

  The figures are the club's own claims in site_stats. The fallback set
  shows while the query is in flight and if it fails, so the row never
  appears half-built; once it answers, the database wins. `visible` is
  filtered here too: a signed-in admin's RLS can read hidden rows.

  While editing, the engine's figures editor renders every row instead,
  hidden ones included: the shown figures in this row, in the same cells
  at the same size, then the hidden figures and the Add tile in a second
  row of the same cells (src/edit/engine/list-editors.tsx). Counter Roll
  stays at rest in edit mode.

  design-system/components.md, ProofBand.
*/

/** The figures' row, shared with the editor. */
export const FIGURE_ROW = 'flex flex-wrap justify-center gap-x-4 gap-y-10';

/** One figure's cell when the row shows `count` figures, shared with the editor. A size container for the fit. */
export function figureCell(count: number): string {
  return count >= 4
    ? '@container flex-none w-[calc((100%-1rem)/2)] min-[700px]:w-[calc((100%-3rem)/4)]'
    : '@container flex-none w-[calc((100%-1rem)/2)] min-[700px]:w-[calc((100%-2rem)/3)]';
}

export default function ProofBand() {
  const { data, loading, error } = useSupabaseQuery<SiteStat>('site_stats', { editList: true });
  const listEditing = useListEditBranch();
  const { text } = useSiteContent();
  const { editing } = useEditMode();

  const stats = (loading || error ? SITE_STAT_FALLBACKS : data)
    .filter((stat) => stat.visible)
    .slice(0, LIMITS.MAX_SITE_STATS);
  const showResult = editing || text('home.results.result') !== '';
  const showDate = editing || text('home.results.result_date') !== '';
  const editor = listEditing && !loading && !error;
  const fit = rowEm(stats);

  if (!editor && stats.length === 0 && !showResult) return null;

  return (
    <Slab tone="inverse" texture="arc" aria-labelledby="results-heading">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-12 py-[clamp(1rem,4vw,2.5rem)]">
        <CentredHead
          id="results-heading"
          titleKeys={['home.results.title_line1']}
        />

        {editor ? (
          <ListEditBranch name="stats" props={{ stats: data }} />
        ) : stats.length > 0 && (
          <div className={FIGURE_ROW}>
            {stats.map((stat) => (
              <StatFigure
                key={stat.id}
                size="hero"
                value={stat.value}
                suffix={stat.suffix ?? undefined}
                label={stat.label}
                fit={fit}
                className={`${figureCell(stats.length)} items-center text-center`}
              />
            ))}
          </div>
        )}

        {showResult && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-inverse-tile px-6 py-5">
            <EditableText k="home.results.result" as="p" className="subtitle measure m-0" />
            {showDate && <EditableText k="home.results.result_date" as="p" className="meta m-0" />}
          </div>
        )}
      </div>
    </Slab>
  );
}
