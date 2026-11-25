/*
  The list draft interface: types only, so importing it costs the anonymous
  bundle nothing. The implementation is in src/edit/engine/draft-store.ts
  and is reached through useEditSnapshot().engine?.list(table) while edit
  mode is on.

  A list draft records what the editor changed, never a copy of the list:
  rows added, field patches on published rows, the full draft order, and
  the published rows marked for removal. A removed row stays in the list
  with Will be removed until Publish, and Preview leaves it out.

  Publishing lists (Grip, AddTile, the publish order for rows and their
  files) is built on this by the edit-lists work in phase 3.

  Publish refuses while an added executive has no name, and moves focus to
  the field inside `[data-ed-field="executives.<id>.name"]`, so the list
  editor puts that attribute on the name field's shell.
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
