'use client';

import { EditableLines, EditableText } from '@/edit';
import { useReveal } from '@/lib/reveal';
import type { SiteContentKey } from '@/lib/site-content-defaults';

/*
  SectionHead: the left-aligned head of a section whose job is reading or
  scanning content (the About story, the event ledger). The masked title,
  an optional line of meta or copy, then any buttons, all on the
  left edge the content below them starts from. CentredHead is the centred
  head, for selling moments only.

  The title is one entry per visual line, never one string left to wrap:
  the Line Mask Reveal needs to know where the lines are. Pass `titleKeys`
  (site_content keys, fields in edit mode) or `title` (fixed words).

  Titles are Archivo all caps by the type role, so pass the words, not the
  casing. A page of medium-sized headings is the failure mode this system
  exists to prevent, so there is no size prop: this is the section title and
  the hero is the page title.

  design-system/components.md, SectionHead.
*/

interface SectionHeadProps {
  /** Fixed lines, one per visual line. Pass this or titleKeys. */
  title?: string[];
  /** One site_content key per visual line. */
  titleKeys?: SiteContentKey[];
  meta?: string;
  /** At most three lines of copy under the title. */
  bodyKey?: SiteContentKey;
  id?: string;
  as?: 'h1' | 'h2';
  /** Buttons, in one row on the same left edge. */
  children?: React.ReactNode;
  className?: string;
}

export default function SectionHead({
  title,
  titleKeys = [],
  meta,
  bodyKey,
  id,
  as = 'h2',
  children,
  className = '',
}: SectionHeadProps) {
  const ref = useReveal<HTMLDivElement>();
  const Title = as;

  return (
    <div ref={ref} className={`flex flex-col items-start gap-4 text-left ${className}`.trim()}>
      {title ? (
        <Title id={id} className="title">
          {title.map((line) => (
            <span key={line} className="ln">
              <i>{line}</i>
            </span>
          ))}
        </Title>
      ) : (
        <EditableLines keys={titleKeys} as={as} id={id} className="title" />
      )}

      {meta && <span className="meta">{meta}</span>}

      {bodyKey && <EditableText k={bodyKey} as="p" className="body measure" />}

      {children && <div className="mt-2 flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}
