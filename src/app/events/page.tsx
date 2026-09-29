'use client';

import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';
import SectionHead from '@/components/ui/section-head';
import Slab from '@/components/ui/slab';
import Timeline from '@/components/events/timeline';
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

      <div className="px-[var(--gut)]">
        <AsyncStateWrapper
          loading={loading}
          error={error}
          data={events}
          onRetry={refetch}
          emptyMessage="No events are on the calendar yet."
        >
          {/*
            The rows only exist once the client-side query resolves, so
            without this they appeared fully formed at whatever moment the
            fetch landed while the title above had already animated in. The
            slab clips in and the ledger arrives with it, which is exactly what
            Slab Clip is for: it says where the boundary is. One move for the
            section, not a stagger per row, because a calendar runs well past
            the five-element stagger budget.
          */}
          <Slab tone="sunken" clip>
            <Timeline events={events} />
          </Slab>
        </AsyncStateWrapper>
      </div>
    </main>
  );
}
