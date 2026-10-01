'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../client';
import { classifyError } from '@/lib/error-utils';
import type { QueryError, QueryResult } from '@/types/database';

interface QueryFilter {
  column: string;
  operator: string;
  value: unknown;
}

interface QueryOptions {
  select?: string;
  orderBy?: string;
  ascending?: boolean;
  /**
   * Tie-break after `orderBy`, same direction. Two events on one date
   * otherwise come back in whatever order Postgres finds them, and can
   * swap places between two loads of the same page.
   */
  thenBy?: string;
  filters?: QueryFilter[];
  enabled?: boolean;
}

/**
 * Generic hook for Supabase SELECT queries with loading/error/data states.
 */
export function useSupabaseQuery<T>(
  table: string,
  options: QueryOptions = {}
): QueryResult<T> {
  const {
    select = '*',
    orderBy = 'display_order',
    ascending = true,
    thenBy,
    filters = [],
    enabled = true,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<QueryError | null>(null);
  /*
    Only the first load shows the loading state. A refetch after a save keeps
    the rows on screen and swaps them in place, so the list does not drop to
    a spinner and back (the flicker editors saw on every save). After an
    error nothing usable is on screen, so a retry shows loading again.
  */
  const loadedRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    if (!loadedRef.current) setLoading(true);
    setError(null);

    try {
      let query = supabase.from(table).select(select);

      for (const f of filters) {
        query = query.filter(f.column, f.operator, f.value);
      }

      if (orderBy) {
        query = query.order(orderBy, { ascending });
      }
      if (orderBy && thenBy) {
        query = query.order(thenBy, { ascending });
      }

      const { data: rows, error: queryError } = await query;

      if (queryError) {
        loadedRef.current = false;
        setError(classifyError(queryError));
        setData([]);
      } else {
        loadedRef.current = true;
        setData((rows as T[]) ?? []);
        setError(null);
      }
    } catch (err) {
      loadedRef.current = false;
      setError(classifyError(err as Error));
      setData([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, select, orderBy, ascending, thenBy, JSON.stringify(filters), enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
