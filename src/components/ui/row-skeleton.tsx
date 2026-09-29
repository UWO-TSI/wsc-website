import Skeleton from '@/components/ui/skeleton';

/*
  The ledger row, before it has arrived.

  Built to the same anatomy as ExecRow and TimelineEvent (`.row` in
  globals.css): a 30px index, a name that takes the remaining width, a meta
  column, and a 34px slot on the right. It sits at the row's rest padding, so
  the list occupies exactly the height it will occupy once the query resolves
  and nothing below it moves.

  The name widths vary down the column, because a stack of identical
  full-width bars reads as a loading graphic rather than as a list of names.
*/

const NAME_WIDTHS = ['62%', '48%', '71%', '55%', '66%', '44%'];

export default function RowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ul className="flex list-none flex-col gap-1 p-0">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="row">
          <div className="flex w-full flex-wrap items-center gap-x-[14px] gap-y-1">
            <Skeleton className="h-3 w-[30px] shrink-0" index={i} />

            <span className="order-1 flex-1 basis-40">
              <Skeleton
                className="h-[19px]"
                index={i}
                style={{ width: NAME_WIDTHS[i % NAME_WIDTHS.length] }}
              />
            </span>

            <span className="order-2 hidden shrink-0 sm:block">
              <Skeleton className="h-3 w-24" index={i} />
            </span>

            <Skeleton
              className="order-3 ml-auto h-[34px] w-[34px] shrink-0 rounded-full"
              index={i}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
