'use client';

import type { Sponsor, QueryError } from '@/types/database';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';
import Slab from '@/components/ui/slab';
import LogoCard from '@/components/sponsors/logo-card';

interface LogoWallProps {
  sponsors: Sponsor[];
  loading: boolean;
  error: QueryError | null;
  onRetry?: () => void;
}

/*
  The sponsors table has no tier column, and hard rule 1 forbids touching
  supabase/, so every sponsor ships in one tier group: the gold bar and label
  reading "Partners". --gold, not --accent, because a sponsor's standing has
  to read the same in both themes. Tile scale carries the hierarchy inside
  that group, taken from display_order rather than an invented tier
  (design-system/adoption.md, Data decisions).
*/
export default function LogoWall({ sponsors, loading, error, onRetry }: LogoWallProps) {
  return (
    <AsyncStateWrapper
      loading={loading}
      error={error}
      data={sponsors}
      onRetry={onRetry}
      emptyMessage="No partners listed yet."
    >
      <Slab>
        <div className="mb-6 flex items-center gap-3">
          <span className="h-1 w-10 rounded-pill bg-gold" aria-hidden="true" />
          <span className="label text-gold">Partners</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {sponsors.map((sponsor, index) => (
            <LogoCard key={sponsor.id} sponsor={sponsor} rank={index} total={sponsors.length} />
          ))}
        </div>
      </Slab>
    </AsyncStateWrapper>
  );
}
