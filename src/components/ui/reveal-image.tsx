'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useReveal } from '@/lib/reveal';

/*
  An image that holds its own space, skeletons until the bytes are there, and
  then runs Clip Reveal, sequence 9.

  Three things have to line up, and getting any one wrong is what makes a page
  feel like it assembles itself in front of you:

  1. The frame occupies its final size from the first paint, via an aspect
     ratio on the wrapper, so nothing below it moves when the image lands.
  2. The reveal waits on the image, not just on the viewport. useReveal's
     `ready` gate is why: an image that is in view but still decoding would
     otherwise clip in over an empty box and then pop.
  3. The skeleton stays mounted behind the image for the life of the
     component. Unmounting it on load leaves one frame where the skeleton is
     gone and the image is still clipped, which shows as a flash of empty. The
     image covers it on reveal, so it is never seen again; the sweep just
     stops.

  next/image fires onLoad for an already-cached image too: its ref callback
  checks `complete` itself, so there is no need to race it here.
*/

interface RevealImageProps {
  src: string;
  alt: string;
  sizes: string;
  /** Aspect ratio and radius for the frame, e.g. "aspect-[3/2] rounded-md". */
  className?: string;
  /** Reading-order index, which drives the 60ms Clip Reveal stagger. */
  index?: number;
  /** Set on an image above the fold so it is not lazy-loaded. */
  priority?: boolean;
  /** `contain` for a supplied logo, which must not be cropped. */
  fit?: 'cover' | 'contain';
  /**
   * `clip` is Clip Reveal, sequence 9, and is right for photography.
   *
   * `fade` is for a logo, and for anything that is not in the document flow
   * the observer can reason about: a mark inside the moving marquee track has
   * no meaningful moment of arrival, so it simply appears once its bytes are
   * there. That is an opacity shift on --d-hover and --e-enter, which is the
   * colour-shift line of the motion budget rather than a thirteenth sequence.
   */
  sequence?: 'clip' | 'fade';
}

export default function RevealImage({
  src,
  alt,
  sizes,
  className = '',
  index,
  priority = false,
  fit = 'cover',
  sequence = 'clip',
}: RevealImageProps) {
  const [loaded, setLoaded] = useState(false);
  const frameRef = useReveal<HTMLSpanElement>({
    ready: loaded,
    /* A faded image does not wait to be scrolled to: it has no entrance to
       coordinate, it just stops being absent. */
    immediate: sequence === 'fade',
  });

  return (
    <span
      ref={frameRef}
      data-loaded={loaded || undefined}
      style={index ? ({ '--i': index } as React.CSSProperties) : undefined}
      className={`reveal-frame relative block overflow-hidden ${className}`.trim()}
    >
      <span className="skeleton absolute inset-0 rounded-[inherit]" aria-hidden="true" />

      <span
        className={`${
          sequence === 'clip' ? 'clip-cell' : 'fade-cell'
        } absolute inset-0 block overflow-hidden rounded-[inherit]`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onLoad={() => setLoaded(true)}
          className={`${sequence === 'clip' ? 'clip-inner' : ''} ${
            fit === 'contain' ? 'object-contain' : 'object-cover'
          }`.trim()}
        />
      </span>
    </span>
  );
}
