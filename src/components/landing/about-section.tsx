'use client';

import Button from '@/components/ui/button';
import Slab from '@/components/ui/slab';
import SectionHead from '@/components/ui/section-head';
import StatFigure from '@/components/ui/stat-figure';

/*
  About — a SectionHead, running copy at the measure, and the three
  StatFigures. These numbers are the club's own existing claims
  (design-system/adoption.md, "Data decisions taken during adoption"): do not
  add a fourth, do not invent one.
*/
export default function AboutSection() {
  return (
    <Slab tone="raised" className="mx-[var(--gut)]" aria-labelledby="about-heading">
      <div className="flex flex-col gap-10">
        <SectionHead
          eyebrow="About"
          index="01"
          id="about-heading"
          title={['A SALES FLOOR', 'RUN BY STUDENTS']}
        />

        <p className="body measure">
          Western Sales Club runs an outbound sales program for Western University
          students. Members cold call, pitch, and close for real partner companies,
          then compete in case-based sales competitions against other schools.
        </p>

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
