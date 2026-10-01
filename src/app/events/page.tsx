'use client';

import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';
import RevealImage from '@/components/ui/reveal-image';
import SectionHead from '@/components/ui/section-head';
import Slab from '@/components/ui/slab';
import Timeline from '@/components/events/timeline';
import RowSkeleton from '@/components/ui/row-skeleton';
import type { Event } from '@/types/database';

/*
  Five frames across the content width from 850px up, three below that.
  The first three are the ones that remain: at the threshold a row of
  three already fills the gutter, and narrower than that they shrink in
  place. The last two only exist while five fit. Clip Reveal, --r-md.
*/
const PHOTOS = [
  {
    src: '/events/vantage-1.avif',
    alt: 'Members at a Vantage sales workshop',
  },
  {
    src: '/events/vantage-2.avif',
    alt: 'Western Sales Club members at a Vantage event',
  },
  {
    src: '/events/college-pro.avif',
    alt: 'Western Sales Club members at a College Pro event',
  },
  {
    src: '/events/vantage-3.avif',
    alt: 'Western Sales Club members in a workshop discussion',
  },
  {
    src: '/imagery/sales-comp-3.avif',
    alt: 'Western Sales Club members presenting',
  },
] as const;

export default function EventsPage() {
  const { data: events, loading, error, refetch } = useSupabaseQuery<Event>(
    'events',
    { orderBy: 'date', ascending: true }
  );

  return (
    <main className="pt-[clamp(6rem,10vw,10rem)] pb-[clamp(5rem,10vw,9rem)]">
      <div className="mb-10 px-[var(--gut)]">
        <SectionHead eyebrow="Events" title={['What we run']} />
      </div>

      <div className="mb-6 px-[var(--gut)]">
        <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0 min-[850px]:grid-cols-5 sm:gap-3">
          {PHOTOS.map((photo, i) => (
            <li
              key={photo.src}
              className={`m-0 min-w-0 ${i > 2 ? 'hidden min-[850px]:block' : ''}`}
            >
              <RevealImage
                src={photo.src}
                alt={photo.alt}
                sizes="(max-width: 849px) 33vw, 20vw"
                className="aspect-[4/3] w-full rounded-md"
                index={i}
              />
            </li>
          ))}
        </ul>
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
