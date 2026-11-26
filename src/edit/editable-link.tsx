'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { useSiteContent } from '@/providers/site-content-provider';
import { externalLinkProps } from '@/lib/link-utils';
import { safeHref } from '@/lib/normalize';
import type { SiteContentKey } from '@/lib/site-content-defaults';
import { useEditBranch } from '@/edit/edit-mode';

/*
  A link whose address is a site_content key and whose content is not
  text, such as a footer social icon.

  View mode and Preview: an <a> to the stored address, after safeHref, so
  an address that fails the scheme check renders nothing. An empty address
  renders nothing either, which is how "Leave empty to hide the icon"
  works.

  While editing: the engine's link control (engine/link-icon.tsx), a
  button in the same look whose address is edited in the tray. It is
  loaded on its own only when edit mode renders it, so a visitor
  downloads none of it.
*/

const EditLinkIcon = dynamic(() => import('@/edit/engine/link-icon'), { ssr: false });

export interface EditableLinkProps {
  hrefKey: SiteContentKey;
  /** The link's accessible name for visitors, as in "Instagram". */
  label: string;
  className?: string;
  children: ReactNode;
}

export default function EditableLink({ hrefKey, label, className, children }: EditableLinkProps) {
  const { text } = useSiteContent();
  const editing = useEditBranch();
  if (editing) {
    return (
      <EditLinkIcon hrefKey={hrefKey} className={className}>
        {children}
      </EditLinkIcon>
    );
  }
  const href = safeHref(text(hrefKey));
  if (!href) return null;
  return (
    <a href={href} {...externalLinkProps(href)} aria-label={label} data-cursor="hover" className={className}>
      {children}
    </a>
  );
}
