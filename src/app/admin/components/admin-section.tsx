'use client';

import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import { useSupabaseMutation, deleteContentItem } from '@/lib/supabase/hooks/use-supabase-mutation';
import { uploadFile, getPublicUrl } from '@/lib/supabase/storage';
import { validateImageDimensions } from '@/lib/image-utils';
import { LIMITS } from '@/lib/admin-config';
import type { ContentConfig } from '@/lib/admin-config';
import { FORM_FIELDS } from '../form-config';
import AdminForm from './admin-form';

interface AdminSectionProps {
  configKey: string;
  config: ContentConfig;
}

export default function AdminSection({ configKey, config }: AdminSectionProps) {
  const { table, bucket, pathColumn, visibilityColumn, displayName, limit, orderable = true } = config;
  const hasStorage = !!(bucket && pathColumn);
  const fields = FORM_FIELDS[configKey];

  const { data: rows, loading, error, refetch } = useSupabaseQuery<Record<string, unknown>>(table);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl text-[var(--color-text-primary)] font-mono tracking-wide">
            {displayName}
          </h2>
          <p className="text-[var(--color-text-subtle)] font-mono text-xs mt-1">
            {rows.length} / {limit} items
          </p>
        </div>
        <button
          onClick={openAdd}
          disabled={atLimit || mutating}
          className="px-5 py-2 border border-[var(--color-border-gold)] text-[var(--color-gold)] font-mono text-xs tracking-[0.15em] uppercase hover:bg-[var(--color-gold)] hover:text-black disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
        >
          + Add {displayName.replace(/s$/, '')}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 py-12 text-[var(--color-text-muted)]">
          <div className="w-4 h-4 border border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs tracking-widest uppercase">Loading…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="border border-red-900/50 bg-red-950/20 px-4 py-3 mb-4">
          <p className="text-red-400 font-mono text-sm">{error.message}</p>
          {error.retryable && (
            <button
              onClick={refetch}
              className="mt-2 text-[var(--color-gold)] font-mono text-xs hover:underline cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && rows.length === 0 && (
        <p className="text-[var(--color-text-subtle)] font-mono text-sm py-12 border border-dashed border-[var(--color-border)] text-center">
          No {displayName.toLowerCase()} yet — click &ldquo;Add&rdquo; to create one.
        </p>
      )}

      {/* Table */}
      {!loading && !error && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                {orderable && (
                  <th className="text-left font-mono text-xs tracking-widest uppercase text-[var(--color-text-muted)] px-3 py-3 w-16">
                    Order
                  </th>
                )}
                {tableFields.map((f) => (
                  <th
                    key={f.name}
                    className="text-left font-mono text-xs tracking-widest uppercase text-[var(--color-text-muted)] px-3 py-3"
                  >
                    {f.label}
                  </th>
                ))}
                <th className="text-left font-mono text-xs tracking-widest uppercase text-[var(--color-text-muted)] px-3 py-3 w-24">
                  {visibilityLabel}
                </th>
                <th className="text-left font-mono text-xs tracking-widest uppercase text-[var(--color-text-muted)] px-3 py-3 w-28">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, idx) => (
                <tr
                  key={row.id as string}
                  className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)] transition-colors"
                >
                  {orderable && (
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button
                          disabled={idx === 0 || mutating}
                          onClick={() => handleMove(row, 'up')}
                          className="px-1.5 py-0.5 font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-gold)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                          title="Move up"
                        >
                          ▲
                        </button>
                        <button
                          disabled={idx === sortedRows.length - 1 || mutating}
                          onClick={() => handleMove(row, 'down')}
                          className="px-1.5 py-0.5 font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-gold)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                          title="Move down"
                        >
                          ▼
                        </button>
                      </div>
                    </td>
                  )}
                  {tableFields.map((f) => (
                    <td key={f.name} className="px-3 py-3 text-[var(--color-text-secondary)]">
                      {f.type === 'image' ? (
                        row[f.name] ? (
                          <img
                            src={getPublicUrl(bucket!, row[f.name] as string) ?? ''}
                            alt=""
                            className="h-10 w-10 object-cover border border-[var(--color-border)]"
                          />
                        ) : (
                          <span className="text-[var(--color-text-subtle)]">—</span>
                        )
                      ) : (
                        <span className="font-mono text-xs">
                          {String(row[f.name] ?? '').slice(0, 60) || (
                            <span className="text-[var(--color-text-subtle)]">—</span>
                          )}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-3">
                    <button
                      role="switch"
                      aria-checked={!!row[visibilityColumn]}
                      onClick={() => handleToggleVisibility(row)}
                      disabled={mutating}
                      className={`inline-flex items-center h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer disabled:opacity-50 ${
                        row[visibilityColumn]
                          ? 'bg-[var(--color-gold)]'
                          : 'bg-[var(--color-bg-overlay)]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          row[visibilityColumn] ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(row)}
                        className="text-[var(--color-text-muted)] font-mono text-xs hover:text-[var(--color-gold)] transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(row)}
                        className="text-[var(--color-text-muted)] font-mono text-xs hover:text-red-400 transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeForm}
        >
          <div
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--color-gold)] mb-6">
              {editingRow ? 'Edit' : 'Add'} {displayName.replace(/s$/, '')}
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
            />
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-red-400 mb-4">
              Confirm Delete
            </h3>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
              Delete{' '}
              <strong className="text-[var(--color-text-primary)]">
                {(deleteConfirm.title as string) ||
                  (deleteConfirm.name as string) ||
                  'this item'}
              </strong>
              ?
              {hasStorage && !!deleteConfirm[pathColumn!] && (
                <> The associated image will also be permanently deleted.</>
              )}{' '}
              This cannot be undone.
            </p>
            {mutError && (
              <p className="text-red-400 font-mono text-sm mb-4 bg-red-950/30 border border-red-900/50 px-3 py-2">
                {mutError.message}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={mutating}
                className="px-5 py-2 bg-red-600 text-white font-mono text-xs tracking-[0.15em] uppercase hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {mutating ? 'Deleting…' : 'Delete'}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-5 py-2 border border-[var(--color-border)] text-[var(--color-text-muted)] font-mono text-xs tracking-[0.15em] uppercase hover:border-[var(--color-border-gold)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
