'use client';

import Avatar from '@/components/ui/avatar';
import { getPublicUrl } from '@/lib/supabase/storage';
import type { Executive } from '@/types/database';

/*
  ExecRow — Row Expand, sequence 10.

  The whole row is one focusable button, which is how a keyboard user sees
  the avatar at all: focus produces the identical state as hover. Under
  reduced motion the padding growth and the name offset drop, but the
  --raised fill and --sh-2 still apply.
*/

interface ExecutiveRowProps {
  executive: Executive;
  index: number;
}

export default function ExecutiveRow({ executive, index }: ExecutiveRowProps) {
  const headshotUrl = getPublicUrl('headshots', executive.headshot_path);

  return (
    <button
      type="button"
      className="group flex w-full flex-wrap items-center gap-x-[14px] gap-y-1 rounded-md bg-transparent px-[14px] py-[14px] text-left shadow-none transition-[padding,background-color,box-shadow] duration-[var(--d-move)] ease-move hover:bg-raised hover:py-[22px] hover:shadow-2 focus-visible:bg-raised focus-visible:py-[22px] focus-visible:shadow-2 motion-reduce:hover:py-[14px] motion-reduce:focus-visible:py-[14px]"
    >
      <span className="label w-[30px] shrink-0 text-ink-faint">
        {String(index).padStart(2, '0')}
      </span>
      <span className="title-sm order-1 flex-1 basis-40 transition-transform duration-[var(--d-move)] ease-move group-hover:translate-x-[10px] group-focus-visible:translate-x-[10px] motion-reduce:group-hover:translate-x-0 motion-reduce:group-focus-visible:translate-x-0">
        {executive.name}
      </span>
      <span className="meta order-2 shrink-0 pl-[44px] sm:pl-0">
        {executive.title}
      </span>
      <span className="order-3 ml-auto flex w-[34px] shrink-0 translate-x-[10px] justify-end opacity-0 transition-[opacity,transform] duration-[var(--d-move)] ease-move group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:translate-x-0">
        <Avatar name={executive.name} src={headshotUrl} size={34} />
      </span>
    </button>
  );
}
