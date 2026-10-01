/*
  The counter under a field with a ceiling, the same `n / max` meta the
  contact form's message field shows. --warn from 80 percent, --alert past
  the limit, and the words say so too, because colour never carries the
  meaning alone.
*/
export default function CharCount({ length, max }: { length: number; max: number }) {
  const over = length > max;
  const near = !over && length >= max * 0.8;
  const tone = over ? 'text-alert' : near ? 'text-warn' : 'text-ink-faint';

  return (
    <span className={`meta shrink-0 tabular-nums ${tone}`}>
      {length} / {max}
      {over ? ' (too long)' : ''}
    </span>
  );
}
