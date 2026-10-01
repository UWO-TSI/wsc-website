'use client';

import Image from 'next/image';

/*
  Avatar: --r-disc, because avatars and the cursor are the two discs in the
  system.

  A missing headshot renders a --sunken disc with initials in --ink-faint:
  designed, not a broken frame. --ink-faint sits near 3.4:1, which is why the
  initials are set at 24px and up and never used for running copy.

  Object names only in the DB. The caller passes the URL it built with
  getPublicUrl(bucket, objectName) at runtime.
*/

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
}

interface AvatarProps {
  name: string;
  src?: string | null;
  /** Fixed diameter in px. Ignored when `fluid` is set. */
  size?: number;
  /**
   * Fill the width of the parent and stay square, for a grid cell whose
   * column width is set by the grid rather than by the avatar.
   */
  fluid?: boolean;
  /** Required when `fluid`: the rendered width at each breakpoint. */
  sizes?: string;
  className?: string;
  /**
   * Clip Reveal, sequence 9, on the headshot. The initials disc stays
   * underneath, which is the loading state. The parent owns `data-run`, so a
   * roster can hold every portrait and release them together.
   */
  reveal?: boolean;
  /** Fires when the headshot has decoded, or failed, so a group can proceed. */
  onReady?: () => void;
}

export default function Avatar({
  name,
  src,
  size = 34,
  fluid = false,
  sizes,
  className = '',
  reveal = false,
  onReady,
}: AvatarProps) {
  const style = fluid ? undefined : ({ width: size, height: size } as const);

  /*
    The initials disc is always rendered, and the headshot sits on top of it
    rather than replacing it. Swapping them left an empty circle for as long
    as the file took to arrive; layered, the designed fallback IS the loading
    state, and the photo covers it when it lands. Nothing to skeleton, because
    there is already something correct to show.
  */
  return (
    <span
      aria-hidden="true"
      style={style}
      className={`relative grid place-items-center overflow-hidden rounded-full bg-sunken font-display font-extrabold leading-none text-ink-faint ${
        fluid ? 'aspect-square w-full' : 'shrink-0'
      } ${className}`.trim()}
    >
      <span
        className={fluid ? 'text-[clamp(1.1rem,4vw,2rem)]' : undefined}
        style={fluid ? undefined : { fontSize: Math.max(10, Math.round(size * 0.32)) }}
      >
        {initialsOf(name)}
      </span>

      {src &&
        (reveal ? (
          <span className="clip-cell absolute inset-0 block overflow-hidden rounded-full">
            <Image
              src={src}
              alt=""
              fill
              sizes={fluid ? (sizes ?? '25vw') : `${size}px`}
              loading="eager"
              onLoad={onReady}
              onError={onReady}
              className="clip-inner object-cover"
            />
          </span>
        ) : (
          <Image
            src={src}
            alt=""
            fill
            sizes={fluid ? (sizes ?? '25vw') : `${size}px`}
            className="object-cover"
          />
        ))}
    </span>
  );
}
