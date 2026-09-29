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
          Clip Reveal, sequence 9: the frame unclips while the photo settles
          from 1.06, so frame and content arrive at different rates. The cell
          is --r-md with overflow hidden so the image inherits the corner.
        */}
        <figure className="clip-cell relative m-0 aspect-[3/2] w-full overflow-hidden rounded-md">
          <Image
            src="/Sales-Comp.jpeg"
            alt="Western Sales Club members at a sales competition"
            fill
            sizes="(max-width: 700px) 100vw, 900px"
            className="clip-inner object-cover"
          />
        </figure>

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
