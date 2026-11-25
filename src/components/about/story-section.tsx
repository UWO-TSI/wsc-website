'use client';

import SectionHead from '@/components/ui/section-head';
import { EditableImage, EditableText } from '@/edit';
import { useReveal } from '@/lib/reveal';
import type { SiteContentKey } from '@/lib/site-content-defaults';
import type { ImageSlotKey } from '@/lib/image-slots';

/*
  Four facts, each a section bare on the page ground, with the two
  photographs inside the first and third. The page head and the closing
  band are the page's containers; the facts between them are read, so they
  carry no tint and are separated by room (--pad-section above and below
  each one).

  Each fact is left-aligned, head included: the eyebrow with its numeral,
  the title, the paragraphs at the reading measure and the photo all start
  from the gutter, the edge the eye returns to.

  The words are editable (about.story.factN_*) and the photographs are
  slots (about.story.imageN). The numeral and the photo placement are
  layout, so they stay here. Both photographs are 3/2, the frame they were
  delivered in, with Clip Reveal. The paragraphs use arrive, one per
  section.
*/

interface Fact {
  index: string;
  fact: 1 | 2 | 3 | 4;
  photo?: ImageSlotKey;
}

const FACTS: Fact[] = [
  { index: '01', fact: 1, photo: 'about.story.image1' },
  { index: '02', fact: 2 },
  { index: '03', fact: 3, photo: 'about.story.image2' },
  { index: '04', fact: 4 },
];

function FactSection({ fact }: { fact: Fact }) {
  const ref = useReveal<HTMLDivElement>();
  const key = (part: string) => `about.story.fact${fact.fact}_${part}` as SiteContentKey;
  const headingId = `about-fact${fact.fact}-heading`;

  return (
    <section aria-labelledby={headingId} className="px-[var(--gut)] py-[var(--pad-section)]">
      <div ref={ref} className="flex flex-col gap-8">
        <SectionHead
          id={headingId}
          index={fact.index}
          eyebrowKey={key('eyebrow')}
          titleKeys={[key('title')]}
        />

        {/* An empty second paragraph renders nothing rather than a gap. */}
        <div className="arrive flex w-full max-w-[62ch] flex-col gap-3">
          <EditableText k={key('body1')} as="p" className="body measure" />
          <EditableText k={key('body2')} as="p" className="body measure" />
        </div>

        {fact.photo && (
          <figure className="m-0 w-full max-w-[960px]">
            <EditableImage
              slot={fact.photo}
              sizes="(max-width: 1040px) 100vw, 960px"
              className="aspect-[3/2] w-full rounded-md"
            />
          </figure>
        )}
      </div>
    </section>
  );
}

export default function StorySection() {
  return (
    <>
      {FACTS.map((fact) => (
        <FactSection key={fact.index} fact={fact} />
      ))}
    </>
  );
}
