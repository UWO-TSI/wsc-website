'use client';

import { useState } from 'react';
import type { FormField } from '../form-config';
import type { QueryError } from '@/types/database';
import { getPublicUrl } from '@/lib/supabase/storage';

interface AdminFormProps {
  fields: FormField[];
  initialData: Record<string, unknown> | null;
  pathColumn?: string;
  bucket?: string;
  onSave: (formData: Record<string, unknown>, file: File | null) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  error: QueryError | null;
}

export default function AdminForm({
  fields,
  initialData,
  pathColumn,
  bucket,
  onSave,
  onCancel,
  saving,
  error,
}: AdminFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const data: Record<string, unknown> = {};
    for (const field of fields) {
      if (field.type === 'image') continue;
      data[field.name] = initialData?.[field.name] ?? field.defaultValue ?? '';
    }
    return data;
  });

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const processFile = (selected: File | null | undefined) => {
    if (selected?.type.startsWith('image/')) setFile(selected);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    processFile(e.dataTransfer?.files?.[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, file);
  };

  const currentImagePath = pathColumn && initialData ? (initialData[pathColumn] as string | null) : null;
  const currentImageUrl = currentImagePath && bucket ? getPublicUrl(bucket, currentImagePath) : null;

  const inputCls =
    'w-full bg-[var(--color-bg-subtle)] border border-[var(--color-border)] px-3 py-2.5 text-[var(--color-text-primary)] text-sm font-mono placeholder-[var(--color-text-subtle)] focus:outline-none focus:border-[var(--color-border-gold)] transition-colors';
  const labelCls = 'block text-[var(--color-text-muted)] font-mono text-xs tracking-[0.15em] uppercase mb-2';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {fields.map((field) => {
        if (field.type === 'image') {
          const inputId = `file-input-${field.name}`;
          return (
            <div key={field.name}>
              <label className={labelCls}>{field.label}</label>
              {currentImageUrl && !file && (
                <div className="mb-3">
                  <img
                    src={currentImageUrl}
                    alt="Current"
                    className="h-16 w-16 object-cover border border-[var(--color-border)]"
                  />
                  <p className="text-[var(--color-text-subtle)] font-mono text-xs mt-1.5">
                    Current image
                  </p>
                </div>
              )}
              <div
                className={`border border-dashed p-6 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-[var(--color-gold)] bg-[var(--color-gold-dim)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-border-gold)]'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !file && document.getElementById(inputId)?.click()}
              >
                <input
                  id={inputId}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(e) => processFile(e.target.files?.[0])}
                  className="hidden"
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-[var(--color-text-secondary)] text-sm font-mono truncate max-w-48">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-gold)] transition-colors font-mono text-xs"
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <span className="text-[var(--color-text-muted)] text-sm font-mono">
                    Drop image or click to browse
                  </span>
                )}
              </div>
            </div>
          );
        }

        if (field.type === 'select') {
          return (
            <div key={field.name}>
              <label className={labelCls}>{field.label}</label>
              <select
                value={(formData[field.name] as string) || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
                className={inputCls}
              >
                <option value="">Select…</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (field.type === 'textarea') {
          return (
            <div key={field.name}>
              <label className={labelCls}>{field.label}</label>
              <textarea
                value={(formData[field.name] as string) || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
                placeholder={field.placeholder}
                rows={4}
                className={`${inputCls} resize-y`}
              />
            </div>
          );
        }

        if (field.type === 'date') {
          return (
            <div key={field.name}>
              <label className={labelCls}>{field.label}</label>
              <input
                type="date"
                value={(formData[field.name] as string) || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
                className={inputCls}
              />
            </div>
          );
        }

        return (
          <div key={field.name}>
            <label className={labelCls}>{field.label}</label>
            <input
              type="text"
              value={(formData[field.name] as string) || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
              placeholder={field.placeholder}
              className={inputCls}
            />
          </div>
        );
      })}

      {error && (
        <p className="text-red-400 text-sm font-mono bg-red-950/30 border border-red-900/50 px-3 py-2.5">
          {error.message}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[var(--color-gold)] text-black font-mono text-xs tracking-[0.15em] uppercase hover:bg-[var(--color-gold-muted)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {saving ? 'Saving…' : initialData ? 'Update' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-[var(--color-border)] text-[var(--color-text-muted)] font-mono text-xs tracking-[0.15em] uppercase hover:border-[var(--color-border-gold)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
