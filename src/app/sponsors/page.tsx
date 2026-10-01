'use client';

import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import type { Sponsor } from '@/types/database';
import Eyebrow from '@/components/ui/eyebrow';
import { useReveal } from '@/lib/reveal';
import LogoWall from '@/components/sponsors/logo-wall';
import { useSiteContent } from '@/providers/site-content-provider';

/*
  A page is a stack of slabs on --page, inset by the gutter. The title block
  sits bare on --page, which is what keeps the stack from reading as a list
  of cards (design-system/README.md, Layout).
*/
export default function SponsorsPage() {
  const { data: sponsors, loading, error, refetch } = useSupabaseQuery<Sponsor>('sponsors', {
    /* Not redundant with RLS: a signed-in admin can read inactive rows. */
    filters: [{ column: 'active', operator: 'eq', value: true }],
  });
  const titleRef = useReveal<HTMLDivElement>();
  const { text } = useSiteContent();

  return (
    <main
      style={{
        paddingInline: 'var(--gut)',
        paddingTop: 'clamp(6rem, 10vw, 9rem)',
        paddingBottom: 'clamp(4rem, 8vw, 7rem)',
      }}
    >
      <div ref={titleRef} className="mb-10">
        <Eyebrow className="mb-3 block">{text('partners.header.eyebrow')}</Eyebrow>
        <h1 className="title">
          <span className="ln">
            <i>{text('partners.header.title')}</i>
          </span>
        </h1>
      </div>

      <div className="stack">
        <LogoWall sponsors={sponsors} loading={loading} error={error} onRetry={refetch} />
      </div>
    </main>
  );
}
