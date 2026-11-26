'use client';

import Slab from '@/components/ui/slab';
import { EditableButton, EditableLines, EditableText } from '@/edit';
import type { SiteContentKey } from '@/lib/site-content-defaults';

/*
  AudienceSplit: the two people this site sells to, side by side. Students
  on the left, companies on the right, each a --page tile at --sh-1 on a
  sunken slab with a two-line title, three points and one
  primary button with a note under it.

  Each tile has its own primary because each is its own decision: the
  section has two audiences, and each one sees one primary. Apply to join
  reads home.cta.*, the same keys as the nav and the closing band.

  The tiles are the page's last pitch before the closing band, so they are
  large: up to 1280px wide together, at least clamp(26rem, 42vw, 36rem)
  tall, with the points in .subtitle. Below 700px they stack, students
  first.
  design-system/components.md, AudienceSplit.
*/

interface Audience {
  id: string;
  titleKeys: [SiteContentKey, SiteContentKey];
  pointKeys: [SiteContentKey, SiteContentKey, SiteContentKey];
  noteKey: SiteContentKey;
  button: { labelKey: SiteContentKey; hrefKey: SiteContentKey };
}

const AUDIENCES: Audience[] = [
  {
    id: 'students',
    titleKeys: ['home.students.title_line1', 'home.students.title_line2'],
    pointKeys: ['home.students.point1', 'home.students.point2', 'home.students.point3'],
    noteKey: 'home.students.note',
    button: { labelKey: 'home.cta.button_label', hrefKey: 'home.cta.button_href' },
  },
  {
    id: 'companies',
    titleKeys: ['home.companies.title_line1', 'home.companies.title_line2'],
    pointKeys: ['home.companies.point1', 'home.companies.point2', 'home.companies.point3'],
    noteKey: 'home.companies.note',
    button: { labelKey: 'home.hero.partner_label', hrefKey: 'home.hero.partner_href' },
  },
];

export default function AudienceSplit() {
  return (
    <Slab tone="sunken">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-4 py-[clamp(1rem,3vw,2.5rem)] min-[700px]:grid-cols-2 min-[700px]:gap-6">
        {AUDIENCES.map((audience) => (
          <AudienceTile key={audience.id} audience={audience} />
        ))}
      </div>
    </Slab>
  );
}

function AudienceTile({ audience }: { audience: Audience }) {
  const headingId = `${audience.id}-heading`;

  return (
    <article
      aria-labelledby={headingId}
      className="flex min-h-[clamp(26rem,42vw,36rem)] flex-col gap-8 rounded-lg bg-page p-[clamp(2rem,5vw,4rem)] shadow-1"
    >
      {/* The two lines are one heading field while editing (EditableLines). */}
      <EditableLines keys={[...audience.titleKeys]} as="h2" id={headingId} className="title m-0" />

      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {audience.pointKeys.map((key) => (
          <li key={key} className="grid grid-cols-[24px_minmax(0,1fr)] gap-3">
            <svg width="18" height="18" viewBox="0 0 14 14" aria-hidden="true" className="mt-[4px] text-accent-ink">
              <path d="M2 7.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            <EditableText k={key} as="span" className="subtitle" />
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col items-start gap-3 pt-2">
        <EditableButton labelKey={audience.button.labelKey} hrefKey={audience.button.hrefKey} arrow />
        <EditableText k={audience.noteKey} as="p" className="meta m-0" />
      </div>
    </article>
  );
}
