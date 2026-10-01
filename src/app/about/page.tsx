'use client';

import Eyebrow from '@/components/ui/eyebrow';
import { useReveal } from '@/lib/reveal';
import StorySection from '@/components/about/story-section';

/*
  The title sits bare on --page. StorySection is the one grid under it:
  four text cells and two photographs. Nothing else wraps the page.
*/
export default function AboutPage() {
  const titleRef = useReveal<HTMLDivElement>();

  return (
    <main
      style={{
        paddingInline: 'var(--gut)',
        paddingTop: 'clamp(6rem, 10vw, 9rem)',
        paddingBottom: 'clamp(4rem, 8vw, 7rem)',
      }}
    >
      <div ref={titleRef} className="mb-10">
        <Eyebrow className="mb-3 block">About</Eyebrow>
        <h1 className="title">
          <span className="ln">
            <i>What Western Sales Club does.</i>
          </span>
        </h1>
      </div>

      <StorySection />
    </main>
  );
}
