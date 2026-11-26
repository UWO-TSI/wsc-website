'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../client';
import { useEditSnapshot } from '@/edit/edit-mode';
import { LIST_VISIBILITY_COLUMN, type ListTable } from '@/edit/list-draft';
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
  /**
   * The rows feed a list editor (the roster, the ledger, the logo wall,
   * the counted figures). In edit mode it gets hidden rows and rows marked
   * Will be removed too, so their chips show. Every other reader of the
   * same table gets the rows visitors will see after Publish.
   */
  editList?: boolean;
}

/**
 * Generic hook for Supabase SELECT queries with loading/error/data states.
 *
 * In edit mode the rows pass through the edit engine, which lays the list
 * draft over them (added, changed, reordered and removed rows), so a page
 * shows drafted rows wherever it would show published ones. After Publish
 * the engine bumps `refresh` and every query loads again in place.
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
    filters: givenFilters = [],
    enabled = true,
    editList = false,
  } = options;

  const { engine, status, rev, refresh } = useEditSnapshot();

  /*
    In edit mode a list table is read without its visibility filter (an
    admin's RLS allows it), and the filter is applied after the draft is
    laid over the rows. A row the editor hides then leaves, and a hidden
    row the editor shows again appears, on every page that reads the table.
  */
  const visibility =
    engine && table in LIST_VISIBILITY_COLUMN ? LIST_VISIBILITY_COLUMN[table as ListTable] : null;
  const filters = visibility ? givenFilters.filter((f) => f.column !== visibility) : givenFilters;

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
  }, [fetchData, refresh]);

  /* `status` is a dependency because Preview changes the rows without a
     draft change: the engine leaves hidden and removed rows out of every
     list while Preview is on. */
  const shown = useMemo(() => {
    if (!engine) return data;
    const rows = engine.rows(table, data);
    if (!visibility || editList) return rows;
    const list = engine.list(table as ListTable);
    return rows.filter((row) => {
      const r = row as Record<string, unknown>;
      return r[visibility] !== false && list.state(String(r.id)) !== 'removing';
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, status, rev, table, data, visibility, editList]);

  return { data: shown, loading, error, refetch: fetchData };
}
