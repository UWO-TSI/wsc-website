'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Button from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';
import { SETTINGS_COPY as C } from './copy';
import { SMALL } from './settings-list';
import { failureOf, type Failure } from './data';

/*
  The loading, error and expired states of one Settings list. Loading draws
  rows of the list's own shape (name, one line, an action), so nothing moves
  when the rows arrive. A reload after a write keeps the rows on screen.
*/

/**
 * Loads one list and reloads it after a write. `at` is when the data
 * arrived, so relative times ("expires in 3 days") are computed from it
 * rather than from the clock during render.
 */
export function useSettingsData<T>(fetch: () => Promise<T>) {
  const [state, setState] = useState<{ data: T | null; at: number; error: Failure | null }>({
    data: null,
    at: 0,
    error: null,
  });

  const reload = useCallback(
    () =>
      fetch().then(
        (data) => setState({ data, at: Date.now(), error: null }),
        (e) => setState((s) => ({ ...s, error: failureOf(e) }))
      ),
    [fetch]
  );

  useEffect(() => {
    let live = true;
    fetch().then(
      (data) => live && setState({ data, at: Date.now(), error: null }),
      (e) => live && setState((s) => ({ ...s, error: failureOf(e) }))
    );
    return () => {
      live = false;
    };
  }, [fetch]);

  return { ...state, reload };
}

const NAME_WIDTHS = ['58%', '44%', '66%', '50%'];

export function rowsSkeleton(count: number) {
  return Array.from({ length: count }, (_, i) => (
    <li key={i} className="flex items-center gap-3 rounded-md bg-sunken px-3 py-[10px]" aria-hidden="true">
      <span className="flex min-w-0 flex-1 flex-col gap-2 py-[3px]">
        <Skeleton className="h-[14px]" index={i} style={{ width: NAME_WIDTHS[i % NAME_WIDTHS.length] }} />
        <Skeleton className="h-3 w-24" index={i} />
      </span>
      <Skeleton className="h-[29px] w-[76px] shrink-0 rounded-pill" index={i} />
    </li>
  ));
}

export function LoadState({
  loading,
  error,
  expired,
  onRetry,
  skeleton,
  children,
}: {
  loading: boolean;
  error: string | null;
  expired: boolean;
  onRetry: () => void;
  skeleton: ReactNode;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <>
        <li className="sr-only" role="status">
          {C.loading}
        </li>
        {skeleton}
      </>
    );
  }
  if (error) {
    return (
      <li className="flex flex-wrap items-center gap-3 rounded-md bg-sunken px-3 py-[10px]">
        <p role="alert" className="body-sm flex-1 text-alert">
          {expired ? C.expired : error}
        </p>
        {expired ? (
          <Button variant="secondary" className={SMALL} href="/admin">
            {C.signInAgain}
          </Button>
        ) : (
          <Button variant="secondary" className={SMALL} onClick={onRetry}>
            {C.retry}
          </Button>
        )}
      </li>
    );
  }
  return <>{children}</>;
}
