'use client';

import RevealImage from '@/components/ui/reveal-image';
import type { Sponsor } from '@/types/database';
import { externalLinkProps } from '@/lib/link-utils';

interface LogoCardProps {
  sponsor: Sponsor;
  /**
   * The mark's URL, or null for the name in the display face. The wall
   * resolves it: a logo drafted in edit mode first, then the stored object.
   */
  logoUrl: string | null;
  /** The wall calls this when the mark has decoded or failed. */
  onReady?: () => void;
}

type Scale = 'lead' | 'mid' | 'std';

/*
  The wall is a board: every partner gets the same large tile, and
  display_order is the only rank. Mixed tile sizes in one wrapping row read
  as a scatter rather than a board. The wall and its editor both take the
  size from here, so edit mode matches Preview.
*/
export function scaleFor(): Scale {
  return 'lead';
}

/*
  Each scale is a fixed box the mark is contained in, so a wide wordmark and
  a square mark of the same scale read at about the same weight. The wall's
  skeleton uses the same boxes.
*/
export const TILE_SIZE: Record<Scale, string> = {
  lead: 'h-24 w-64 sm:h-28 sm:w-80 xl:h-32 xl:w-96',
  mid: 'h-20 w-52 sm:h-24 sm:w-72',
  std: 'h-16 w-44 sm:h-20 sm:w-56',
};

export default function LogoCard({ sponsor, logoUrl, onReady }: LogoCardProps) {
  const scale = scaleFor();

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
  /*
    The tile is a link only for an http(s) address: rows from before the
    database check and draft values in Preview are never checked otherwise.
  */
  const link = sponsor.link?.trim() ?? '';
  const linkProps = externalLinkProps(link);
  const isLink = 'target' in linkProps;

  const markClass = isLink
    ? 'flex h-full w-full items-center justify-center transition-transform duration-[var(--d-move)] ease-move group-hover:scale-[1.03] group-focus-visible:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100'
    : 'flex h-full w-full items-center justify-center';

  // Never redraw a sponsor's mark: use their file, or fall back to the name
  // set in the display face, in the same tile.
  const content = logoUrl ? (
    <RevealImage
      src={logoUrl}
      alt={`${sponsor.name} logo`}
      sizes="(max-width: 640px) 70vw, 384px"
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

  if (isLink) {
    return (
      <a
        href={link}
        {...linkProps}
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
