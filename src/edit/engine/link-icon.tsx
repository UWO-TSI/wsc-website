'use client';

import type { ReactNode } from 'react';
import { useSiteContent } from '@/providers/site-content-provider';
import { SITE_CONTENT, type SiteContentKey } from '@/lib/site-content-defaults';
import { COPY } from '@/edit/engine/copy';
import { blurField, enterTray, focusField, type TrayContext } from '@/edit/engine/ui-store';

/*
  The edit branch of EditableLink (src/edit/editable-link.tsx): a link
  whose address is a site_content key and which has no label to edit, such
  as a footer social icon. The icon is a button in the visitor link's own
  look. Focusing it shows its link address in the tray, as a button's
  link does (the 'link' tray context, link-field.tsx); pressing it moves
  focus to that address, and Escape or Enter there returns to the icon.

  An empty address hides the link for visitors and in Preview. Here it
  still shows, at the placeholder's strength (.ed-link-empty), so it can
  be filled in.
*/
export default function EditLinkIcon({
  hrefKey,
  className,
  children,
}: {
  hrefKey: SiteContentKey;
  className?: string;
  children: ReactNode;
}) {
  const { text } = useSiteContent();
  const m = SITE_CONTENT[hrefKey];
  const ctx: TrayContext = { type: 'link', hrefKey };
  const empty = !text(hrefKey);
  return (
    <button
      type="button"
      data-ed-field={hrefKey}
      data-cursor="hover"
      className={[className, 'ed-link-icon', empty && 'ed-link-empty'].filter(Boolean).join(' ')}
      aria-label={COPY.linkAddress(`${m.section}, ${m.label.toLowerCase()}`)}
      onFocus={() => focusField(ctx)}
      onBlur={blurField}
      onClick={(e) => enterTray(ctx, e.currentTarget)}
    >
      {children}
    </button>
  );
}
