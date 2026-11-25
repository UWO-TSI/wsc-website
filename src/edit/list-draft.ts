import { createElement } from 'react';
import type { ComponentType } from 'react';
import { useEditSnapshot, type EditEngineApi } from '@/edit/edit-mode';

/*
  The list draft interface. Types, two constants and the branch below, so
  importing it costs the anonymous bundle almost nothing. The
  implementation is in src/edit/engine/draft-store.ts and is reached
  through useEditSnapshot().engine?.list(table) while edit mode is on.

  A list draft records what the editor changed, never a copy of the list:
  rows added, field patches on published rows, the full draft order, and
  the published rows marked for removal. A removed row stays in the list
  with Will be removed until Publish, and Preview leaves it out.

  The list editors (Grip, AddTile, the chips, the inline fields) are in
  src/edit/engine/list-editors.tsx, and Publish writes their changes in
  src/edit/engine/publish.ts.

  Publish refuses while any list's name field (NAME_FIELD in publish.ts)
  is empty on an added row, or cleared on a published one, and moves focus
  to the field inside `[data-ed-field="<table>.<id>.<name field>"]`, so the
  list editor puts that attribute on the name field's shell.
*/

export type ListTable = 'executives' | 'events' | 'sponsors' | 'site_stats';

/** The column that hides a row from visitors, per table. */
export const LIST_VISIBILITY_COLUMN: Record<ListTable, string> = {
  executives: 'visible',
  events: 'published',
  sponsors: 'active',
  site_stats: 'visible',
};

/** Ids of rows added in the draft start with this, so they never match a uuid. */
export const DRAFT_ID_PREFIX = 'draft-';

export interface StoredListDraft {
  /** Draft id to the new row's fields. */
  added: Record<string, Record<string, unknown>>;
  /** Published id to the changed fields. */
  updates: Record<string, Record<string, unknown>>;
  /** Every id in draft order, published and added. Null until reordered. */
  order: string[] | null;
  /** Published ids marked Will be removed. */
  removed: string[];
  updatedAt: number;
}

export type ListRowState = 'added' | 'changed' | 'removing' | null;

export interface ListDraftApi<Row extends { id: string } = { id: string }> {
  /** Adds a row at `index` (default: the end) and returns its draft id. */
  add: (fields: Partial<Row>, index?: number) => string;
  update: (id: string, patch: Partial<Row>) => void;
  /** Moves one row to `index` in the current draft order. */
  move: (id: string, index: number) => void;
  /**
   * Moves one row to just before or after another, in the full draft
   * order. Lists that show a sorted view (the roster sorts by role) move
   * with this, so the index is never taken from the sorted view.
   */
  moveNextTo: (id: string, targetId: string, after: boolean) => void;
  /** Sets the table's visibility column. */
  hide: (id: string, hidden: boolean) => void;
  /** An added row is dropped at once; a published row is marked Will be removed. */
  remove: (id: string) => void;
  /** Takes a published row off the removal list. */
  keep: (id: string) => void;
  state: (id: string) => ListRowState;
  /** A chosen file for one column of a row, kept as a blob until Publish. */
  setFile: (id: string, column: string, file: File) => Promise<void>;
  /** Object URL of a drafted file, or null. */
  fileUrl: (id: string, column: string) => string | null;
}

/*
  The edit branch of a whole list.

  A list component renders its visitor version until the engine is loaded
  and the page is in edit mode, then the engine's editor for that list with
  the same props. The engine registers its editors on the API object it
  publishes (`listEditors`), so this file names no engine module and a
  visitor downloads none of it. Preview reads `editing: false` and gets the
  visitor version with the draft rows in it.
*/

export type ListEditorName = 'executives' | 'events' | 'sponsors' | 'stats';

export interface ListEngineApi extends EditEngineApi {
  listEditors: Record<ListEditorName, ComponentType<never>>;
}

/** True while the page is in edit mode with the engine loaded. */
export function useListEditBranch(): boolean {
  const { status, engine } = useEditSnapshot();
  return status === 'editing' && engine !== null && 'listEditors' in engine;
}

export function ListEditBranch<P extends object>({ name, props }: { name: ListEditorName; props: P }) {
  const { engine } = useEditSnapshot();
  const editor = (engine as ListEngineApi | null)?.listEditors?.[name] as ComponentType<P> | undefined;
  return editor ? createElement(editor, props) : null;
}
