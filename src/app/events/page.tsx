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
        <SectionHead eyebrow="EVENTS" title={['What we run']} />
      </div>

      <div className="px-[var(--gut)]">
        <AsyncStateWrapper
          loading={loading}
          error={error}
          data={events}
          onRetry={refetch}
          emptyMessage="No events are on the calendar yet."
        >
          <Slab tone="sunken">
            <Timeline events={events} />
          </Slab>
        </AsyncStateWrapper>
      </div>
    </main>
  );
}
