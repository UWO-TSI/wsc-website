'use client';

import Slab from '@/components/ui/slab';
import CentredHead from '@/components/ui/centred-head';
import { EditableImage, EditableText } from '@/edit';
import { useReveal } from '@/lib/reveal';
import type { SiteContentKey } from '@/lib/site-content-defaults';
import type { ImageSlotKey } from '@/lib/image-slots';

/*
  Four facts, each a full-width section, with the two photographs inside
  the first and third. The sections sit 2px apart in the page's stack.

  The head of each fact is centred (eyebrow with its numeral, then the
  title), and its paragraphs stay left-aligned under it at the reading
  measure: the head sells, the paragraphs are read.

  Tones alternate so no two neighbours match, and none is loud: the page
  head and the closing band are the page's dark and velvet slabs. The
  last fact sits directly above the closing band, so it is not accent.

  The words are editable (about.story.factN_*) and the photographs are
  slots (about.story.imageN). The numeral, the tone and the photo
  placement are layout, so they stay here. Both photographs are 3/2, the
  frame they were delivered in, with Clip Reveal. The paragraphs use
  arrive, one per section.
*/

interface Fact {
  index: string;
  fact: 1 | 2 | 3 | 4;
  tone: 'raised' | 'page' | 'sunken';
  photo?: ImageSlotKey;
}

const FACTS: Fact[] = [
  { index: '01', fact: 1, tone: 'raised', photo: 'about.story.image1' },
  { index: '02', fact: 2, tone: 'page' },
  { index: '03', fact: 3, tone: 'sunken', photo: 'about.story.image2' },
  { index: '04', fact: 4, tone: 'raised' },
];

function FactSection({ fact }: { fact: Fact }) {
  const ref = useReveal<HTMLDivElement>();
  const key = (part: string) => `about.story.fact${fact.fact}_${part}` as SiteContentKey;
  const headingId = `about-fact${fact.fact}-heading`;

  return (
    <Slab tone={fact.tone} aria-labelledby={headingId}>
      <div ref={ref} className="flex flex-col gap-8 py-[clamp(1rem,4vw,2.5rem)]">
        <CentredHead
          id={headingId}
          index={fact.index}
          eyebrowKey={key('eyebrow')}
          titleKeys={[key('title')]}
        />

        {/* An empty second paragraph renders nothing rather than a gap. */}
        <div className="arrive mx-auto flex w-full max-w-[62ch] flex-col gap-3 text-left">
          <EditableText k={key('body1')} as="p" className="body measure" />
          <EditableText k={key('body2')} as="p" className="body measure" />
        </div>

        {fact.photo && (
          <figure className="m-0 mx-auto w-full max-w-[960px]">
            <EditableImage
              slot={fact.photo}
              sizes="(max-width: 1040px) 100vw, 960px"
              className="aspect-[3/2] w-full rounded-md"
            />
          </figure>
        )}
      </div>
    </Slab>
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
