/*
  Skeleton: the shape of a thing that has not arrived yet.

  The rule it exists to enforce is that a section reserves its own space from
  the first paint and fills in, rather than appearing out of nowhere when the
  query resolves. A centred spinner is the opposite: its bed is a different
  shape from the content that replaces it, so the page jumps the moment the
  data lands.

  A skeleton should therefore be built to the shape of the real thing, not to a
  generic box. Prefer writing the skeleton next to the component it stands in
  for, so the two stay the same shape when one of them changes.

  The fill is derived from currentColor, so this is correct on any slab tone
  without a variant per ground. `.skeleton` is in globals.css.
*/

interface SkeletonProps {
  className?: string;
  /** Stagger index, so a column of skeleton rows does not sweep in lockstep. */
  index?: number;
  style?: React.CSSProperties;
}

export default function Skeleton({ className = '', index, style }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`skeleton block ${className}`.trim()}
      style={
        index
          ? ({ ...style, '--sweep-delay': `${index * 90}ms` } as React.CSSProperties)
          : style
      }
    />
  );
}
