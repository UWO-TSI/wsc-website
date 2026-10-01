'use client';

import Eyebrow from '@/components/ui/eyebrow';
import RevealImage from '@/components/ui/reveal-image';
import Slab, { type SlabTone } from '@/components/ui/slab';
import { useReveal } from '@/lib/reveal';
import { useSiteContent } from '@/providers/site-content-provider';
import type { SiteContentKey } from '@/lib/site-content-defaults';
import type { ImageSlotKey } from '@/lib/image-slots';

/*
  Four facts and two photographs on one grid. The gallery section is gone;
  the photographs belong to the same read as the copy.

  From lg each photograph spans the two facts beside it, so a 3/2 frame
  is about as tall as the copy and the slab is not an empty field under
  a short paragraph. The top pair is raised, then bare, with the
  competition photograph on the right. The bottom pair swaps: the group
  photograph on the left, sunken then inverse on the right. Those two
  slabs are the only ones that share an edge, and inverse is the one
  loud slab. The photographs meet at a corner, with the page gap between
  them, and never share a full side.

  Below lg, `order` stacks the cells in reading order: fact, photograph,
  fact, photograph, then the closing pair. From md that is two columns.
  Explicit lg placement ignores that order.

  Both photographs are 3/2, which is the frame they were delivered in, so
  the crop does not cut the group off at the sides. Clip Reveal is theirs.
  The four facts use arrive, staggered by --i, under the budget of five.

  Headings are .title-sm. The page h1 is the only .title.
*/

type Tone = SlabTone | 'bare';

/*
  The words are editable (about.story.factN_*) and the photographs are
  slots (about.story.imageN). What stays here is the layout: the index,
  the tone and the grid placement of each cell.
*/
interface TextCell {
  kind: 'text';
  index: string;
  fact: 1 | 2 | 3 | 4;
  tone: Tone;
  place: string;
}

interface PhotoCell {
  kind: 'photo';
  slot: ImageSlotKey;
  sizes: string;
  place: string;
}

type Cell = TextCell | PhotoCell;

const CELLS: Cell[] = [
  {
    kind: 'text',
    index: '01',
    fact: 1,
    tone: 'raised',
    place: 'order-1 lg:col-start-1 lg:col-span-5 lg:row-start-1',
  },
  {
    kind: 'photo',
    slot: 'about.story.image1',
    sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 58vw',
    place: 'order-2 lg:col-start-6 lg:col-span-7 lg:row-start-1 lg:row-span-2',
  },
  {
    kind: 'text',
    index: '02',
    fact: 2,
    tone: 'bare',
    place: 'order-3 lg:col-start-1 lg:col-span-5 lg:row-start-2',
  },
  {
    kind: 'photo',
    slot: 'about.story.image2',
    sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 58vw',
    place: 'order-4 lg:col-start-1 lg:col-span-7 lg:row-start-3 lg:row-span-2',
  },
  {
    kind: 'text',
    index: '03',
    fact: 3,
    tone: 'sunken',
    place: 'order-5 lg:col-start-8 lg:col-span-5 lg:row-start-3',
  },
  {
    kind: 'text',
    index: '04',
    fact: 4,
    tone: 'inverse',
    place: 'order-6 lg:col-start-8 lg:col-span-5 lg:row-start-4',
  },
];

function TextPanel({ cell, stagger }: { cell: TextCell; stagger: number }) {
  const { text } = useSiteContent();
  const key = (part: string) => `about.story.fact${cell.fact}_${part}` as SiteContentKey;
  /* A second paragraph left empty is dropped rather than leaving a gap. */
  const body = [text(key('body1')), text(key('body2'))].filter(Boolean);

  const style = { '--i': stagger } as React.CSSProperties;
  const copy = (
    <div className="flex flex-col gap-3">
      <Eyebrow index={cell.index}>{text(key('eyebrow'))}</Eyebrow>
      <h2 className="title-sm">{text(key('title'))}</h2>
      {body.map((paragraph, i) => (
        <p key={i} className="body measure">
          {paragraph}
        </p>
      ))}
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

function PhotoPanel({ cell }: { cell: PhotoCell }) {
  const { image } = useSiteContent();

  return (
    <figure className={`m-0 min-w-0 ${cell.place}`}>
      <RevealImage
        {...image(cell.slot)}
        sizes={cell.sizes}
        className="aspect-[3/2] h-full w-full rounded-md"
      />
    </figure>
  );
}

export default function StorySection() {
  const ref = useReveal<HTMLDivElement>();
  const textCells = CELLS.filter((cell) => cell.kind === 'text');

  return (
    <div ref={ref} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12">
      {CELLS.map((cell) => {
        if (cell.kind === 'photo') {
          return <PhotoPanel key={cell.slot} cell={cell} />;
        }

        return (
          <TextPanel
            key={cell.index}
            cell={cell}
            stagger={textCells.indexOf(cell)}
          />
        );
      })}
    </div>
  );
}
