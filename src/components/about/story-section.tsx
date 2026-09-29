'use client';

import Eyebrow from '@/components/ui/eyebrow';
import Slab, { type SlabTone } from '@/components/ui/slab';
import { useReveal } from '@/lib/reveal';

/*
  Four panels, laid out asymmetrically on a 12 column grid.

  This used to be the site's only Scroll Scrub. It was cut: two panels over
  200vh meant the pin grabbed the page and let go again inside half a screen,
  which reads as the page stuttering rather than as a deliberate move. With the
  pin gone, sequence 8 is no longer used anywhere on the site, and GSAP is no
  longer imported by any component.

  The interest now comes from where the panels sit rather than from motion: the
  column spans and the vertical offsets are all different, and the tone steps
  raised, bare, sunken, inverse so no two neighbours share a ground. Each panel
  gets one move on arrival and nothing more, staggered by --i, which is four
  elements against a budget of five.

  Headings are .title-sm under a numbered .label rather than .title, because
  five title-scale headings on one page is the exact failure mode the type
  scale exists to prevent. The page h1 is the only .title here.
*/

interface Panel {
  index: string;
  eyebrow: string;
  title: string;
  body: string[];
  tone: SlabTone | 'bare';
  /** Column placement from lg up. Mobile is always a single column. */
  span: string;
  /** Optional vertical offset from lg up, so the column edges do not line up. */
  offset?: string;
}

/*
  Only what the club can point at: the exec groups the executives table
  actually has, the partner and event counts already published as figures, the
  USC store the join button links to, and the contact address in the legal
  pages. If a sentence needs a fact that is not in the repo, it does not ship.
*/
const PANELS: Panel[] = [
  {
    index: '01',
    eyebrow: 'What we do',
    title: 'Workshops and events, all year',
    body: [
      'Western Sales Club runs workshops and events through the year for students who want experience in sales before they graduate.',
      'Members learn from people who do the work, not only from a reading list.',
    ],
    tone: 'raised',
    span: 'lg:col-start-1 lg:col-end-8',
  },
  {
    index: '02',
    eyebrow: 'How we run',
    title: 'A student exec team',
    body: [
      'Presidents, vice presidents, and assistant vice presidents run the club.',
      'The roster is on the executive team page, and it turns over every year.',
    ],
    tone: 'bare',
    span: 'lg:col-start-8 lg:col-end-13',
    offset: 'lg:mt-16',
  },
  {
    index: '03',
    eyebrow: 'Who backs us',
    title: 'Five industry partners',
    body: [
      'Partners support the club and connect members with people working in the field.',
      'They are listed on the partners page.',
    ],
    tone: 'sunken',
    span: 'lg:col-start-1 lg:col-end-7',
  },
  {
    index: '04',
    eyebrow: 'How to join',
    title: 'Membership runs through the USC store',
    body: [
      'The club runs about ten events a year for its members.',
      'Questions go to sales.club@westernusc.ca.',
    ],
    tone: 'inverse',
    span: 'lg:col-start-6 lg:col-end-13',
    offset: 'lg:-mt-10',
  },
];

function PanelBody({ panel }: { panel: Panel }) {
  return (
    <div className="flex flex-col gap-3">
      <Eyebrow index={panel.index}>{panel.eyebrow}</Eyebrow>
      <h2 className="title-sm">{panel.title}</h2>
      {panel.body.map((paragraph) => (
        <p key={paragraph} className="body measure">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export default function StorySection() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-10"
    >
      {PANELS.map((panel, i) => {
        const placement = `${panel.span} ${panel.offset ?? ''}`.trim();
        const style = { '--i': i } as React.CSSProperties;

        if (panel.tone === 'bare') {
          return (
            <div
              key={panel.index}
              style={style}
              className={`arrive px-1 py-2 ${placement}`}
            >
              <PanelBody panel={panel} />
            </div>
          );
        }

        return (
          <div key={panel.index} style={style} className={`arrive ${placement}`}>
            <Slab as="div" tone={panel.tone}>
              <PanelBody panel={panel} />
            </Slab>
          </div>
        );
      })}
    </div>
  );
}
