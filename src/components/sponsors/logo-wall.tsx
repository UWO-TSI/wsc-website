'use client';

import { useRef, useState } from 'react';
import type { Sponsor, QueryError } from '@/types/database';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';
import Slab from '@/components/ui/slab';
import Skeleton from '@/components/ui/skeleton';
import LogoCard, { TILE_SIZE } from '@/components/sponsors/logo-card';
import { getPublicUrl } from '@/lib/supabase/storage';
import { useReveal } from '@/lib/reveal';
import { useSiteContent } from '@/providers/site-content-provider';
import { EditableText, useDraftFile, useEditMode } from '@/edit';
import { ListEditBranch, useListEditBranch } from '@/edit/list-draft';

interface LogoWallProps {
  sponsors: Sponsor[];
  loading: boolean;
  error: QueryError | null;
  onRetry?: () => void;
}

/*
  A board: equal tiles in centred rows, three across on a laptop, with room
  around every mark. This page presents the partners, so each logo is larger
  and further apart than on the home brand strip.
*/
const WALL =
  'mx-auto flex max-w-[1300px] flex-wrap items-center justify-center gap-x-[clamp(2rem,5vw,4.5rem)] gap-y-[clamp(3rem,6vw,5rem)] py-[clamp(2.5rem,6vw,4.5rem)]';

/*
  Built to the same rows and tile sizes as the wall, so the layout does not
  reshuffle when the sponsors arrive.
*/
function WallSkeleton() {
  return (
    <div className={WALL}>
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton
          key={i}
          index={i}
          className={`rounded-md ${TILE_SIZE.lead}`}
        />
      ))}
    </div>
  );
}

/*
  The sponsors table has no tier column, and hard rule 1 forbids touching
  supabase/, so every sponsor ships in one tier group: the gold bar and label
  reading "Partners". --gold, not --accent, because a sponsor's standing has
  to read the same on every page. Inside that group every tile is the same
  size and display_order is the only rank, rather than an invented tier
  (design-system/adoption.md, Data decisions).

  The whole wall sits on the constant --logo-ground slab and the marks sit
  directly on it, the same treatment as the landing marquee. A dark plate
  per logo on a light bed read as a grid of separate dark patches
  (design-system/components.md, LogoWall).

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
function LogoGrid(props: { sponsors: Sponsor[] }) {
  /* While editing, the engine's wall editor renders instead (src/edit/list-draft.ts). */
  if (useListEditBranch()) return <ListEditBranch name="sponsors" props={props} />;
  return <LogoGridView {...props} />;
}

function LogoGridView({ sponsors }: { sponsors: Sponsor[] }) {
  /* A logo chosen in edit mode and not yet published shows in Preview. */
  const draftFile = useDraftFile('sponsors');
  const logoOf = (sponsor: Sponsor) =>
    draftFile(sponsor.id, 'logo_path') ?? getPublicUrl('sponsor-logos', sponsor.logo_path ?? null);

  const ids = sponsors.flatMap((sponsor) => (logoOf(sponsor) ? [sponsor.id] : []));
  const pending = useRef(new Set(ids));
  const [ready, setReady] = useState(ids.length === 0);
  const ref = useReveal<HTMLDivElement>({ ready });

  const settle = (id: string) => {
    if (!pending.current.delete(id)) return;
    if (pending.current.size === 0) setReady(true);
  };

  return (
    <div ref={ref} className={WALL}>
      {sponsors.map((sponsor) => (
        <LogoCard
          key={sponsor.id}
          sponsor={sponsor}
          logoUrl={logoOf(sponsor)}
          onReady={() => settle(sponsor.id)}
        />
      ))}
    </div>
  );
}

export default function LogoWall({ sponsors, loading, error, onRetry }: LogoWallProps) {
  const { text } = useSiteContent();
  const { editing } = useEditMode();

  return (
    <Slab tone="logo" aria-labelledby="partners-wall-label">
      <div className="flex items-center justify-center gap-3">
        <span className="h-1 w-10 rounded-pill bg-gold" aria-hidden="true" />
        {/* Important: the logo slab mutes every .label, and the tier mark is gold. */}
        <EditableText k="partners.wall.label" id="partners-wall-label" className="label text-gold!" />
      </div>

      <AsyncStateWrapper
        loading={loading}
        error={error}
        /* An empty wall still shows the editor, so its Add tile is there. */
        data={editing ? [editing] : sponsors}
        onRetry={onRetry}
        emptyMessage={text('partners.wall.empty')}
        skeleton={<WallSkeleton />}
      >
        <LogoGrid sponsors={sponsors} />
      </AsyncStateWrapper>
    </Slab>
  );
}
