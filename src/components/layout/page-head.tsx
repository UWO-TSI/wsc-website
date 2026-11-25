'use client';

import Slab from '@/components/ui/slab';
import CentredHead from '@/components/ui/centred-head';
import type { SiteContentKey } from '@/lib/site-content-defaults';

/*
  PageHead: the first section of every public page other than home.

  An inverse slab with the waist ribbon holding a CentredHead as the page's
  h1. With the ClosingBand it is the one other loud slab a page may carry.

  The padding is the hero's, so every page opens at the same height: the
  top clears the fixed nav pill (62px tall at 375, 70px at 1280) with room
  for the eyebrow, and the bottom matches the hero's.

  design-system/components.md, PageHead.
*/

interface PageHeadProps {
  /** One key per visual line. */
  titleKeys?: SiteContentKey[];
  /** Fixed lines for a page whose copy is not in site_content. */
  titleLines?: string[];
  eyebrowKey?: SiteContentKey;
  /** At most three lines of copy under the title. */
  bodyKey?: SiteContentKey;
  /** The h1 id the section is labelled by. */
  id: string;
}

export default function PageHead({ titleKeys, titleLines, eyebrowKey, bodyKey, id }: PageHeadProps) {
  return (
    <Slab
      tone="inverse"
      texture="waist"
      overflowHidden
      aria-labelledby={id}
      className="pt-[clamp(7.5rem,14vw,11rem)]! pb-[var(--pad-section)]!"
    >
      <CentredHead
        as="h1"
        id={id}
        eyebrowKey={eyebrowKey}
        titleKeys={titleKeys}
        titleLines={titleLines}
        bodyKey={bodyKey}
      />
    </Slab>
  );
}
