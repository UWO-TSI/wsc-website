'use client';

import { useMemo } from 'react';
import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import type { Executive } from '@/types/database';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';
import SectionHead from '@/components/ui/section-head';
import Slab from '@/components/ui/slab';
import ExecutiveList from '@/components/team/executive-list';

export default function ExecutiveTeamPage() {
  const {
    data: executives,
    loading,
    error,
    refetch,
  } = useSupabaseQuery<Executive>('executives');

  const presidents = useMemo(
    () => executives.filter((e) => e.group === 'president'),
    [executives]
  );

  const vicePresidents = useMemo(
    () => executives.filter((e) => e.group === 'vice_president'),
    [executives]
  );

  const assistantVicePresidents = useMemo(
    () => executives.filter((e) => e.group === 'assistant_vice_president'),
    [executives]
  );

  return (
    <main className="pt-[clamp(6rem,10vw,10rem)] pb-[clamp(5rem,10vw,9rem)]">
      <div className="mb-16 px-[var(--gut)]">
        <SectionHead eyebrow="Team" title={['The people running it']} />
      </div>

      <div className="px-[var(--gut)]">
        <AsyncStateWrapper
          loading={loading}
          error={error}
          data={executives}
          onRetry={refetch}
          emptyMessage="No executives are published yet."
        >
          <Slab tone="sunken" className="flex flex-col gap-8">
            {presidents.length > 0 && (
              <ExecutiveList title="Presidents" executives={presidents} startIndex={1} />
            )}
            {vicePresidents.length > 0 && (
              <ExecutiveList
                title="Vice Presidents"
                executives={vicePresidents}
                startIndex={1 + presidents.length}
              />
            )}
            {assistantVicePresidents.length > 0 && (
              <ExecutiveList
                title="Assistant Vice Presidents"
                executives={assistantVicePresidents}
                startIndex={1 + presidents.length + vicePresidents.length}
              />
            )}
          </Slab>
        </AsyncStateWrapper>
      </div>
    </main>
  );
}
