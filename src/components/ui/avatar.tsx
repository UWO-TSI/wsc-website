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
  size?: number;
  className?: string;
}

export default function Avatar({ name, src, size = 34, className = '' }: AvatarProps) {
  const style = { width: size, height: size } as const;

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
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-sunken font-display font-extrabold leading-none text-ink-faint ${className}`.trim()}
    >
      <span style={{ fontSize: Math.max(10, Math.round(size * 0.32)) }}>
        {initialsOf(name)}
      </span>

      {src && (
        <Image
          src={src}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      )}
    </span>
  );
}
