'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { FormField } from '../form-config';
import type { QueryError } from '@/types/database';
import { getPublicUrl } from '@/lib/supabase/storage';
import Button from '@/components/ui/button';
import Slab from '@/components/ui/slab';

interface AdminFormProps {
  fields: FormField[];
  initialData: Record<string, unknown> | null;
  pathColumn?: string;
  bucket?: string;
  onSave: (formData: Record<string, unknown>, file: File | null) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  error: QueryError | null;
  /** Keeps field ids unique when more than one form could exist in the DOM. */
  idPrefix: string;
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
  idPrefix,
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

  const fieldId = (name: string) => `${idPrefix}-${name}`;

  const inputCls =
    'w-full bg-page rounded-sm px-[15px] py-[13px] text-ink body font-text';

  return (
    <Slab tone="sunken" as="div">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {fields.map((field) => {
          const id = fieldId(field.name);

          if (field.type === 'image') {
            return (
              <div key={field.name}>
                <label htmlFor={id} className="label mb-2 block">
                  {field.label}
                </label>
                {currentImageUrl && !file && (
                  <div className="mb-3 flex items-center gap-3">
                    <Image
                      src={currentImageUrl}
                      alt="Current"
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-sm object-cover"
                    />
                    <p className="meta text-ink-faint">Current image</p>
                  </div>
                )}
                <div
                  className={`rounded-sm p-6 text-center cursor-pointer transition-colors duration-[var(--d-hover)] ease-enter ${
                    dragActive ? 'bg-accent-veil' : 'bg-page hover:bg-accent-veil'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => !file && document.getElementById(id)?.click()}
                >
                  <input
                    id={id}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={(e) => processFile(e.target.files?.[0])}
                    className="hidden"
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <span className="body-sm text-ink truncate max-w-48">{file.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="label text-ink-muted hover:text-accent-ink transition-colors duration-[var(--d-hover)] ease-enter cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <span className="body-sm text-ink-muted">Drop image or click to browse</span>
                  )}
                </div>
              </div>
            );
          }

          if (field.type === 'select') {
            return (
              <div key={field.name}>
                <label htmlFor={id} className="label mb-2 block">
                  {field.label}
                </label>
                <select
                  id={id}
                  value={(formData[field.name] as string) || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  required={field.required}
                  className={inputCls}
                >
                  <option value="">Select</option>
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
                <label htmlFor={id} className="label mb-2 block">
                  {field.label}
                </label>
                <textarea
                  id={id}
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
                <label htmlFor={id} className="label mb-2 block">
                  {field.label}
                </label>
                <input
                  id={id}
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
              <label htmlFor={id} className="label mb-2 block">
                {field.label}
              </label>
              <input
                id={id}
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

        {error && <p className="body-sm text-alert">{error.message}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving' : initialData ? 'Update' : 'Create'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Slab>
  );
}
