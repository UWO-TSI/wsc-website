import type { Executive } from '@/types/database';
import ExecutiveRow from './executive-row';

/*
  A directory group: a .label heading and its rows. Separation from the next
  group comes from the gap, not a line under the heading.
*/

interface ExecutiveListProps {
  title: string;
  executives: Executive[];
  startIndex: number;
}

export default function ExecutiveList({ title, executives, startIndex }: ExecutiveListProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="label">{title}</p>
      <div className="flex flex-col gap-1">
        {executives.map((executive, i) => (
          <ExecutiveRow key={executive.id} executive={executive} index={startIndex + i} />
        ))}
      </div>
    </div>
  );
}
