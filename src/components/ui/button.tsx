'use client';

import Link from 'next/link';
import { useMagnetic } from '@/hooks/use-magnetic';

/*
  Every button is a pill. Nothing else in the system uses --r-pill, which is
  how a pressable thing announces itself when there are no borders.

  Label is Instrument Sans 15px / 500, sentence case, never wrapping. Padding
  is 14px block and 24px inline, which clears 44px at every size. One primary
  per section, and no icon-only buttons on the marketing site.

  design-system/components.md → Button.
*/

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

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
  /** A trailing arrow means the action leaves the page. */
  arrow?: boolean;
  /**
   * Set on an --accent slab. A primary inverts to a --page fill with --ink,
   * because an accent button on an accent field has nowhere to go.
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
};

const onAccentVariants: Record<ButtonVariant, string> = {
  primary: 'bg-page text-ink shadow-2 hover:bg-raised hover:shadow-3',
  secondary: 'bg-transparent text-on-accent shadow-none hover:bg-[rgba(255,255,255,0.12)]',
  tertiary: 'bg-transparent text-on-accent hover:bg-[rgba(255,255,255,0.12)]',
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
  onAccent = false,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const magnetRef = useMagnetic<HTMLElement>(!disabled);

  const tone = disabled
    ? disabledStyles
    : onAccent
      ? onAccentVariants[variant]
      : variants[variant];

  const classes = `group ${base} ${tone} ${className}`.trim();

  const inner = (
    <>
      <span>{children}</span>
      {arrow && (
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
