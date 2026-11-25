'use client';

import Button, { type ButtonVariant } from '@/components/ui/button';
import { useSiteContent } from '@/providers/site-content-provider';
import { externalLinkProps } from '@/lib/link-utils';
import type { SiteContentKey } from '@/lib/site-content-defaults';
import { EditBranch, useEditBranch } from '@/edit/edit-mode';

/*
  A button whose label and link are site_content keys.

  View mode and Preview: the Button primitive, opening external links in a
  new tab through externalLinkProps. While editing, the engine's
  InlineLabel renders instead: the label is a field inside the button and
  the link address shows in the tray.
*/

export interface EditableButtonProps {
  labelKey: SiteContentKey;
  hrefKey: SiteContentKey;
  variant?: ButtonVariant;
  arrow?: boolean;
  /** Passed through to Button until the design system retires it. */
  onAccent?: boolean;
  className?: string;
}

export default function EditableButton(props: EditableButtonProps) {
  const { labelKey, hrefKey, variant, arrow, onAccent, className } = props;
  const { text } = useSiteContent();
  if (useEditBranch()) return <EditBranch name="Button" props={props} />;
  const href = text(hrefKey);

  return (
    <Button
      href={href}
      {...externalLinkProps(href)}
      variant={variant}
      arrow={arrow}
      onAccent={onAccent}
      className={className}
    >
      {text(labelKey)}
    </Button>
  );
}
