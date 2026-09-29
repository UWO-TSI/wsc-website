'use client';

import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';
import SectionHead from '@/components/ui/section-head';
import Slab from '@/components/ui/slab';
import Timeline from '@/components/events/timeline';
import RowSkeleton from '@/components/ui/row-skeleton';
import type { Event } from '@/types/database';

export default function EventsPage() {
  const { data: events, loading, error, refetch } = useSupabaseQuery<Event>(
    'events',
    { orderBy: 'date', ascending: true }
  );

  return (
    <main className="pt-[clamp(6rem,10vw,10rem)] pb-[clamp(5rem,10vw,9rem)]">
      <div className="mb-16 px-[var(--gut)]">
        <SectionHead eyebrow="Events" title={['What we run']} />
      </div>

      {/*
        The slab is outside the async wrapper on purpose. The band, its tone
        and its corner are known before the query resolves, so they paint
        immediately and only the ledger inside fills in. With the wrapper on
        the outside there was no slab at all while loading, and the whole
        section appeared at once the moment the data landed.
      */}
      <div className="px-[var(--gut)]">
        <Slab tone="sunken">
          <AsyncStateWrapper
            loading={loading}
            error={error}
            data={events}
            onRetry={refetch}
            emptyMessage="No events are on the calendar yet."
            skeleton={<RowSkeleton count={6} />}
          >
            <Timeline events={events} />
          </AsyncStateWrapper>
        </Slab>
      </div>
    </main>
  );
}
