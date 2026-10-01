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
function scaleFor(rank: number, total: number): Scale {
  if (total <= 3) return rank === 0 ? 'lead' : 'std';
  const third = Math.ceil(total / 3);
  if (rank < third) return 'lead';
  if (rank < third * 2) return 'mid';
  return 'std';
}

const logoHeights: Record<Scale, string> = {
  lead: 'h-16 sm:h-24',
  mid: 'h-12 sm:h-16',
  std: 'h-10 sm:h-12',
};

const spanClass: Record<Scale, string> = {
  lead: 'col-span-2',
  mid: '',
  std: '',
};

export default function LogoCard({ sponsor, rank, total, onReady }: LogoCardProps) {
  const logoUrl = getPublicUrl('sponsor-logos', sponsor.logo_path ?? null);
  const scale = scaleFor(rank, total);

  /*
    The tile is the constant dark logo ground. The wall behind it is sunken,
    so the black plate is visible in both themes, and a light-on-transparent
    mark still has the ground it was drawn for.
  */
  const tileClass = [
    'group flex aspect-[3/2] items-center justify-center overflow-hidden rounded-md bg-logo-ground p-4',
    spanClass[scale],
  ]
    .filter(Boolean)
    .join(' ');

  /*
    The plate stays put. Scaling it covered the next tile and read as a pop.
    The mark eases up on --d-move and --e-move, the same pair a row uses when
    it shifts, and only far enough to notice.
  */
  const markClass = sponsor.link
    ? 'flex w-full items-center justify-center transition-transform duration-[var(--d-move)] ease-move group-hover:scale-[1.03] group-focus-visible:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100'
    : 'flex w-full items-center justify-center';

  // Never redraw a sponsor's mark: use their file, or fall back to the name
  // set in the display face, in the same tile.
  const content = logoUrl ? (
    <RevealImage
      src={logoUrl}
      alt={`${sponsor.name} logo`}
      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
      className={`w-full ${logoHeights[scale]}`}
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
