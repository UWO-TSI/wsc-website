'use client';

import Slab from '@/components/ui/slab';
import CentredHead from '@/components/ui/centred-head';
import { EditableButton } from '@/edit';
import type { SiteContentKey } from '@/lib/site-content-defaults';

/*
  ClosingBand: the last section of every public page.

  A velvet accent slab with the sweep ribbon (bottom edge to right edge),
  Slab Clip on arrival, and a CentredHead: the title Join, one or two
  sentences of copy, then two buttons side by side. Apply to join is for
  students, who buy a membership. The business button is for companies,
  who get in touch. On an accent slab the primary takes the page fill and
  the secondary takes the slab's own ink, both on their own.

  Apply to join reads home.cta.button_*, the same keys as the hero, the nav
  and About, so one edit changes every placement. A page replaces the
  business button through `businessAction`: the Partners page passes
  "Become a partner", which opens the contact form.

  It is the page's one loud slab: nothing above it on the page may be
  inverse or accent, and the section directly above it is not accent.

  design-system/components.md, ClosingBand.
*/

interface ClosingBandProps {
  /** One key per visual line. Defaults to the Join title. */
  titleKeys?: SiteContentKey[];
  /** Off by default: an eyebrow over the title Join repeats it. */
  eyebrowKey?: SiteContentKey;
  /** One or two sentences under the title. Pass null for none. */
  bodyKey?: SiteContentKey | null;
  /** The second button, after Apply to join. Defaults to Get in touch. */
  businessAction?: React.ReactNode;
  /** The heading id the section is labelled by. Unique per page. */
  id?: string;
}

export default function ClosingBand({
  titleKeys = ['home.cta.title_line1'],
  eyebrowKey,
  bodyKey = 'home.cta.subtitle',
  businessAction,
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
        <EditableButton labelKey="home.cta.button_label" hrefKey="home.cta.button_href" arrow />
        {businessAction ?? (
          <EditableButton
            labelKey="home.cta.business_label"
            hrefKey="home.cta.business_href"
            variant="secondary"
          />
        )}
      </CentredHead>
    </Slab>
  );
}
