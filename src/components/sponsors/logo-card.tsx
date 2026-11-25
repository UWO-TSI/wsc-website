'use client';

import RevealImage from '@/components/ui/reveal-image';
import type { Sponsor } from '@/types/database';
import { getPublicUrl } from '@/lib/supabase/storage';

interface LogoCardProps {
  sponsor: Sponsor;
  /** Position in display_order, zero-based. Carries the tile's scale. */
  rank: number;
  total: number;
  /** The wall calls this when the mark has decoded or failed. */
  onReady?: () => void;
}

type Scale = 'lead' | 'mid' | 'std';

/*
  There is no tier column to key off, so scale is taken from display_order:
  the first third of the wall reads large, the next third medium, the rest
  standard. Tile scale carries the hierarchy, not a border.
*/
export function scaleFor(rank: number, total: number): Scale {
  if (total <= 3) return rank === 0 ? 'lead' : 'std';
  const third = Math.ceil(total / 3);
  if (rank < third) return 'lead';
  if (rank < third * 2) return 'mid';
  return 'std';
}

/*
  Each scale is a fixed box the mark is contained in, so a wide wordmark and
  a square mark of the same scale read at about the same weight. The wall's
  skeleton uses the same boxes.
*/
export const TILE_SIZE: Record<Scale, string> = {
  lead: 'h-20 w-56 sm:h-24 sm:w-72',
  mid: 'h-16 w-44 sm:h-20 sm:w-56',
  std: 'h-12 w-36 sm:h-16 sm:w-44',
};

export default function LogoCard({ sponsor, rank, total, onReady }: LogoCardProps) {
  const logoUrl = getPublicUrl('sponsor-logos', sponsor.logo_path ?? null);
  const scale = scaleFor(rank, total);

  /*
    No plate behind the mark: the wall itself is the --logo-ground slab, so a
    light-on-transparent mark has the ground it was drawn for. The tile keeps
    its frame and corner only for layout and the focus ring.
  */
  const tileClass = [
    'group flex flex-none items-center justify-center overflow-hidden rounded-md p-2',
    TILE_SIZE[scale],
  ]
    .filter(Boolean)
    .join(' ');

  /*
    The plate stays put. Scaling it covered the next tile and read as a pop.
    The mark eases up on --d-move and --e-move, the same pair a row uses when
    it shifts, and only far enough to notice.
  */
  const markClass = sponsor.link
    ? 'flex h-full w-full items-center justify-center transition-transform duration-[var(--d-move)] ease-move group-hover:scale-[1.03] group-focus-visible:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100'
    : 'flex h-full w-full items-center justify-center';

  // Never redraw a sponsor's mark: use their file, or fall back to the name
  // set in the display face, in the same tile.
  const content = logoUrl ? (
    <RevealImage
      src={logoUrl}
      alt={`${sponsor.name} logo`}
      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
      className="h-full w-full"
      fit="contain"
      sequence="fade"
      hold
      onReady={onReady}
    />
  ) : (
    <span className="text-center font-display font-bold uppercase text-on-logo-ground">
      {sponsor.name}
    </span>
  );

  if (sponsor.link) {
    return (
      <a
        href={sponsor.link}
        target="_blank"
        rel="noopener noreferrer"
        className={tileClass}
        aria-label={`${sponsor.name}, opens in a new tab`}
        data-cursor="view"
      >
        <span className={markClass}>{content}</span>
      </a>
    );
  }

  return (
    <div className={tileClass} data-cursor="hover">
      {content}
    </div>
  );
}
