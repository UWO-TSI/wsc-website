'use client';

import Image from 'next/image';
import Button from '@/components/ui/button';
import Slab from '@/components/ui/slab';
import SectionHead from '@/components/ui/section-head';
import StatFigure from '@/components/ui/stat-figure';
import { useReveal } from '@/lib/reveal';

/*
  About: a SectionHead, running copy at the measure, and the three
  StatFigures. These numbers are the club's own existing claims
  (design-system/adoption.md, "Data decisions taken during adoption"): do not
  add a fourth, do not invent one.
*/
/*
  Optimized derivatives from public/web/. The camera-resolution originals are
  archived in assets/originals/ and are not deployed: see
  scripts/optimize-photos.mjs.
*/
const PHOTOS = [
  { src: '/web/sales-comp-1.avif', alt: 'Western Sales Club members at a sales competition' },
  { src: '/web/vantage-1.avif', alt: 'Western Sales Club members at a club event' },
  { src: '/web/sales-comp-3.avif', alt: 'Western Sales Club members presenting' },
] as const;

export default function AboutSection() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <Slab tone="raised" className="mx-[var(--gut)]" aria-labelledby="about-heading">
      <div ref={ref} className="flex flex-col gap-10">
        <SectionHead
          eyebrow="About"
          index="01"
          id="about-heading"
          title={['A sales floor', 'run by students']}
        />

        <p className="body measure">
          Western Sales Club is a student-run organization at Western University.
          We run workshops and events through the year, and connect members with
          people who sell for a living.
        </p>

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
          {PHOTOS.map((photo, i) => (
            <li key={photo.src} className="contents">
              <figure
                style={{ '--i': i } as React.CSSProperties}
                className="clip-cell relative m-0 aspect-[4/3] overflow-hidden rounded-md"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 700px) 33vw, 280px"
                  className="clip-inner object-cover"
                />
              </figure>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-10 sm:gap-16">
          <StatFigure value={150} suffix="+" label="Members" />
          <StatFigure value={10} suffix="+" label="Annual events" />
          <StatFigure value={5} suffix="+" label="Industry partners" />
        </div>

        <div>
          <Button href="/about" variant="tertiary" arrow>
            Learn about the club
          </Button>
        </div>
      </div>
    </Slab>
  );
}
