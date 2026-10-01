'use client';

import RevealImage from '@/components/ui/reveal-image';
import Button from '@/components/ui/button';
import Slab from '@/components/ui/slab';
import SectionHead from '@/components/ui/section-head';
import StatFigure from '@/components/ui/stat-figure';
import { useReveal } from '@/lib/reveal';
import { useSiteContent } from '@/providers/site-content-provider';
import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import { SITE_STAT_FALLBACKS } from '@/lib/site-stat-fallbacks';
import type { SiteStat } from '@/types/database';

/*
  About: a SectionHead, running copy at the measure, and the three
  StatFigures. The figures are the club's own claims and live in site_stats,
  edited under Statistics in the admin. Three in a row at most, per
  StatFigure, so only the first three visible rows render.

  The fallback trio shows while the query is in flight and if it fails, so
  the row never appears half-built. Once it answers, the database wins.
*/
const PHOTO_SLOTS = ['home.about.image1', 'home.about.image2', 'home.about.image3'] as const;

export default function AboutSection() {
  const ref = useReveal<HTMLDivElement>();
  const { text, image } = useSiteContent();
  const { data, loading, error } = useSupabaseQuery<SiteStat>('site_stats');
  /* visible is filtered here too: a signed-in admin's RLS can read hidden
     rows, and a hidden stat must not show to them on the public page. */
  const stats = (loading || error ? SITE_STAT_FALLBACKS : data)
    .filter((stat) => stat.visible)
    .slice(0, 3);

  return (
    <Slab tone="raised" className="mx-[var(--gut)]" aria-labelledby="about-heading">
      <div ref={ref} className="flex flex-col gap-10">
        <SectionHead
          eyebrow={text('home.about.eyebrow')}
          index="01"
          id="about-heading"
          title={[text('home.about.title_line1'), text('home.about.title_line2')].filter(Boolean)}
        />

        <p className="body measure">{text('home.about.body')}</p>

        {/*
          A three-frame strip rather than one full-width photo. Blown up to the
          slab width a single shot was being upscaled past its own resolution
          and going soft; at a third of the width each frame is displayed at or
          below its native size and stays sharp.

          Clip Reveal, sequence 9: each cell unclips while its photo settles
          from 1.06, so frame and content arrive at different rates, staggered
          60ms in reading order by --i.
        */}
        <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0 sm:gap-3">
          {PHOTO_SLOTS.map((slot, i) => (
            <li key={slot} className="m-0">
              <RevealImage
                {...image(slot)}
                sizes="(max-width: 700px) 33vw, 280px"
                className="aspect-[4/3] w-full rounded-md"
                index={i}
              />
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-10 sm:gap-16">
          {stats.map((stat) => (
            <StatFigure
              key={stat.id}
              value={stat.value}
              suffix={stat.suffix ?? undefined}
              label={stat.label}
            />
          ))}
        </div>

        <div>
          <Button href="/about" variant="tertiary" arrow>
            {text('home.about.link_label')}
          </Button>
        </div>
      </div>
    </Slab>
  );
}
