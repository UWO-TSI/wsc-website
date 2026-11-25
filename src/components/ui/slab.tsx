'use client';

import { createContext, useContext } from 'react';
import { useReveal } from '@/lib/reveal';
import Texture from './texture';

/*
  Slab: the only divider.

  A slab spans the full viewport width with no side gap and takes --r-xl,
  the corner step for a full-width container. Slabs that meet are 2px apart
  (`.stack`), and that 2px of page ground plus the tone change is the
  divider; there is no line. The page gutter is the slab's inline padding, so
  its content keeps the inset. Photos, fields, buttons and chips inside keep
  their own rounded shapes.

  Rules this component cannot enforce for you, from design-system/README.md:
  adjacent slabs never share a tone, --inverse and --accent never touch, there
  is one loud slab per page, and the hero plus at least one section per page
  are bare on --page so the stack does not read as a list of cards.

  A slab is flat. A shadow would fill the 2px join, and a slab is the page,
  not a thing floating above it.
*/

export type SlabTone = 'page' | 'raised' | 'sunken' | 'inverse' | 'accent' | 'logo';

/** Lit velvet ribbon shapes, allowed on the inverse and accent tones only. */
export type SlabTexture = 'sweep' | 'rise' | 'arc' | 'waist' | 'pair';

const tones: Record<SlabTone, string> = {
  page: 'bg-page',
  raised: '',
  sunken: 'slab-sunk',
  inverse: 'slab-inv',
  accent: 'slab-acc',
  /* The constant near-black ground, for a section built around supplied logos. */
  logo: 'slab-logo',
};

/* The lit ground each loud tone takes when it is textured. */
const litGround = {
  inverse: 'lit-black',
  accent: 'lit-velvet',
} as const;

/*
  The tone of the nearest enclosing Slab. Button reads it so a primary on an
  inverse or accent slab takes the page fill without the page passing a flag.
  Outside any Slab it is 'page'.
*/
const SlabToneContext = createContext<SlabTone>('page');

export function useSlabTone() {
  return useContext(SlabToneContext);
}

/*
  `texture` is accepted on the two loud tones only, so a textured raised or
  sunken slab is a type error. When set, the slab takes its lit ground and
  draws the Lit velvet texture in that shape behind its content
  (src/components/ui/texture.tsx).
*/
type SlabToneProps =
  | { tone?: Exclude<SlabTone, 'inverse' | 'accent'>; texture?: never }
  | { tone: 'inverse' | 'accent'; texture?: SlabTexture };

type SlabProps = SlabToneProps & {
  children: React.ReactNode;
  /** Sequence 3, Slab Clip. At most four per page: `round` is not cheap. */
  clip?: boolean;
  /** A slab that clips its children sets overflow:hidden so the child inherits the corner. */
  overflowHidden?: boolean;
  as?: 'section' | 'div' | 'aside' | 'footer';
  id?: string;
  className?: string;
  'aria-labelledby'?: string;
};

export default function Slab({
  children,
  tone = 'raised',
  texture,
  clip = false,
  overflowHidden = false,
  as: Tag = 'section',
  id,
  className = '',
  'aria-labelledby': ariaLabelledBy,
}: SlabProps) {
  const ref = useReveal<HTMLElement>({ enabled: clip });
  const textured = texture && (tone === 'inverse' || tone === 'accent');

  return (
    <Tag
      ref={ref as React.Ref<HTMLElement & HTMLDivElement>}
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={[
        'slab',
        tones[tone],
        textured ? `textured ${litGround[tone]}` : '',
        clip ? 'clip-slab' : '',
        overflowHidden ? 'overflow-hidden' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {textured && <Texture shape={texture} />}
      <SlabToneContext.Provider value={tone}>{children}</SlabToneContext.Provider>
    </Tag>
  );
}
