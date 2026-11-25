'use client';

import Eyebrow from '@/components/ui/eyebrow';
import { EditableLines, EditableText } from '@/edit';
import { useReveal } from '@/lib/reveal';
import type { SiteContentKey } from '@/lib/site-content-defaults';

/*
  CentredHead: the head of a selling section, centred.

  The order is fixed by the alignment rule: eyebrow, the Archivo title, at
  most three lines of copy, then the buttons (passed as children). Every
  string is a site_content key read through the edit components, so the
  same head is a filled-in form in edit mode.

  The title is one key per visual line, as SectionHead's array is, and it
  owns its own Line Mask Reveal. Use it for section heads and closing
  bands; long reading copy and the event ledger stay left-aligned below it.

  design-system/components.md, CentredHead.
*/

interface CentredHeadProps {
  titleKeys: SiteContentKey[];
  eyebrowKey?: SiteContentKey;
  /** Section numeral, rendered by Eyebrow in the accent. */
  index?: string;
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
  titleKeys,
  eyebrowKey,
  index,
  bodyKey,
  bodyRole = 'body',
  id,
  as = 'h2',
  children,
  className = '',
}: CentredHeadProps) {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`mx-auto flex max-w-[62ch] flex-col items-center gap-4 text-center ${className}`.trim()}
    >
      {eyebrowKey && (
        <Eyebrow index={index}>
          <EditableText k={eyebrowKey} />
        </Eyebrow>
      )}

      <EditableLines keys={titleKeys} as={as} id={id} className="title" />

      {bodyKey && <EditableText k={bodyKey} as="p" className={`${bodyRole} measure`} />}

      {children && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">{children}</div>
      )}
    </div>
  );
}
