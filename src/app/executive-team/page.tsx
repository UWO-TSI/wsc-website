'use client';

import { useMemo } from 'react';
import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import type { Executive } from '@/types/database';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';
import SectionHead from '@/components/ui/section-head';
import Slab from '@/components/ui/slab';
import ExecutiveGrid, { ExecutiveGridSkeleton } from '@/components/team/executive-grid';

/*
  One roster, read left to right. The three groups are an ordering, not three
  labelled sections: see the note in executive-grid.tsx.
*/
const GROUP_ORDER: Executive['group'][] = [
  'president',
  'vice_president',
  'assistant_vice_president',
];

export default function ExecutiveTeamPage() {
  const {
    data: executives,
    loading,
    error,
    refetch,
  } = useSupabaseQuery<Executive>('executives');

  /*
    Sort by group first, then keep the display_order the query already applied
    within each group. Array.prototype.sort is stable, so the second ordering
    survives the first.
  */
  const ordered = useMemo(
    () =>
      [...executives].sort(
        (a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group)
      ),
    [executives]
  );

  return (
    <main className="pt-[clamp(6rem,10vw,10rem)] pb-[clamp(5rem,10vw,9rem)]">
      <div className="mb-16 px-[var(--gut)]">
        <SectionHead eyebrow="Team" title={['The people running it']} />
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
            emptyMessage="No executives are published yet."
            skeleton={<ExecutiveGridSkeleton count={8} />}
          >
            <ExecutiveGrid executives={ordered} />
          </AsyncStateWrapper>
        </Slab>
      </div>
    </main>
  );
}
