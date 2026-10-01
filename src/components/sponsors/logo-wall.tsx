'use client';

import { useRef, useState } from 'react';
import type { Sponsor, QueryError } from '@/types/database';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';
import Slab from '@/components/ui/slab';
import Skeleton from '@/components/ui/skeleton';
import LogoCard from '@/components/sponsors/logo-card';
import { getPublicUrl } from '@/lib/supabase/storage';
import { useReveal } from '@/lib/reveal';
import { useSiteContent } from '@/providers/site-content-provider';

interface LogoWallProps {
  sponsors: Sponsor[];
  loading: boolean;
  error: QueryError | null;
  onRetry?: () => void;
}

const GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4';

/*
  Built to the same grid as the wall, including the lead tile spanning two
  columns, so the layout does not reshuffle when the sponsors arrive.
*/
function WallSkeleton() {
  return (
    <div className={GRID}>
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton
          key={i}
          index={i}
          className={`aspect-[3/2] rounded-md ${i === 0 ? 'col-span-2' : ''}`}
        />
      ))}
    </div>
  );
}

/*
  The sponsors table has no tier column, and hard rule 1 forbids touching
  supabase/, so every sponsor ships in one tier group: the gold bar and label
  reading "Partners". --gold, not --accent, because a sponsor's standing has
  to read the same in both themes. Tile scale carries the hierarchy inside
  that group, taken from display_order rather than an invented tier
  (design-system/adoption.md, Data decisions).

  The bed is --sunken, a lighter gray than the tiles. Each mark keeps the
  constant --logo-ground tile, so a black plate still reads against the bed
  and a light mark still has the dark ground it was drawn for.

  The slab and the tier bar are outside the async wrapper: both are known
  before the query resolves, so they paint immediately and only the grid
  inside fills in.
*/
/*
  Mounted only once the sponsors are in hand, so the pending set is the real
  list and not the empty array from the loading render. The fade is the
  logo sequence. The grid holds it until every file has settled, then runs
  it once, so the marks arrive together instead of each one popping in as
  its response lands.
*/
function LogoGrid({ sponsors }: { sponsors: Sponsor[] }) {
  const ids = sponsors.flatMap((sponsor) =>
    getPublicUrl('sponsor-logos', sponsor.logo_path ?? null) ? [sponsor.id] : []
  );
  const pending = useRef(new Set(ids));
  const [ready, setReady] = useState(ids.length === 0);
  const ref = useReveal<HTMLDivElement>({ ready });

  const settle = (id: string) => {
    if (!pending.current.delete(id)) return;
    if (pending.current.size === 0) setReady(true);
  };

  return (
    <div ref={ref} className={GRID}>
      {sponsors.map((sponsor, index) => (
        <LogoCard
          key={sponsor.id}
          sponsor={sponsor}
          rank={index}
          total={sponsors.length}
          onReady={() => settle(sponsor.id)}
        />
      ))}
    </div>
  );
}

export default function LogoWall({ sponsors, loading, error, onRetry }: LogoWallProps) {
  const { text } = useSiteContent();

  return (
    <Slab tone="sunken">
      <div className="mb-6 flex items-center gap-3">
        <span className="h-1 w-10 rounded-pill bg-gold" aria-hidden="true" />
        <span className="label text-gold">{text('partners.wall.label')}</span>
      </div>

      <AsyncStateWrapper
        loading={loading}
        error={error}
        data={sponsors}
        onRetry={onRetry}
        emptyMessage={text('partners.wall.empty')}
        skeleton={<WallSkeleton />}
      >
        <LogoGrid sponsors={sponsors} />
      </AsyncStateWrapper>
    </Slab>
  );
}
