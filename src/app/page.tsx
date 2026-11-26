'use client';

import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import type { Event, Sponsor } from '@/types/database';
import Hero from '@/components/landing/hero';
import PartnersMarquee from '@/components/landing/partners-marquee';
import FormatsSection from '@/components/landing/formats-section';
import ProofBand from '@/components/landing/proof-band';
import EventsPreview from '@/components/landing/events-preview';
import AudienceSplit from '@/components/landing/audience-split';
import ClosingBand from '@/components/layout/closing-band';
import { EditableButton } from '@/edit';

/*
  The sales order, proof first: the promise with photos of the club at work
  (hero), the companies it works with (brand strip), the three formats with
  a photo each, the record in numbers (proof band), the next event, one
  tile per audience, and both buttons again (closing band).

  Tones, top to bottom: page, logo, raised, inverse, page, sunken, accent.
  No two neighbours share a tone, and inverse and accent never touch. Home
  has no PageHead, so its one inverse slab is the proof band
  (design-system/adoption.md, Before you call a component done, rule 4).

  The visibility filters are not redundant with RLS. Anonymous visitors only
  ever get published rows, but RLS lets a signed-in admin read drafts, and an
  admin browsing the public site in the same browser must see what the public
  sees.
*/
const PUBLISHED = [{ column: 'published', operator: 'eq', value: true }];
const ACTIVE = [{ column: 'active', operator: 'eq', value: true }];

export default function LandingPage() {
  const {
    data: events,
    loading: eventsLoading,
    error: eventsError,
  } = useSupabaseQuery<Event>('events', {
    orderBy: 'date',
    ascending: false,
    thenBy: 'created_at',
    filters: PUBLISHED,
  });

  const {
    data: sponsors,
    loading: sponsorsLoading,
  } = useSupabaseQuery<Sponsor>('sponsors', { filters: ACTIVE });

  return (
    <div className="stack">
      <Hero />
      <PartnersMarquee sponsors={sponsors} loading={sponsorsLoading} />
      <FormatsSection />
      <ProofBand />
      <EventsPreview events={events} loading={eventsLoading} error={eventsError} />
      <AudienceSplit />
      <ClosingBand
        businessAction={
          <EditableButton
            labelKey="home.hero.partner_label"
            hrefKey="home.hero.partner_href"
            variant="secondary"
          />
        }
      />
    </div>
  );
}
