'use client';

import Link from 'next/link';
import { useMagnetic } from '@/hooks/use-magnetic';
import { useSlabTone } from './slab';

/*
  Every button is a pill. Nothing else in the system uses --r-pill, which is
  how a pressable thing announces itself when there are no borders.

  Label is Instrument Sans 15px / 500, sentence case, never wrapping. Padding
  is 14px block and 24px inline, which clears 44px at every size. One primary
  per section, and no icon-only buttons on the marketing site. The edit
  bar is admin chrome and has one: Settings, a gear with an accessible
  name.

  Destructive (--alert fill) and confirm (--ok fill) are for the edit
  bar's Discard and Publish only, so the bar reads as a tool and its two
  outcomes read apart. They keep their fill on every slab, since the bar
  sits on the page ground.

  On an inverse, accent or logo slab the primary takes the page fill (the secondary
  look), because an accent button on a loud ground has nowhere to go. The
  button reads the tone from the enclosing Slab, so pages pass no flag.

  design-system/components.md → Button.
*/

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'confirm';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  disabled?: boolean;
  target?: string;
  rel?: string;
  /** A trailing arrow means the action leaves the page; 'back' is a leading arrow that returns. */
  arrow?: boolean | 'back';
  /**
   * @deprecated Has no effect. The button reads the enclosing Slab's tone
   * instead. Kept so existing callers compile; remove once none pass it.
   */
  onAccent?: boolean;
  'aria-label'?: string;
}

const base = [
  'inline-flex',
  'items-center',
  'justify-center',
  'gap-2',
  'rounded-pill',
  'px-6',
  'py-[14px]',
  'font-text',
  'text-[15px]',
  'font-medium',
  'leading-none',
  'whitespace-nowrap',
  'no-underline',
  'cursor-pointer',
  'transition-[background-color,box-shadow,color,transform]',
  'duration-[var(--d-hover)]',
  'ease-enter',
  'active:scale-[0.97]',
  'active:duration-[var(--d-tap)]',
].join(' ');

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent shadow-2 hover:bg-accent-deep hover:shadow-3',
  secondary: 'bg-page text-ink shadow-1 hover:bg-raised',
  tertiary: 'bg-transparent text-accent-ink hover:bg-accent-veil',
  destructive: 'bg-alert text-on-accent shadow-2 hover:shadow-3',
  confirm: 'bg-ok text-on-accent shadow-2 hover:shadow-3',
};

/* Inside an inverse, accent or logo slab. The secondary and tertiary take the
   slab's own ink; their hover fill is derived from it in globals.css. */
const loudVariants: Record<ButtonVariant, string> = {
  primary: variants.secondary,
  secondary: 'bg-transparent text-current shadow-none',
  tertiary: variants.tertiary,
  destructive: variants.destructive,
  confirm: variants.confirm,
};

const disabledStyles = 'bg-sunken text-ink-faint shadow-none cursor-not-allowed';

export default function Button({
  children,
  variant = 'primary',
  href,
  onClick,
  type = 'button',
  className = '',
  disabled = false,
  target,
  rel,
  arrow = false,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const magnetRef = useMagnetic<HTMLElement>(!disabled);
  const slabTone = useSlabTone();
  const loud = slabTone === 'inverse' || slabTone === 'accent' || slabTone === 'logo';

  const tone = disabled
    ? disabledStyles
    : loud
      ? loudVariants[variant]
      : variants[variant];

  /*
    `btn-${variant}` carries no styling of its own. It is the hook globals.css
    uses to give a secondary or tertiary button legible ink and a hover fill
    inside a loud slab, where --accent-ink is the ground itself and
    --accent-veil is invisible.
  */
  const classes = `group btn-${variant} ${base} ${tone} ${className}`.trim();

  const inner = (
    <>
      {arrow === 'back' && (
        <span
          aria-hidden="true"
          className="transition-transform duration-[var(--d-hover)] ease-enter group-hover:-translate-x-1"
        >
          &larr;
        </span>
      )}
      <span>{children}</span>
      {arrow === true && (
        <span
          aria-hidden="true"
          className="transition-transform duration-[var(--d-hover)] ease-enter group-hover:translate-x-1"
        >
          &rarr;
        </span>
      )}
    </>
  );

  if (href && !disabled) {
    return (
      <Link
        ref={magnetRef as React.Ref<HTMLAnchorElement>}
        href={href}
        className={classes}
        data-cursor="hover"
        aria-label={ariaLabel}
        {...(target && { target })}
        {...(rel && { rel })}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      ref={magnetRef as React.Ref<HTMLButtonElement>}
      type={type}
      onClick={onClick}
      className={classes}
      disabled={disabled}
      aria-label={ariaLabel}
      data-cursor="hover"
    >
      {inner}
    </button>
  );
}
