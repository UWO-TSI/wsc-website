'use client';

import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import type { Event, Sponsor } from '@/types/database';
import Hero from '@/components/landing/hero';
import AboutSection from '@/components/landing/about-section';
import EventsPreview from '@/components/landing/events-preview';
import PartnersMarquee from '@/components/landing/partners-marquee';
import ContactSection from '@/components/landing/contact-section';
import CTASection from '@/components/landing/cta-section';

/*
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
      <AboutSection />
      <EventsPreview events={events} loading={eventsLoading} error={eventsError} />
      <PartnersMarquee sponsors={sponsors} loading={sponsorsLoading} />
      <ContactSection />
      <CTASection />
    </div>
  );
}
