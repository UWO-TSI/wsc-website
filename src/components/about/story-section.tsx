'use client';

import Eyebrow from '@/components/ui/eyebrow';
import RevealImage from '@/components/ui/reveal-image';
import Slab, { type SlabTone } from '@/components/ui/slab';
import { useReveal } from '@/lib/reveal';

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

interface TextCell {
  kind: 'text';
  index: string;
  eyebrow: string;
  title: string;
  body: string[];
  tone: Tone;
  place: string;
}

interface PhotoCell {
  kind: 'photo';
  src: string;
  alt: string;
  sizes: string;
  place: string;
}

type Cell = TextCell | PhotoCell;

/*
  Only what the club can point at: the exec groups the executives table
  actually has, the partner and event counts already published as figures,
  the USC store the join button links to, and the contact address in the
  legal pages.
*/
const CELLS: Cell[] = [
  {
    kind: 'text',
    index: '01',
    eyebrow: 'What we do',
    title: 'Workshops and events, all year',
    body: [
      'Western Sales Club runs workshops and events through the year for students who want experience in sales before they graduate.',
      'Members learn from people who do the work, not only from a reading list.',
    ],
    tone: 'raised',
    place: 'order-1 lg:col-start-1 lg:col-span-5 lg:row-start-1',
  },
  {
    kind: 'photo',
    src: '/imagery/sales-comp-4.avif',
    alt: 'Western Sales Club members holding a competition prize cheque',
    sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 58vw',
    place: 'order-2 lg:col-start-6 lg:col-span-7 lg:row-start-1 lg:row-span-2',
  },
  {
    kind: 'text',
    index: '02',
    eyebrow: 'How we run',
    title: 'A student exec team',
    body: [
      'Presidents, vice presidents, and assistant vice presidents run the club.',
      'The roster is on the executive team page, and it turns over every year.',
    ],
    tone: 'bare',
    place: 'order-3 lg:col-start-1 lg:col-span-5 lg:row-start-2',
  },
  {
    kind: 'photo',
    src: '/imagery/sales-comp-5.avif',
    alt: 'Western Sales Club members standing with the club banner',
    sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 58vw',
    place: 'order-4 lg:col-start-1 lg:col-span-7 lg:row-start-3 lg:row-span-2',
  },
  {
    kind: 'text',
    index: '03',
    eyebrow: 'Who backs us',
    title: 'Five industry partners',
    body: [
      'Partners support the club and connect members with people working in the field.',
      'They are listed on the partners page.',
    ],
    tone: 'sunken',
    place: 'order-5 lg:col-start-8 lg:col-span-5 lg:row-start-3',
  },
  {
    kind: 'text',
    index: '04',
    eyebrow: 'How to join',
    title: 'Membership runs through the USC store',
    body: [
      'The club runs about ten events a year for its members.',
      'Questions go to sales.club@westernusc.ca.',
    ],
    tone: 'inverse',
    place: 'order-6 lg:col-start-8 lg:col-span-5 lg:row-start-4',
  },
];

function TextPanel({ cell, stagger }: { cell: TextCell; stagger: number }) {
  const style = { '--i': stagger } as React.CSSProperties;
  const copy = (
    <div className="flex flex-col gap-3">
      <Eyebrow index={cell.index}>{cell.eyebrow}</Eyebrow>
      <h2 className="title-sm">{cell.title}</h2>
      {cell.body.map((paragraph) => (
        <p key={paragraph} className="body measure">
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
  return (
    <figure className={`m-0 min-w-0 ${cell.place}`}>
      <RevealImage
        src={cell.src}
        alt={cell.alt}
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
          return <PhotoPanel key={cell.src} cell={cell} />;
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
