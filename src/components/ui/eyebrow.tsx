/**
 * Eyebrow. The `.label` type role: Geist Mono 11px, 0.16em tracking, upper case.
 *
 * It travels with its title rather than animating on its own, so it belongs
 * inside whatever wrapper owns the reveal.
 *
 * An `index` renders as the section numeral in the accent, which is the only
 * place a bare number is allowed to carry meaning. It carries `.accent-mark`
 * rather than a colour utility, so that inside a loud slab it picks up that
 * slab's ink instead of vanishing into the ground.
 */
interface EyebrowProps {
  children: React.ReactNode;
  index?: string;
  className?: string;
}

export default function Eyebrow({ children, index, className = '' }: EyebrowProps) {
  return (
    <span className={`label ${className}`.trim()}>
      {index && (
        <>
          <span className="accent-mark">{index}</span>
          {' '}
        </>
      )}
      {children}
    </span>
  );
}
