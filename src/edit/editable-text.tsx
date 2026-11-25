'use client';

import { useSiteContent } from '@/providers/site-content-provider';
import type { SiteContentKey } from '@/lib/site-content-defaults';

/*
  One site_content key, rendered in place.

  View mode: the stored value inside `as`. An empty value renders nothing,
  which keeps the "leave empty to hide" fields working. In edit mode the
  same call renders a field sized to the key's max_length.
*/

export type TextTag = 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'div' | 'li' | 'strong' | 'em';

export interface EditableTextProps {
  k: SiteContentKey;
  as?: TextTag;
  className?: string;
  id?: string;
}

export default function EditableText({ k, as: Tag = 'span', className, id }: EditableTextProps) {
  const { text } = useSiteContent();
  const value = text(k);
  if (!value) return null;

  return (
    <Tag id={id} className={className}>
      {value}
    </Tag>
  );
}
