'use client';

import { EditableLines, EditableText } from '@/edit';
import { useReveal } from '@/lib/reveal';
import type { SiteContentKey } from '@/lib/site-content-defaults';

/*
  CentredHead: the head of a selling section, centred.

  The order is fixed by the alignment rule: the Archivo title, at most three
  lines of copy, then the buttons (passed as children). There is no eyebrow:
  the site uses none (design-system/README.md, Type). Every
  string is a site_content key read through the edit components, so the
  same head is a filled-in form in edit mode.

  The title is one key per visual line, as SectionHead's array is, and it
  owns its own Line Mask Reveal. The title holds the title measure (about
  31 characters) and the copy the running measure (62), each in its own
  face. Use it for section heads and closing
  bands; long reading copy and the event ledger stay left-aligned below it.

  design-system/components.md, CentredHead.
*/

interface CentredHeadProps {
  /** One key per visual line. */
  titleKeys?: SiteContentKey[];
  /** Fixed lines, for a page whose copy is not in site_content (the legal
      pages). They take the same Line Mask Reveal and are not fields in edit
      mode. Pass this or titleKeys, not both. */
  titleLines?: string[];
  /** At most three lines of copy at the section's width. */
  bodyKey?: SiteContentKey;
  /** `subtitle` for a closing band, `body` for a section head. */
  bodyRole?: 'body' | 'subtitle';
  id?: string;
  as?: 'h1' | 'h2';
  /** The buttons, in one centred row. */
  children?: React.ReactNode;
  className?: string;
}

export default function CentredHead({
  titleKeys = [],
  titleLines,
  bodyKey,
  bodyRole = 'body',
  id,
  as = 'h2',
  children,
  className = '',
}: CentredHeadProps) {
  const ref = useReveal<HTMLDivElement>();
  const Title = as;

  return (
    <div
      ref={ref}
      className={`mx-auto flex w-full flex-col items-center gap-4 text-center ${className}`.trim()}
    >
      {titleLines ? (
        <Title id={id} className="title measure-title">
          {titleLines.map((line) => (
            <span key={line} className="ln">
              <i>{line}</i>
            </span>
          ))}
        </Title>
      ) : (
        <EditableLines keys={titleKeys} as={as} id={id} className="title measure-title" />
      )}

      {bodyKey && <EditableText k={bodyKey} as="p" className={`${bodyRole} measure`} />}

      {children && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">{children}</div>
      )}
    </div>
  );
}
