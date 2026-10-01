'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Reorder, useDragControls } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import { useSupabaseMutation, deleteContentItem } from '@/lib/supabase/hooks/use-supabase-mutation';
import { uploadFile, getPublicUrl } from '@/lib/supabase/storage';
import { validateImageDimensions } from '@/lib/image-utils';
import { LIMITS } from '@/lib/admin-config';
import type { ContentConfig } from '@/lib/admin-config';
import { D, E } from '@/lib/motion';
import { FORM_FIELDS, type FormField } from '../form-config';
import { useUnsavedChanges } from '../unsaved-changes';
import AdminForm from './admin-form';
import SaveBar from './save-bar';
import Slab from '@/components/ui/slab';
import Button from '@/components/ui/button';
import Chip from '@/components/ui/chip';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';
import type { ExecGroup } from '@/types/database';

/*
  A content table (events, executives, roles, sponsors, statistics).

  Two kinds of change, committed differently:
  - Order and visibility are staged. Drag rows by their handle (or focus the
    handle and use the arrow keys) and flip visibility chips as often as you
    like; nothing is written until "Save all changes", which writes every
    staged row in one go.
  - Add, Edit and Delete commit from their own dialog. They carry uploads
    and the storage-first delete, which should not sit half-done in a draft.
    A dialog save refreshes the rows in place and keeps the staged order.

  Saving order writes display_order = position for every row whose stored
  value differs. The old Up/Down swapped two rows' values, which did
  nothing when both were 0 (the column default for every new row).
*/

type Row = Record<string, unknown>;

interface AdminSectionProps {
  configKey: string;
  config: ContentConfig;
}

/** Cell text for the list, resolving dropdown values to labels. */
function displayCell(field: FormField, value: unknown): string {
  const raw = String(value ?? '');
  if (field.type === 'select') {
    const match = field.options?.find((o) => o.value === raw);
    return (match?.label ?? raw).slice(0, 60);
  }
  return raw.slice(0, 60);
}

const idOf = (row: Row) => row.id as string;
const orderOf = (row: Row) => (row.display_order as number | null) ?? 0;

export default function AdminSection({ configKey, config }: AdminSectionProps) {
  const {
    table,
    bucket,
    pathColumn,
    visibilityColumn,
    displayName,
    singularName,
    limit,
    orderable = true,
    groupColumn,
    sort,
  } = config;
  const hasStorage = !!(bucket && pathColumn);
  const rawFields = FORM_FIELDS[configKey];
  const singular = singularName ?? displayName.replace(/s$/, '');

  const { data: rows, loading, error, refetch } = useSupabaseQuery<Row>(
    table,
    sort ? { orderBy: sort.column, ascending: sort.ascending, thenBy: sort.thenBy } : {}
  );

  /* Executive roles live in a table, so the Role dropdown and the role
     grouping are filled at runtime. Only fetched when something needs it. */
  const needsExecGroups = !!groupColumn || rawFields.some((f) => f.optionsSource === 'exec_groups');
  const { data: execGroups } = useSupabaseQuery<ExecGroup>('exec_groups', {
    enabled: needsExecGroups,
  });

  const fields = useMemo(
    () =>
      rawFields.map((field) =>
        field.optionsSource === 'exec_groups'
          ? {
              ...field,
              options: execGroups.map((g) => ({ value: g.slug, label: g.singular_label })),
            }
          : field
      ),
    [rawFields, execGroups]
  );

  /* The dialogs and the batch save fail independently, so each keeps its
     own error. */
  const { mutate, loading: mutating, error: mutError, reset: resetMutError } = useSupabaseMutation();
  const {
    mutate: mutateBatch,
    loading: saving,
    error: batchError,
    reset: resetBatchError,
  } = useSupabaseMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Row | null>(null);

  /** Staged order, as row ids. Null until the first move. */
  const [orderDraft, setOrderDraft] = useState<string[] | null>(null);
  /** Staged visibility, only for rows that differ from the database. */
  const [visDraft, setVisDraft] = useState<Record<string, boolean>>({});
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const atLimit = rows.length >= limit;

  /* Same rank the public team page uses: exec_groups order, unknown last. */
  const rankOf = useMemo(() => {
    const slugs = execGroups.map((g) => g.slug);
    return (row: Row) => {
      if (!groupColumn) return 0;
      const i = slugs.indexOf(String(row[groupColumn] ?? ''));
      return i === -1 ? slugs.length : i;
    };
  }, [execGroups, groupColumn]);

  /** The order the database holds now. Sort is stable, so ties keep query order. */
  const baseRows = useMemo(() => {
    if (!orderable) return rows;
    return [...rows].sort((a, b) => rankOf(a) - rankOf(b) || orderOf(a) - orderOf(b));
  }, [rows, orderable, rankOf]);

  /** The order on screen: the draft, then any row added since, regrouped. */
  const shownRows = useMemo(() => {
    if (!orderDraft) return baseRows;
    const byId = new Map(baseRows.map((r) => [idOf(r), r]));
    const drafted = orderDraft.map((id) => byId.get(id)).filter((r): r is Row => !!r);
    const rest = baseRows.filter((r) => !orderDraft.includes(idOf(r)));
    /* A role changed in the Edit dialog moves the row to its new group. */
    return [...drafted, ...rest].sort((a, b) => rankOf(a) - rankOf(b));
  }, [baseRows, orderDraft, rankOf]);

  /** One reorderable list per role, or a single list. */
  const segments = useMemo(() => {
    if (!groupColumn) return [{ key: 'all', heading: null as string | null, rows: shownRows }];
    const out: { key: string; heading: string | null; rows: Row[] }[] = [];
    for (const row of shownRows) {
      const slug = String(row[groupColumn] ?? '');
      let seg = out.find((s) => s.key === slug);
      if (!seg) {
        const group = execGroups.find((g) => g.slug === slug);
        seg = { key: slug, heading: group?.label ?? (slug || 'No role'), rows: [] };
        out.push(seg);
      }
      seg.rows.push(row);
    }
    return out;
  }, [shownRows, groupColumn, execGroups]);

  const visibleOf = (row: Row) => visDraft[idOf(row)] ?? !!row[visibilityColumn];

  const movedCount = orderDraft
    ? shownRows.filter((r, i) => baseRows[i] && idOf(baseRows[i]) !== idOf(r)).length
    : 0;
  const pending = movedCount + Object.keys(visDraft).length;

  useUnsavedChanges(`section:${configKey}`, pending > 0);

  const reorderSegment = (key: string, ids: string[]) => {
    setOrderDraft(segments.flatMap((s) => (s.key === key ? ids : s.rows.map(idOf))));
  };

  const toggleVisibility = (row: Row) => {
    const id = idOf(row);
    const next = !visibleOf(row);
    setVisDraft((prev) => {
      const rest = { ...prev };
      /* Flipping back to the stored value un-stages the row. */
      if (next === !!row[visibilityColumn]) delete rest[id];
      else rest[id] = next;
      return rest;
    });
  };

  const discardAll = () => {
    setOrderDraft(null);
    setVisDraft({});
    resetBatchError();
  };

  const saveAll = async () => {
    if (pending === 0) return;
    const updates: { id: string; patch: Row }[] = [];
    shownRows.forEach((row, i) => {
      const patch: Row = {};
      if (orderDraft && orderOf(row) !== i) patch.display_order = i;
      if (idOf(row) in visDraft) patch[visibilityColumn] = visDraft[idOf(row)];
      if (Object.keys(patch).length > 0) updates.push({ id: idOf(row), patch });
    });

    try {
      await mutateBatch(async () => {
        const results = await Promise.all(
          updates.map(({ id, patch }) => supabase.from(table).update(patch).eq('id', id))
        );
        const failed = results.find((r) => r.error);
        if (failed?.error) throw failed.error;
      });
      /* Refetch before clearing the drafts, so the list never shows the old
         order for a frame between the two. */
      await refetch();
      setOrderDraft(null);
      setVisDraft({});
      setSavedAt(Date.now());
    } catch {
      // Shown via batchError. Drafts stay, so Save can be pressed again.
    }
  };

  const handleSave = async (formData: Row, file: File | null) => {
    try {
      await mutate(async () => {
        let payload = { ...formData };

        if (hasStorage) {
          let updatedPath = formData[pathColumn!] as string | undefined;

          if (file) {
            if (!LIMITS.ALLOWED_IMAGE_TYPES.includes(file.type)) {
              throw new Error('Invalid file type. Please use a JPEG, PNG, WebP, or AVIF image.');
            }

            const maxW =
              configKey === 'executives'
                ? LIMITS.MAX_HEADSHOT_DIMENSION
                : configKey === 'sponsors'
                  ? LIMITS.MAX_LOGO_DIMENSION
                  : LIMITS.MAX_IMAGE_WIDTH;
            const maxH =
              configKey === 'executives'
                ? LIMITS.MAX_HEADSHOT_DIMENSION
                : configKey === 'sponsors'
                  ? LIMITS.MAX_LOGO_DIMENSION
                  : LIMITS.MAX_IMAGE_HEIGHT;

            await validateImageDimensions(file, maxW, maxH);

            if (file.size > LIMITS.MAX_IMAGE_SIZE_MB * 1024 * 1024) {
              throw new Error(
                `Image is too large. Maximum size is ${LIMITS.MAX_IMAGE_SIZE_MB} MB.`
              );
            }

            const { objectName } = await uploadFile(bucket!, file);
            updatedPath = objectName;

            // Best-effort: delete old file when updating
            if (editingRow && editingRow[pathColumn!] && editingRow[pathColumn!] !== updatedPath) {
              try {
                const { error: delErr } = await supabase.storage
                  .from(bucket!)
                  .remove([editingRow[pathColumn!] as string]);
                if (delErr) console.warn('Old file cleanup failed:', delErr.message);
              } catch {
                // Non-fatal
              }
            }
          }

          payload = { ...payload, [pathColumn!]: updatedPath };
        }

        if (editingRow) {
          const { error: updateError } = await supabase
            .from(table)
            .update(payload)
            .eq('id', editingRow.id as string);
          if (updateError) throw updateError;
        } else {
          const { count, error: countError } = await supabase
            .from(table)
            .select('id', { count: 'exact', head: true });
          if (countError) throw countError;
          if ((count ?? 0) >= limit) {
            throw new Error(
              `Maximum of ${limit} ${displayName.toLowerCase()} reached. Delete an item first.`
            );
          }
          /* A new row goes to the end, not to 0 alongside every other new
             row, which is how the ties behind the dead Up/Down came about. */
          if (orderable) {
            payload.display_order = rows.reduce((max, r) => Math.max(max, orderOf(r)), -1) + 1;
          }
          const { error: insertError } = await supabase.from(table).insert(payload);
          if (insertError) throw insertError;
        }
      });

      setShowForm(false);
      setEditingRow(null);
      resetMutError();
      await refetch();
    } catch {
      // error shown via mutError
    }
  };

  const handleDelete = async (row: Row) => {
    try {
      await mutate(async () => {
        if (hasStorage) {
          await deleteContentItem(table, row, bucket!, pathColumn!);
        } else {
          const { error } = await supabase.from(table).delete().eq('id', row.id as string);
          if (error) throw error;
        }
      });
      setDeleteConfirm(null);
      setVisDraft((prev) => {
        const rest = { ...prev };
        delete rest[idOf(row)];
        return rest;
      });
      await refetch();
    } catch {
      // error set by hook
    }
  };

  const tableFields = useMemo(() => fields.filter((f) => f.showInTable !== false), [fields]);

  /* One grid shared by the header and every row, so columns line up
     without a table (Reorder needs a plain list). */
  const gridTemplateColumns = [
    orderable ? '2.75rem' : null,
    ...tableFields.map((f) => (f.type === 'image' ? '3.5rem' : 'minmax(0,1fr)')),
    '7.5rem',
    '9.5rem',
  ]
    .filter(Boolean)
    .join(' ');

  const visibilityLabel =
    visibilityColumn === 'published' ? 'Published' : visibilityColumn === 'active' ? 'Active' : 'Visible';
  const hiddenLabel =
    visibilityColumn === 'published' ? 'Draft' : visibilityColumn === 'active' ? 'Inactive' : 'Hidden';

  const openAdd = () => {
    setEditingRow(null);
    resetMutError();
    setShowForm(true);
  };

  const openEdit = (row: Row) => {
    setEditingRow(row);
    resetMutError();
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRow(null);
  };

  const rowName = (row: Row) =>
    (row.title as string) ||
    (row.name as string) ||
    (row.label as string) ||
    `this ${singular.toLowerCase()}`;

  const cells = (row: Row) => (
    <>
      {tableFields.map((f) => (
        <div key={f.name} className="min-w-0">
          {f.type === 'image' ? (
            row[f.name] ? (
              <div className="relative h-10 w-10 overflow-hidden rounded-sm bg-page">
                <Image
                  src={getPublicUrl(bucket!, row[f.name] as string) ?? ''}
                  alt=""
                  fill
                  sizes="40px"
                  className={configKey === 'sponsors' ? 'object-contain' : 'object-cover'}
                />
              </div>
            ) : (
              <span className="body-sm text-ink-faint">None</span>
            )
          ) : (
            <span className="body-sm text-ink block truncate">
              {displayCell(f, row[f.name]) || <span className="text-ink-faint">None</span>}
            </span>
          )}
        </div>
      ))}
      <div>
        <button
          type="button"
          aria-pressed={visibleOf(row)}
          aria-label={`${rowName(row)}: ${visibleOf(row) ? visibilityLabel : hiddenLabel}. Press to change.`}
          onClick={() => toggleVisibility(row)}
          disabled={saving}
          className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Chip status={visibleOf(row) ? 'ok' : 'neutral'}>
            {visibleOf(row) ? visibilityLabel : hiddenLabel}
            {idOf(row) in visDraft ? ' *' : ''}
          </Chip>
        </button>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button variant="tertiary" className="!px-3 !py-1.5" onClick={() => openEdit(row)}>
          Edit
        </Button>
        <Button variant="tertiary" className="!px-3 !py-1.5" onClick={() => setDeleteConfirm(row)}>
          Delete
        </Button>
      </div>
    </>
  );

  return (
    <div>
      <SaveBar
        title={displayName}
        hint={`${rows.length} / ${limit} items${orderable ? '. Drag the handle to reorder.' : ''}`}
        pending={pending}
        saving={saving}
        savedAt={savedAt}
        onSave={saveAll}
        onDiscard={discardAll}
      >
        <Button variant="secondary" onClick={openAdd} disabled={atLimit || mutating || saving}>
          Add {singular.toLowerCase()}
        </Button>
      </SaveBar>

      {batchError && <p className="body-sm text-alert mb-5">{batchError.message}</p>}

      <Slab tone="raised">
        <AsyncStateWrapper
          loading={loading}
          error={error}
          data={rows}
          onRetry={refetch}
          emptyMessage={`No ${displayName.toLowerCase()} yet. Add one to get started.`}
        >
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid gap-3 px-3 pb-2" style={{ gridTemplateColumns }}>
                {orderable && <span className="label">Order</span>}
                {tableFields.map((f) => (
                  <span key={f.name} className="label">
                    {f.label}
                  </span>
                ))}
                <span className="label">{visibilityLabel}</span>
                <span className="label">Actions</span>
              </div>

              {segments.map((seg) => (
                <div key={seg.key}>
                  {seg.heading && (
                    <h3 className="label text-accent-ink px-3 pt-5 pb-1">{seg.heading}</h3>
                  )}
                  {orderable ? (
                    <Reorder.Group
                      as="ul"
                      axis="y"
                      values={seg.rows.map(idOf)}
                      onReorder={(ids: string[]) => reorderSegment(seg.key, ids)}
                      className="flex flex-col gap-2 pt-2"
                    >
                      {seg.rows.map((row, i) => (
                        <ReorderRow
                          key={idOf(row)}
                          id={idOf(row)}
                          name={rowName(row)}
                          gridTemplateColumns={gridTemplateColumns}
                          disabled={saving}
                          onStep={(dir) => {
                            const ids = seg.rows.map(idOf);
                            const j = i + dir;
                            if (j < 0 || j >= ids.length) return;
                            [ids[i], ids[j]] = [ids[j], ids[i]];
                            reorderSegment(seg.key, ids);
                          }}
                        >
                          {cells(row)}
                        </ReorderRow>
                      ))}
                    </Reorder.Group>
                  ) : (
                    <ul className="flex flex-col gap-2 pt-2">
                      {seg.rows.map((row) => (
                        <li
                          key={idOf(row)}
                          className="grid items-center gap-3 rounded-md bg-sunken px-3 py-3"
                          style={{ gridTemplateColumns }}
                        >
                          {cells(row)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </AsyncStateWrapper>
      </Slab>

      {/* Form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.6)] p-4"
          onClick={closeForm}
        >
          <div
            className="bg-raised shadow-3 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="label text-accent-ink mb-6">
              {editingRow ? 'Edit' : 'Add'} {singular.toLowerCase()}
            </h3>
            <AdminForm
              fields={fields}
              initialData={editingRow}
              pathColumn={pathColumn}
              bucket={bucket}
              onSave={handleSave}
              onCancel={closeForm}
              saving={mutating}
              error={mutError}
              idPrefix={configKey}
              imageFit={configKey === 'sponsors' ? 'contain' : 'cover'}
            />
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.6)] p-4"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-raised shadow-3 rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="label text-alert mb-4">Confirm delete</h3>
            <p className="body text-ink mb-6">
              Delete <strong className="text-ink">{rowName(deleteConfirm)}</strong>?
              {hasStorage && !!deleteConfirm[pathColumn!] && (
                <> The associated image will also be permanently deleted.</>
              )}{' '}
              This cannot be undone.
            </p>
            {mutError && <p className="body-sm text-alert mb-4">{mutError.message}</p>}
            <div className="flex gap-3">
              <Button onClick={() => handleDelete(deleteConfirm)} disabled={mutating}>
                {mutating ? 'Deleting' : `Delete ${singular.toLowerCase()}`}
              </Button>
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/*
  One draggable row. Only the handle starts a drag (dragListener off), so
  the chip and the Edit and Delete buttons stay clickable and text in the
  row stays selectable. The handle also takes ArrowUp and ArrowDown, one
  step at a time, for keyboard editors; focus stays on it as the row moves.

  Rows slide aside on D.move / E.move, the system's "something changes
  position" budget. The held row takes --sh-3 so it reads as lifted.
*/
function ReorderRow({
  id,
  name,
  gridTemplateColumns,
  disabled,
  onStep,
  children,
}: {
  id: string;
  name: string;
  gridTemplateColumns: string;
  disabled: boolean;
  onStep: (dir: -1 | 1) => void;
  children: React.ReactNode;
}) {
  const controls = useDragControls();
  const [held, setHeld] = useState(false);

  return (
    <Reorder.Item
      as="li"
      value={id}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => setHeld(true)}
      onDragEnd={() => setHeld(false)}
      transition={{ duration: D.move, ease: E.move }}
      style={{ gridTemplateColumns, position: 'relative', zIndex: held ? 1 : 0 }}
      className={`grid items-center gap-3 rounded-md bg-sunken px-3 py-3 transition-shadow duration-[var(--d-hover)] ease-enter ${
        held ? 'shadow-3' : ''
      }`}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={`Reorder ${name}. Drag, or use the up and down arrow keys.`}
        onPointerDown={(e) => {
          if (disabled) return;
          e.preventDefault();
          controls.start(e);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            onStep(e.key === 'ArrowUp' ? -1 : 1);
          }
        }}
        className={`flex h-9 w-9 items-center justify-center rounded-sm text-ink-muted touch-none transition-colors duration-[var(--d-hover)] ease-enter hover:text-accent-ink hover:bg-accent-veil disabled:cursor-not-allowed disabled:text-ink-faint ${
          held ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M2.5 4h11M2.5 8h11M2.5 12h11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {children}
    </Reorder.Item>
  );
}
