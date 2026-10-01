'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import { useSupabaseMutation, deleteContentItem } from '@/lib/supabase/hooks/use-supabase-mutation';
import { uploadFile, getPublicUrl } from '@/lib/supabase/storage';
import { validateImageDimensions } from '@/lib/image-utils';
import { LIMITS } from '@/lib/admin-config';
import type { ContentConfig } from '@/lib/admin-config';
import { FORM_FIELDS, type FormField } from '../form-config';
import AdminForm from './admin-form';
import Slab from '@/components/ui/slab';
import Button from '@/components/ui/button';
import Chip from '@/components/ui/chip';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';
import type { ExecGroup } from '@/types/database';

interface AdminSectionProps {
  configKey: string;
  config: ContentConfig;
}

/** Cell text for the list table, resolving dropdown values to labels. */
function displayCell(field: FormField, value: unknown): string {
  const raw = String(value ?? '');
  if (field.type === 'select') {
    const match = field.options?.find((o) => o.value === raw);
    return (match?.label ?? raw).slice(0, 60);
  }
  return raw.slice(0, 60);
}

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
    sort,
  } = config;
  const hasStorage = !!(bucket && pathColumn);
  const rawFields = FORM_FIELDS[configKey];
  const singular = singularName ?? displayName.replace(/s$/, '');

  const { data: rows, loading, error, refetch } = useSupabaseQuery<Record<string, unknown>>(
    table,
    sort ? { orderBy: sort.column, ascending: sort.ascending, thenBy: sort.thenBy } : {}
  );

  /* Executive roles live in a table, so the Role dropdown is filled at
     runtime. Only fetched when a field asks for it. */
  const needsExecGroups = rawFields.some((f) => f.optionsSource === 'exec_groups');
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
  const { mutate, loading: mutating, error: mutError, reset: resetMutError } = useSupabaseMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Record<string, unknown> | null>(null);

  const atLimit = rows.length >= limit;

  const handleToggleVisibility = async (row: Record<string, unknown>) => {
    const newVal = !row[visibilityColumn];
    try {
      await mutate(async () => {
        const { error: updateError } = await supabase
          .from(table)
          .update({ [visibilityColumn]: newVal })
          .eq('id', row.id as string);
        if (updateError) throw updateError;
      });
      refetch();
    } catch {
      // error set by hook
    }
  };

  const handleSave = async (formData: Record<string, unknown>, file: File | null) => {
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
          const { error: insertError } = await supabase.from(table).insert(payload);
          if (insertError) throw insertError;
        }
      });

      setShowForm(false);
      setEditingRow(null);
      resetMutError();
      refetch();
    } catch {
      // error shown via mutError
    }
  };

  const handleDelete = async (row: Record<string, unknown>) => {
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
      refetch();
    } catch {
      // error set by hook
    }
  };

  const handleMove = async (row: Record<string, unknown>, direction: 'up' | 'down') => {
    if (!orderable) return;
    const sorted = [...rows].sort(
      (a, b) => ((a.display_order as number) ?? 0) - ((b.display_order as number) ?? 0)
    );
    const idx = sorted.findIndex((r) => r.id === row.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const thisOrder = (sorted[idx].display_order as number) ?? 0;
    const otherOrder = (sorted[swapIdx].display_order as number) ?? 0;

    try {
      await mutate(async () => {
        const { error: e1 } = await supabase
          .from(table)
          .update({ display_order: otherOrder })
          .eq('id', sorted[idx].id as string);
        if (e1) throw e1;
        const { error: e2 } = await supabase
          .from(table)
          .update({ display_order: thisOrder })
          .eq('id', sorted[swapIdx].id as string);
        if (e2) throw e2;
      });
      refetch();
    } catch {
      // error set by hook
    }
  };

  const tableFields = useMemo(() => fields.filter((f) => f.showInTable !== false), [fields]);

  const sortedRows = useMemo(
    () =>
      orderable
        ? [...rows].sort(
            (a, b) => ((a.display_order as number) ?? 0) - ((b.display_order as number) ?? 0)
          )
        : rows,
    [rows, orderable]
  );

  const visibilityLabel =
    visibilityColumn === 'published' ? 'Published' : visibilityColumn === 'active' ? 'Active' : 'Visible';
  const hiddenLabel =
    visibilityColumn === 'published' ? 'Draft' : visibilityColumn === 'active' ? 'Inactive' : 'Hidden';

  const openAdd = () => {
    setEditingRow(null);
    resetMutError();
    setShowForm(true);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditingRow(row);
    resetMutError();
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRow(null);
  };

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="title-sm text-ink">{displayName}</h2>
          <p className="meta text-ink-faint mt-1">
            {rows.length} / {limit} items
          </p>
        </div>
        <Button onClick={openAdd} disabled={atLimit || mutating}>
          Add {singular.toLowerCase()}
        </Button>
      </div>

      <Slab tone="raised">
        <AsyncStateWrapper
          loading={loading}
          error={error}
          data={rows}
          onRetry={refetch}
          emptyMessage={`No ${displayName.toLowerCase()} yet. Add one to get started.`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr>
                  {orderable && <th className="label px-3 pb-2 w-16">Order</th>}
                  {tableFields.map((f) => (
                    <th key={f.name} className="label px-3 pb-2">
                      {f.label}
                    </th>
                  ))}
                  <th className="label px-3 pb-2 w-28">{visibilityLabel}</th>
                  <th className="label px-3 pb-2 w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row, idx) => (
                  <tr key={row.id as string} className="bg-sunken">
                    {orderable && (
                      <td className="px-3 py-3 rounded-l-md">
                        <div className="flex gap-1">
                          <button
                            disabled={idx === 0 || mutating}
                            onClick={() => handleMove(row, 'up')}
                            className="label px-1.5 py-0.5 text-ink-muted hover:text-accent-ink disabled:text-ink-faint disabled:cursor-not-allowed cursor-pointer transition-colors duration-[var(--d-hover)] ease-enter"
                            aria-label={`Move ${singular.toLowerCase()} up`}
                          >
                            Up
                          </button>
                          <button
                            disabled={idx === sortedRows.length - 1 || mutating}
                            onClick={() => handleMove(row, 'down')}
                            className="label px-1.5 py-0.5 text-ink-muted hover:text-accent-ink disabled:text-ink-faint disabled:cursor-not-allowed cursor-pointer transition-colors duration-[var(--d-hover)] ease-enter"
                            aria-label={`Move ${singular.toLowerCase()} down`}
                          >
                            Down
                          </button>
                        </div>
                      </td>
                    )}
                    {tableFields.map((f, colIdx) => (
                      <td
                        key={f.name}
                        className={`px-3 py-3 text-ink ${!orderable && colIdx === 0 ? 'rounded-l-md' : ''}`}
                      >
                        {f.type === 'image' ? (
                          row[f.name] ? (
                            <div className="relative h-10 w-10 overflow-hidden rounded-sm bg-page">
                              <Image
                                src={getPublicUrl(bucket!, row[f.name] as string) ?? ''}
                                alt=""
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <span className="text-ink-faint">None</span>
                          )
                        ) : (
                          <span className="body-sm text-ink">
                            {displayCell(f, row[f.name]) || (
                              <span className="text-ink-faint">None</span>
                            )}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        aria-pressed={!!row[visibilityColumn]}
                        onClick={() => handleToggleVisibility(row)}
                        disabled={mutating}
                        className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Chip status={row[visibilityColumn] ? 'ok' : 'neutral'}>
                          {row[visibilityColumn] ? visibilityLabel : hiddenLabel}
                        </Chip>
                      </button>
                    </td>
                    <td className="px-3 py-3 rounded-r-md">
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="tertiary" className="!px-3 !py-1.5" onClick={() => openEdit(row)}>
                          Edit
                        </Button>
                        <Button
                          variant="tertiary"
                          className="!px-3 !py-1.5"
                          onClick={() => setDeleteConfirm(row)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              Delete{' '}
              <strong className="text-ink">
                {(deleteConfirm.title as string) ||
                  (deleteConfirm.name as string) ||
                  `this ${singular.toLowerCase()}`}
              </strong>
              ?
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
