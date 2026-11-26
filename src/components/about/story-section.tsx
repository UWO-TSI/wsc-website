'use client';

import Slab from '@/components/ui/slab';
import { EditableImage, EditableText, useEditMode } from '@/edit';
import { useReveal } from '@/lib/reveal';
import { useSiteContent } from '@/providers/site-content-provider';
import type { SiteContentKey } from '@/lib/site-content-defaults';
import type { ImageSlotKey } from '@/lib/image-slots';

/*
  The About page's one section: four facts and two photographs on one grid,
  the layout the production site uses.

  From lg each photograph spans the two facts beside it, so a 3/2 frame is
  about as tall as the copy. The top pair is a raised fact, then a bare one,
  with the competition photograph on the right. The bottom pair swaps: the
  group photograph on the left, a sunken fact then a raised one on the
  right. Production drew the last fact on inverse; here the page head is the
  page's one inverse container, so it is raised. The photographs meet at a
  corner with the grid gap between them and never share a full side.

  Below lg, `order` stacks the cells in reading order: fact, photograph,
  fact, photograph, then the last two facts. From md that is two columns.
  Explicit lg placement ignores that order.

  The words are editable (about.story.factN_*) and the photographs are slots
  (about.story.imageN). The four facts use arrive, staggered by --i, and the
  photographs use Clip Reveal. There are no eyebrows. Headings are
  .title-sm; the page head's h1 is the page's only .title.
*/

type Tone = 'raised' | 'sunken' | 'bare';

interface TextCell {
  kind: 'text';
  fact: 1 | 2 | 3 | 4;
  tone: Tone;
  place: string;
}

interface PhotoCell {
  kind: 'photo';
  slot: ImageSlotKey;
  place: string;
}

type Cell = TextCell | PhotoCell;

const SIZES = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 58vw';

const CELLS: Cell[] = [
  { kind: 'text', fact: 1, tone: 'raised', place: 'order-1 lg:col-start-1 lg:col-span-5 lg:row-start-1' },
  { kind: 'photo', slot: 'about.story.image1', place: 'order-2 lg:col-start-6 lg:col-span-7 lg:row-start-1 lg:row-span-2' },
  { kind: 'text', fact: 2, tone: 'bare', place: 'order-3 lg:col-start-1 lg:col-span-5 lg:row-start-2' },
  { kind: 'photo', slot: 'about.story.image2', place: 'order-4 lg:col-start-1 lg:col-span-7 lg:row-start-3 lg:row-span-2' },
  { kind: 'text', fact: 3, tone: 'sunken', place: 'order-5 lg:col-start-8 lg:col-span-5 lg:row-start-3' },
  { kind: 'text', fact: 4, tone: 'raised', place: 'order-6 lg:col-start-8 lg:col-span-5 lg:row-start-4' },
];

function TextPanel({ cell, stagger }: { cell: TextCell; stagger: number }) {
  const { text } = useSiteContent();
  const { editing } = useEditMode();
  const key = (part: string) => `about.story.fact${cell.fact}_${part}` as SiteContentKey;
  /* A second paragraph left empty is dropped rather than leaving a gap. */
  const showBody2 = editing || text(key('body2')) !== '';

  const style = { '--i': stagger } as React.CSSProperties;
  const copy = (
    <div className="flex flex-col gap-3">
      <EditableText k={key('title')} as="h2" className="title-sm m-0" />
      <EditableText k={key('body1')} as="p" className="body measure m-0" />
      {showBody2 && <EditableText k={key('body2')} as="p" className="body measure m-0" />}
    </div>
  );

  if (cell.tone === 'bare') {
    return (
      <div style={style} className={`arrive min-w-0 self-start px-1 py-2 ${cell.place}`}>
        {copy}
      </div>
    );
  }

  return (
    <div style={style} className={`arrive h-full min-w-0 ${cell.place}`}>
      <Slab as="div" tone={cell.tone} className="h-full">
        {copy}
      </Slab>
    </div>
  );
}

export default function StorySection() {
  const ref = useReveal<HTMLDivElement>();
  const textCells = CELLS.filter((cell) => cell.kind === 'text');

  return (
    <section aria-label="About the club" className="px-[var(--gut)] py-[var(--pad-section)]">
      <div ref={ref} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12">
        {CELLS.map((cell, i) =>
          cell.kind === 'photo' ? (
            <figure key={cell.slot} className={`m-0 min-w-0 ${cell.place}`}>
              <EditableImage
                slot={cell.slot}
                sizes={SIZES}
                className="aspect-[3/2] h-full w-full rounded-md"
                index={i}
              />
            </figure>
          ) : (
            <TextPanel key={cell.fact} cell={cell} stagger={textCells.indexOf(cell)} />
          )
        )}
      </div>
    </section>
  );
}
