'use client';

import { useMemo } from 'react';
import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import type { ExecGroup, Executive } from '@/types/database';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';
import SectionHead from '@/components/ui/section-head';
import Slab from '@/components/ui/slab';
import ExecutiveGrid, { ExecutiveGridSkeleton } from '@/components/team/executive-grid';
import { useSiteContent } from '@/providers/site-content-provider';
import { EXEC_GROUP_FALLBACKS } from '@/lib/exec-group-fallbacks';

/*
  One roster, read left to right. The groups are an ordering, not labelled
  sections: see the note in executive-grid.tsx.

  Roles are data now (exec_groups, the Roles tab), so the ordering comes from
  their display_order rather than a hardcoded list. A role the club adds sorts
  where they put it. Until the lookup answers, the three original tiers stand
  in, which is the order the roster had before roles were editable.
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
  });
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
    Sort by group first, then keep the display_order the query already applied
    within each group. Array.prototype.sort is stable, so the second ordering
    survives the first.
  */
  const ordered = useMemo(() => {
    /* An unknown slug sorts last rather than first (indexOf is -1). */
    const rank = (slug: string) => {
      const i = groupOrder.indexOf(slug);
      return i === -1 ? groupOrder.length : i;
    };
    return [...executives]
      .filter((executive) => executive.visible)
      .sort((a, b) => rank(a.group) - rank(b.group));
  }, [executives, groupOrder]);

  return (
    <main className="pt-[clamp(6rem,10vw,10rem)] pb-[clamp(5rem,10vw,9rem)]">
      <div className="mb-16 px-[var(--gut)]">
        <SectionHead
          eyebrow={text('team.header.eyebrow')}
          title={[text('team.header.title_line1'), text('team.header.title_line2')].filter(Boolean)}
        />
      </div>

      {/* Slab outside the async wrapper: the bed paints immediately and only
          the roster inside fills in. */}
      <div className="px-[var(--gut)]">
        <Slab tone="sunken">
          <AsyncStateWrapper
            loading={loading}
            error={error}
            data={ordered}
            onRetry={refetch}
            emptyMessage={text('team.header.empty')}
            skeleton={<ExecutiveGridSkeleton count={8} />}
          >
            <ExecutiveGrid executives={ordered} />
          </AsyncStateWrapper>
        </Slab>
      </div>
    </main>
  );
}
