'use client';

import Slab from '@/components/ui/slab';
import CentredHead from '@/components/ui/centred-head';
import StatFigure from '@/components/ui/stat-figure';
import { EditableText, useEditMode } from '@/edit';
import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import { SITE_STAT_FALLBACKS } from '@/lib/site-stat-fallbacks';
import { ListEditBranch, useListEditBranch } from '@/edit/list-draft';
import { useSiteContent } from '@/providers/site-content-provider';
import type { SiteStat } from '@/types/database';

/*
  ProofBand: the club's record, on Home's one inverse slab with the arc
  texture (the stats band shape).

  A centred head, then up to four figures from site_stats at the hero size,
  then one named result on an --inverse-tile. The result is a site_content
  string and is hidden while it is empty, so the band never shows a
  placeholder on the live site.

  The figures are the club's own claims in site_stats. The fallback set
  shows while the query is in flight and if it fails, so the row never
  appears half-built; once it answers, the database wins. `visible` is
  filtered here too: a signed-in admin's RLS can read hidden rows.

  While editing, the engine's figures editor renders every row instead,
  hidden ones included, with InlineNumber for each number and the Add tile
  last (src/edit/list-draft.ts). Counter Roll stays at rest in edit mode.

  design-system/components.md, ProofBand.
*/

const MAX_FIGURES = 4;

export default function ProofBand() {
  const { data, loading, error } = useSupabaseQuery<SiteStat>('site_stats', { editList: true });
  const listEditing = useListEditBranch();
  const { text } = useSiteContent();
  const { editing } = useEditMode();

  const stats = (loading || error ? SITE_STAT_FALLBACKS : data)
    .filter((stat) => stat.visible)
    .slice(0, MAX_FIGURES);
  const showResult = editing || text('home.results.result') !== '';
  const showDate = editing || text('home.results.result_date') !== '';

  /* Four figures sit in a 2 by 2 grid on a phone and one row from 700px. */
  const columns = stats.length >= 4 ? 'min-[700px]:grid-cols-4' : 'min-[700px]:grid-cols-3';

  return (
    <Slab tone="inverse" texture="arc" aria-labelledby="results-heading">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-12 py-[clamp(1rem,4vw,2.5rem)]">
        <CentredHead
          id="results-heading"
          titleKeys={['home.results.title_line1']}
        />

        {listEditing && !loading && !error ? (
          <ListEditBranch name="stats" props={{ stats: data }} />
        ) : stats.length > 0 && (
          <div className={`grid grid-cols-2 gap-x-4 gap-y-10 ${columns}`}>
            {stats.map((stat) => (
              <StatFigure
                key={stat.id}
                size="hero"
                value={stat.value}
                suffix={stat.suffix ?? undefined}
                label={stat.label}
                className="items-center text-center"
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
