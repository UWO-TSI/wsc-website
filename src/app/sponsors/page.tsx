'use client';

import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import type { Sponsor } from '@/types/database';
import Slab from '@/components/ui/slab';
import CentredHead from '@/components/ui/centred-head';
import LogoWall from '@/components/sponsors/logo-wall';
import ClosingBand from '@/components/layout/closing-band';
import { EditableButton } from '@/edit';

/*
  Page head, the logo wall, then the closing band. The band's business
  action is Become a partner, which opens the contact form with the
  organization type already set to sponsor; Apply to join stays beside it.
*/
const ACTIVE = [{ column: 'active', operator: 'eq', value: true }];

export default function SponsorsPage() {
  const { data: sponsors, loading, error, refetch } = useSupabaseQuery<Sponsor>('sponsors', {
    /* Not redundant with RLS: a signed-in admin can read inactive rows. */
    filters: ACTIVE,
  });

  return (
    <div className="stack">
      <Slab
        tone="inverse"
        texture="waist"
        overflowHidden
        aria-labelledby="partners-title"
        className="pt-[clamp(7.5rem,12vw,10rem)]! pb-[clamp(3.5rem,7vw,5.5rem)]!"
      >
        <CentredHead
          as="h1"
          id="partners-title"
          eyebrowKey="partners.header.eyebrow"
          titleKeys={['partners.header.title']}
        />
      </Slab>

      <LogoWall sponsors={sponsors} loading={loading} error={error} onRetry={refetch} />

      <ClosingBand
        businessAction={
          <EditableButton
            labelKey="sponsors.cta.partner_label"
            hrefKey="sponsors.cta.partner_href"
            variant="secondary"
          />
        }
      />
    </div>
  );
}
