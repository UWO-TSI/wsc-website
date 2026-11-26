'use client';

import Button, { type ButtonVariant } from '@/components/ui/button';
import { useSiteContent } from '@/providers/site-content-provider';
import { externalLinkProps } from '@/lib/link-utils';
import { safeHref } from '@/lib/normalize';
import type { SiteContentKey } from '@/lib/site-content-defaults';
import { EditBranch, useEditBranch } from '@/edit/edit-mode';

/*
  A button whose label is a site_content key.

  Two modes. With `hrefKey` the link is a site_content key too, and while
  editing its address shows in the tray. Without it the button is
  label-only: its action is not site content (a row's own URL through
  `href`, a form submit through `type`), so only the label is edited.

  View mode and Preview: the Button primitive, opening external links in a
  new tab through externalLinkProps. The href passes safeHref first. While editing, the engine's
  InlineLabel renders instead in both modes: the label field sits over an
  inert copy of the button, so the field is never inside a real <button>
  and nothing on it can follow a link or submit a form.
*/

interface CommonProps {
  labelKey: SiteContentKey;
  variant?: ButtonVariant;
  arrow?: boolean;
  /** Passed through to Button until the design system retires it. */
  onAccent?: boolean;
  className?: string;
}

interface LinkKeyProps extends CommonProps {
  hrefKey: SiteContentKey;
}

interface LabelOnlyProps extends CommonProps {
  hrefKey?: undefined;
  /** A link that is not site content, such as an event's register_url. */
  href?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  'aria-label'?: string;
  /** Shown instead of the stored label in view mode, for a busy state. */
  label?: string;
}

export type EditableButtonProps = LinkKeyProps | LabelOnlyProps;

export default function EditableButton(props: EditableButtonProps) {
  const { labelKey, variant, arrow, onAccent, className } = props;
  const { text } = useSiteContent();
  if (useEditBranch()) return <EditBranch name="Button" props={props} />;

  const own = props.hrefKey === undefined ? props : undefined;
  /* A value that fails the scheme check renders a plain button, never an href. */
  const href = safeHref(own ? own.href : text(props.hrefKey!));

  return (
    <Button
      href={href}
      {...externalLinkProps(href)}
      type={own?.type}
      disabled={own?.disabled}
      aria-label={own?.['aria-label']}
      variant={variant}
      arrow={arrow}
      onAccent={onAccent}
      className={className}
    >
      {own?.label ?? text(labelKey)}
    </Button>
  );
}
