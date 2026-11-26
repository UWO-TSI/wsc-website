'use client';

import PageHead from '@/components/layout/page-head';
import StorySection from '@/components/about/story-section';
import ClosingBand from '@/components/layout/closing-band';

/*
  The page head, then the production About layout: one grid of four facts
  and two photographs (StorySection), then the closing band.
*/
export default function AboutPage() {
  return (
    <div className="stack">
      <PageHead id="about-title" texture="rise" titleKeys={['about.header.title']} />
      <StorySection />
      <ClosingBand />
    </div>
  );
}
