/*
  Chip — a status mark that always carries a word.

  In Showroom --ok and --alert sit at nearly the same lightness, so hue alone
  never carries the meaning. The dot is decoration; the label is the signal.
  A chip is --r-xs by the corner rule, but a chip is also small enough that
  --r-pill reads correctly and matches the floor cards.
*/

export type ChipStatus = 'ok' | 'warn' | 'alert' | 'neutral';

const statuses: Record<ChipStatus, { text: string; dot: string }> = {
  ok: { text: 'text-ok', dot: 'bg-ok' },
  warn: { text: 'text-warn', dot: 'bg-warn' },
  alert: { text: 'text-alert', dot: 'bg-alert' },
  neutral: { text: 'text-ink-muted', dot: 'bg-ink-faint' },
};

interface ChipProps {
  children: React.ReactNode;
  status?: ChipStatus;
  className?: string;
}

export default function Chip({ children, status = 'neutral', className = '' }: ChipProps) {
  const tone = statuses[status];

  return (
    <span
      className={`inline-flex items-center gap-[7px] rounded-pill bg-page px-[13px] py-2 font-data text-[11px] uppercase tracking-[0.13em] shadow-1 ${tone.text} ${className}`.trim()}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${tone.dot}`} />
      {children}
    </span>
  );
}
