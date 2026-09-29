import Image from 'next/image';

/*
  Avatar — --r-disc, because avatars and the cursor are the two discs in the
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

  if (!src) {
    return (
      <span
        aria-hidden="true"
        style={style}
        className={`grid shrink-0 place-items-center rounded-full bg-sunken font-display text-[0.34em] font-extrabold leading-none text-ink-faint ${className}`.trim()}
      >
        <span style={{ fontSize: Math.max(10, Math.round(size * 0.32)) }}>
          {initialsOf(name)}
        </span>
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      style={style}
      className={`shrink-0 rounded-full object-cover ${className}`.trim()}
    />
  );
}
