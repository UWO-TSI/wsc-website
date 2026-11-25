'use client';

import Slab from '@/components/ui/slab';
import CentredHead from '@/components/ui/centred-head';
import StorySection from '@/components/about/story-section';
import ClosingBand from '@/components/layout/closing-band';

/*
  Page head, the four facts, then the default closing band.
*/
export default function AboutPage() {
  return (
    <div className="stack">
      <Slab
        tone="inverse"
        texture="waist"
        overflowHidden
        aria-labelledby="about-title"
        className="pt-[clamp(7.5rem,12vw,10rem)]! pb-[clamp(3.5rem,7vw,5.5rem)]!"
      >
        <CentredHead
          as="h1"
          id="about-title"
          eyebrowKey="about.header.eyebrow"
          titleKeys={['about.header.title']}
        />
      </Slab>

      <StorySection />

      <ClosingBand />
    </div>
  );
}
