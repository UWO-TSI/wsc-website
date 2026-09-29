import Avatar from '@/components/ui/avatar';
import { getPublicUrl } from '@/lib/supabase/storage';
import type { Executive } from '@/types/database';

/*
  ExecRow: sequence 10, Row Expand. The `.row` classes are in globals.css.

  At rest the directory is pure type: index in .label, name in .title-sm, role
  in .meta. A wall of names in Archivo caps reads as a roster of operators.

  The row is inert on purpose. components.md describes it as one focusable
  link, which assumes a destination, and there is no exec detail page to link
  to. A button with no action would announce itself as pressable and do
  nothing, so the expand is a pointer-only response and the avatar is present
  at rest wherever hover does not exist.
*/

interface ExecutiveRowProps {
  executive: Executive;
  index: number;
}

export default function ExecutiveRow({ executive, index }: ExecutiveRowProps) {
  const headshotUrl = getPublicUrl('headshots', executive.headshot_path);

  return (
    <li className="row row-live">
      <div className="flex w-full flex-wrap items-center gap-x-[14px] gap-y-1">
        <span className="label w-[30px] shrink-0 text-ink-faint">
          {String(index).padStart(2, '0')}
        </span>

        <span className="row-name title-sm order-1 flex-1 basis-40">{executive.name}</span>

        <span className="meta order-2 shrink-0 pl-[44px] sm:pl-0">{executive.title}</span>

        <span className="row-avatar order-3 ml-auto flex w-[34px] shrink-0 justify-end">
          <Avatar name={executive.name} src={headshotUrl} size={34} />
        </span>
      </div>
    </li>
  );
}
