'use client';

import Slab from '@/components/ui/slab';
import CentredHead from '@/components/ui/centred-head';
import { EditableButton } from '@/edit';
import type { SiteContentKey } from '@/lib/site-content-defaults';

/*
  ClosingBand: the last section of every public page.

  The page ends by restating the promise next to the one action. A velvet
  accent slab with the sweep ribbon (bottom edge to right edge), Slab Clip
  on arrival, and a CentredHead: eyebrow, the title, one line of copy, the
  button. On an accent slab the primary takes the page fill on its own.

  The default is the home headline with Apply to join, read from the same
  keys as the hero and the nav, so one edit changes every placement. A page
  that sells something else passes its own keys and its own `action`, for
  example the Partners page with a "Become a partner" button that opens the
  contact form.

  It is the page's one loud slab: nothing above it on the page may be
  inverse or accent, and the section directly above it is not accent.

  design-system/components.md, ClosingBand.
*/

/** The hero headline, repeated. */
export const HOME_HEADLINE_KEYS: SiteContentKey[] = [
  'home.hero.title_line1',
  'home.hero.title_line2',
  'home.hero.title_line3',
  'home.hero.title_line4',
];

interface ClosingBandProps {
  /** One key per visual line. Defaults to the home headline. */
  titleKeys?: SiteContentKey[];
  eyebrowKey?: SiteContentKey;
  /** One line of copy under the title. Pass null for none. */
  bodyKey?: SiteContentKey | null;
  /** The band's one button. Defaults to Apply to join. */
  action?: React.ReactNode;
  /** The heading id the section is labelled by. Unique per page. */
  id?: string;
}

export default function ClosingBand({
  titleKeys = HOME_HEADLINE_KEYS,
  eyebrowKey = 'home.cta.eyebrow',
  bodyKey = 'home.cta.subtitle',
  action,
  id = 'closing-heading',
}: ClosingBandProps) {
  return (
    <Slab
      tone="accent"
      texture="sweep"
      clip
      overflowHidden
      aria-labelledby={id}
      className="py-[clamp(4.5rem,10vw,8rem)]!"
    >
      <CentredHead
        id={id}
        eyebrowKey={eyebrowKey}
        titleKeys={titleKeys}
        bodyKey={bodyKey ?? undefined}
        bodyRole="subtitle"
      >
        {action ?? (
          <EditableButton labelKey="home.cta.button_label" hrefKey="home.cta.button_href" arrow />
        )}
      </CentredHead>
    </Slab>
  );
}
