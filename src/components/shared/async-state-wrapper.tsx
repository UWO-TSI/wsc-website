'use client';

import type { ReactNode } from 'react';
import Button from '@/components/ui/button';
import type { QueryError } from '@/types/database';

/*
  AsyncState. Four states, and none of them is a blank screen: loading, error
  with a retry, empty, and 404.

  The spinner is a masked conic gradient (the .spin class in globals.css), not
  a border-top trick, because borders are out.

  Empty states name what is missing and do not apologise.
*/

function Bed({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 px-6 py-14 text-center">
      {children}
    </div>
  );
}

interface AsyncStateWrapperProps {
  loading: boolean;
  error: QueryError | null;
  data: unknown[];
  onRetry?: () => void;
  /** Names what is missing, e.g. "No events on the calendar yet." */
  emptyMessage?: string;
  children: ReactNode;
}

export default function AsyncStateWrapper({
  loading,
  error,
  data,
  onRetry,
  emptyMessage = 'Nothing here yet.',
  children,
}: AsyncStateWrapperProps) {
  if (loading) {
    return (
      <Bed>
        <span className="spin" role="status" aria-label="Loading" />
        <span className="label">Loading</span>
      </Bed>
    );
  }

  if (error) {
    return (
      <Bed>
        <p className="body text-ink max-w-[42ch]">{error.message}</p>
        {error.retryable && onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        )}
      </Bed>
    );
  }

  const isEmpty = Array.isArray(data) ? data.length === 0 : !data;
  if (isEmpty) {
    return (
      <Bed>
        <p className="title-sm text-ink-muted">{emptyMessage}</p>
      </Bed>
    );
  }

  return <>{children}</>;
}
