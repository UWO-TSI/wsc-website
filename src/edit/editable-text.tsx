'use client';

import { useSiteContent } from '@/providers/site-content-provider';
import { EditBranch, useEditBranch } from '@/edit/edit-mode';
import type { SiteContentKey } from '@/lib/site-content-defaults';

/*
  One site_content key, rendered in place.

  View mode and Preview: the stored value inside `as`. An empty value
  renders nothing, which keeps the "leave empty to hide" fields working.
  While editing, the engine's InlineText or InlineParagraph renders instead:
  a field sized to the key's max_length, shown even when empty.
*/

export type TextTag = 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'div' | 'li' | 'strong' | 'em';

export interface EditableTextProps {
  k: SiteContentKey;
  as?: TextTag;
  className?: string;
  id?: string;
}

export default function EditableText(props: EditableTextProps) {
  const { k, as: Tag = 'span', className, id } = props;
  const { text } = useSiteContent();
  if (useEditBranch()) return <EditBranch name="Text" props={props} />;
  const value = text(k);
  if (!value) return null;

  return (
    <Tag id={id} className={className}>
      {value}
    </Tag>
  );
}
