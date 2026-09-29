/**
 * Eyebrow. The `.label` type role: Geist Mono 11px, 0.16em tracking, upper case.
 *
 * It travels with its title rather than animating on its own, so it belongs
 * inside whatever wrapper owns the reveal.
 *
 * An `index` renders as the section numeral in --accent-ink, which is the only
 * place a bare number is allowed to carry meaning.
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
          <span className="text-accent-ink">{index}</span>
          {' '}
        </>
      )}
      {children}
    </span>
  );
}
