'use client';

import { useMemo } from 'react';
import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import type { ExecGroup, Executive } from '@/types/database';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';
import PageHead from '@/components/layout/page-head';
import ClosingBand from '@/components/layout/closing-band';
import ExecutiveGrid, { ExecutiveGridSkeleton } from '@/components/team/executive-grid';
import { useSiteContent } from '@/providers/site-content-provider';
import { EXEC_GROUP_FALLBACKS } from '@/lib/exec-group-fallbacks';
import { cutTiers } from '@/lib/exec-tiers';
import { useEditMode } from '@/edit';

/*
  One roster, split into one tier per role. Every portrait is the same size,
  only the tier order shows rank, and no heading names the tiers: see the note in executive-grid.tsx.

  Roles are data now (exec_groups, the Roles tab), so the ordering comes from
  their display_order rather than a hardcoded list. A role the club adds sorts
  where they put it. Until the lookup answers, the three original tiers stand
  in, which is the order the roster had before roles were editable.

  Order: the page head (inverse, waist ribbon), the roster bare on the page,
  then the closing band. The roster is bare rather than sunken because a
  missing headshot is an initials disc on --sunken, which would vanish on a
  sunken ground.
*/

export default function ExecutiveTeamPage() {
  const {
    data: executives,
    loading,
    error,
    refetch,
  } = useSupabaseQuery<Executive>('executives', {
    /* Not redundant with RLS: a signed-in admin can read hidden rows. */
    filters: [{ column: 'visible', operator: 'eq', value: true }],
    editList: true,
  });
  /* While editing, hidden rows stay on the page with their chip. */
  const { editing } = useEditMode();
  const { data: groups, loading: groupsLoading, error: groupsError } =
    useSupabaseQuery<ExecGroup>('exec_groups');
  const { text } = useSiteContent();

  const groupOrder = useMemo(
    () =>
      (groupsLoading || groupsError || groups.length === 0 ? EXEC_GROUP_FALLBACKS : groups).map(
        (g) => g.slug
      ),
    [groups, groupsLoading, groupsError]
  );

  /*
    Sort by role first, then keep the display_order the query already applied
    within each role. Array.prototype.sort is stable, so the second ordering
    survives the first. The visitor view then cuts this into one tier per
    role; the roster editor takes it flat. A role with nobody visible has no
    tier, and anyone whose role is not in the lookup goes in one last tier.
  */
  const ordered = useMemo(() => {
    /* An unknown slug sorts last rather than first (indexOf is -1). */
    const rank = (slug: string) => {
      const i = groupOrder.indexOf(slug);
      return i === -1 ? groupOrder.length : i;
    };
    return [...executives]
      .filter((executive) => editing || executive.visible)
      .sort((a, b) => rank(a.group) - rank(b.group));
  }, [executives, groupOrder, editing]);

  /* The same order cut at each role boundary. Unknown roles share the last tier. */
  const tiers = useMemo(
    () => cutTiers(ordered, (executive) => executive.group, groupOrder).map(({ tier }) => tier),
    [ordered, groupOrder]
  );

  return (
    <div className="stack">
      <PageHead
        id="team-heading"
        texture="pair"
        titleKeys={['team.header.title_line1', 'team.header.title_line2']}
      />

      {/* Bare on the page ground between the page head and the closing band,
          with --pad-section of room. Outside the async wrapper, so it holds
          its place and only the roster inside fills in. */}
      <section aria-label="Executive team" className="px-[var(--gut)] py-[var(--pad-section)]">
        <AsyncStateWrapper
          loading={loading}
          error={error}
          /* An empty roster still shows the editor, so its Add tile is there. */
          data={editing ? [editing] : ordered}
          onRetry={refetch}
          emptyMessage={text('team.header.empty')}
          skeleton={<ExecutiveGridSkeleton />}
        >
          <ExecutiveGrid tiers={tiers} />
        </AsyncStateWrapper>
      </section>

      <ClosingBand />
    </div>
  );
}
