'use client';

import { useReveal } from '@/lib/reveal';

/*
  Slab: the only divider.

  Inset from the viewport by the page gutter, --r-xl from tablet up and --r-lg
  below, separated from its neighbours by 24px of visible --page. That gap plus
  the tone change is the divider; there is no line.

  Rules this component cannot enforce for you, from design-system/README.md:
  adjacent slabs never share a tone, --inverse and --accent never touch, there
  is one loud slab per page, and the hero plus at least one section per page
  sit bare on --page so the stack does not read as a list of cards.

  Never put a shadow above --sh-1 on a slab. A slab is the page, not a thing
  floating above it.
*/

export type SlabTone = 'raised' | 'sunken' | 'inverse' | 'accent' | 'logo';

const tones: Record<SlabTone, string> = {
  raised: '',
  sunken: 'slab-sunk',
  inverse: 'slab-inv',
  accent: 'slab-acc',
  /* The constant dark ground, for a section built around supplied logos.
     Unlike the other four it does not flip with the theme. */
  logo: 'slab-logo',
};

interface SlabProps {
  children: React.ReactNode;
  tone?: SlabTone;
  /** Sequence 3, Slab Clip. At most four per page: `round` is not cheap. */
  clip?: boolean;
  /** A slab that clips its children sets overflow:hidden so the child inherits the corner. */
  overflowHidden?: boolean;
  as?: 'section' | 'div' | 'aside' | 'footer';
  id?: string;
  className?: string;
  'aria-labelledby'?: string;
}

export default function Slab({
  children,
  tone = 'raised',
  clip = false,
  overflowHidden = false,
  as: Tag = 'section',
  id,
  className = '',
  'aria-labelledby': ariaLabelledBy,
}: SlabProps) {
  const ref = useReveal<HTMLElement>({ enabled: clip });

  return (
    <Tag
      ref={ref as React.Ref<HTMLElement & HTMLDivElement>}
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={[
        'slab',
        tones[tone],
        clip ? 'clip-slab' : '',
        overflowHidden ? 'overflow-hidden' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Tag>
  );
}
