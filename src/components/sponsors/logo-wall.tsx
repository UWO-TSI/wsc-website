'use client';

import type { Sponsor, QueryError } from '@/types/database';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';
import Slab from '@/components/ui/slab';
import Skeleton from '@/components/ui/skeleton';
import LogoCard from '@/components/sponsors/logo-card';

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

  The whole wall sits on --logo-ground with light ink, rather than each tile
  carrying its own dark patch on a light slab, which read as a grid of
  stickers. The marks sit directly on the section ground.

  The slab and the tier bar are outside the async wrapper: both are known
  before the query resolves, so they paint immediately and only the grid
  inside fills in.
*/
export default function LogoWall({ sponsors, loading, error, onRetry }: LogoWallProps) {
  return (
    <Slab tone="logo">
      <div className="mb-6 flex items-center gap-3">
        <span className="h-1 w-10 rounded-pill bg-gold" aria-hidden="true" />
        <span className="label text-gold">Partners</span>
      </div>

      <AsyncStateWrapper
        loading={loading}
        error={error}
        data={sponsors}
        onRetry={onRetry}
        emptyMessage="No partners listed yet."
        skeleton={<WallSkeleton />}
      >
        <div className={GRID}>
          {sponsors.map((sponsor, index) => (
            <LogoCard key={sponsor.id} sponsor={sponsor} rank={index} total={sponsors.length} />
          ))}
        </div>
      </AsyncStateWrapper>
    </Slab>
  );
}
