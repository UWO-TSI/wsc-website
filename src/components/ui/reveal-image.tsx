'use client';

import { useEffect, useState } from 'react';
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

  `src` undefined means the slot is not known yet (site_images is still in
  flight): that is ordinary loading, and the sweep runs.

  An empty slot (`src` null) is a frame with nothing to wait for. It is
  loaded from the first paint, so the sweep is stopped, and the still
  skeleton surface takes the photo's place inside the clip cell: it runs
  the same reveal a photo would, at the frame's own size, so the layout and
  the motion read before any photo exists. There is no skeleton behind it,
  or the reveal would draw a surface over the same surface and show
  nothing. next/image is never handed an empty src. It still reports
  ready, so a held group that contains an empty slot is not stuck waiting
  on it.

  `veil` lays --inverse-veil over a photo, outside the clip cell, so text
  set on it keeps its contrast before, during and after the reveal. An empty
  veiled slot (the hero) shows the placeholder every other empty slot shows,
  the 9 percent ink wash on --page, as an opaque surface under the same
  veil, so the area reads as a photo area and the text over it keeps its
  contrast. Without the page ground under it, the wash would take the
  inverse slab's light ink and vanish under the veil.
*/

interface RevealImageProps {
  /**
   * Null for an empty photo slot: the frame holds its space, still.
   * Undefined while the slot is unresolved: the frame loads as usual.
   */
  src: string | null | undefined;
  alt: string;
  sizes: string;
  /** Aspect ratio and radius for the frame, e.g. "aspect-[3/2] rounded-md". */
  className?: string;
  /** Reading-order index, which drives the 60ms Clip Reveal stagger. */
  index?: number;
  /** Set on an image above the fold so it is not lazy-loaded. */
  priority?: boolean;
  /**
   * The frame does not run its own sequence. An ancestor owns `data-run`
   * and releases every held image together. `onReady` reports when this
   * file has decoded or failed, which is what that ancestor waits on.
   */
  hold?: boolean;
  onReady?: () => void;
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
  /** Lay --inverse-veil over the photo, for a frame with text on it. */
  veil?: boolean;
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
  hold = false,
  onReady,
  veil = false,
}: RevealImageProps) {
  const empty = src === null;
  const [loaded, setLoaded] = useState(empty);
  const frameRef = useReveal<HTMLSpanElement>({
    ready: loaded,
    /* A faded image does not wait to be scrolled to: it has no entrance to
       coordinate, it just stops being absent. A held image has no entrance
       of its own at all: the ancestor decides when the group goes. */
    immediate: sequence === 'fade',
    enabled: !hold,
  });

  const settle = () => {
    setLoaded(true);
    onReady?.();
  };

  /* An empty slot has no bytes to wait for, but a holding ancestor still
     counts it. Reported once, after mount, like a cached image would be. */
  useEffect(() => {
    if (empty) onReady?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empty]);

  /* The slot was filled or emptied after mount, e.g. once site_images
     resolves: start that frame over. */
  const [shownSrc, setShownSrc] = useState(src);
  if (src !== shownSrc) {
    setShownSrc(src);
    setLoaded(src === null);
  }

  return (
    <span
      ref={frameRef}
      data-loaded={loaded || undefined}
      data-empty={empty || undefined}
      style={index ? ({ '--i': index } as React.CSSProperties) : undefined}
      className={`reveal-frame relative block overflow-hidden ${className}`.trim()}
    >
      {!empty && <span className="skeleton absolute inset-0 rounded-[inherit]" aria-hidden="true" />}

      <span
        className={`${
          sequence === 'clip' ? 'clip-cell' : 'fade-cell'
        } absolute inset-0 block overflow-hidden rounded-[inherit]`}
      >
        {empty && (
          <span
            className={`skeleton ${sequence === 'clip' ? 'clip-inner' : ''} ${
              veil ? 'bg-[color-mix(in_srgb,var(--ink)_9%,var(--page))]' : ''
            } absolute inset-0 block rounded-[inherit]`}
            aria-hidden="true"
          />
        )}
        {src && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={hold ? 'eager' : undefined}
          onLoad={settle}
          onError={settle}
          className={`${sequence === 'clip' ? 'clip-inner' : ''} ${
            fit === 'contain' ? 'object-contain' : 'object-cover'
          }`.trim()}
        />
        )}
      </span>

      {veil && <span className="absolute inset-0 rounded-[inherit] bg-inverse-veil" aria-hidden="true" />}
    </span>
  );
}
