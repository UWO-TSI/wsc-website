'use client';

import Image from 'next/image';
import type { Sponsor } from '@/types/database';
import { getPublicUrl } from '@/lib/supabase/storage';

interface LogoCardProps {
  sponsor: Sponsor;
  /** Position in display_order, zero-based. Carries the tile's scale. */
  rank: number;
  total: number;
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

export default function LogoCard({ sponsor, rank, total }: LogoCardProps) {
  const logoUrl = getPublicUrl('sponsor-logos', sponsor.logo_path ?? null);
  const scale = scaleFor(rank, total);

  const tileClass = [
    'flex aspect-[3/2] items-center justify-center rounded-md bg-sunken p-4 shadow-1',
    'transition-shadow duration-[var(--d-hover)] ease-enter',
    sponsor.link ? 'hover:shadow-2' : '',
    spanClass[scale],
  ]
    .filter(Boolean)
    .join(' ');

  // Never redraw a sponsor's mark: use their file, or fall back to the name
  // set in the display face, in the same tile.
  const content = logoUrl ? (
    <div className={`relative w-full ${logoHeights[scale]}`}>
      <Image
        src={logoUrl}
        alt={`${sponsor.name} logo`}
        fill
        className="object-contain"
        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
      />
    </div>
  ) : (
    <span className="text-center font-display font-bold uppercase text-ink">
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
        {content}
      </a>
    );
  }

  return (
    <div className={tileClass} data-cursor="hover">
      {content}
    </div>
  );
}
