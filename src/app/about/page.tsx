'use client';

import PageHead from '@/components/layout/page-head';
import StorySection from '@/components/about/story-section';
import ClosingBand from '@/components/layout/closing-band';

/*
  Page head, the four facts, then the default closing band.
*/
export default function AboutPage() {
  return (
    <div className="stack">
      <PageHead
        id="about-title"
        eyebrowKey="about.header.eyebrow"
        titleKeys={['about.header.title']}
      />

      <StorySection />

      <ClosingBand />
    </div>
  );
}
