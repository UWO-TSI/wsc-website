'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { FormField } from '../form-config';
import type { QueryError } from '@/types/database';
import { getPublicUrl } from '@/lib/supabase/storage';
import { normalizeFor, validateField } from '@/lib/normalize';
import { FIELD_ERROR_RING, FIELD_WELL } from '@/components/contact/field';
import Button from '@/components/ui/button';
import Slab from '@/components/ui/slab';
import CharCount from './char-count';

/*
  The admin form, built from Floor's Field: --page wells inside a --sunken
  slab, the label above, --alert ring plus written text on error.

  Intake rules, in the order an editor meets them:
  - A live counter on every field with a ceiling. It turns --warn at 80
    percent and --alert past the limit, and submit is refused past it. The
    database enforces the same number, so this is the friendly half.
  - Normalising on blur: one line, single spaces, a bare domain gets
    https://. The editor sees the cleaned value before saving, not after.
  - Errors appear once a field has been left or the form submitted, never
    on the first keystroke.
  - Empty optional fields are sent as NULL, numbers as integers, so an
    empty time or year never reaches a format CHECK as ''.
*/

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
  /** Logos are shown whole on the site, so their preview is not cropped. */
  imageFit?: 'cover' | 'contain';
}

function initialValue(field: FormField, initialData: Record<string, unknown> | null): string {
  const v = initialData?.[field.name];
  if (v === null || v === undefined) return field.defaultValue ?? '';
  /* A time stored before migration 9 that did not parse cannot be shown
     by a time input. Start it empty so the editor picks a real one. */
  if (field.type === 'time' && !/^\d{2}:\d{2}$/.test(String(v))) return '';
  return String(v);
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
  imageFit = 'cover',
}: AdminFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const data: Record<string, string> = {};
    for (const field of fields) {
      if (field.type === 'image') continue;
      data[field.name] = initialValue(field, initialData);
    }
    return data;
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fieldId = (name: string) => `${idPrefix}-${name}`;

  const errorFor = (field: FormField) => {
    if (field.type === 'image') return null;
    return validateField(
      {
        label: field.label,
        required: field.required,
        maxLength: field.maxLength,
        format: field.format,
        min: field.min,
        max: field.max,
      },
      values[field.name]
    );
  };

  const shownError = (field: FormField) =>
    touched[field.name] || submitted ? errorFor(field) : null;

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (field: FormField) => {
    setTouched((prev) => ({ ...prev, [field.name]: true }));
    if (field.type === 'text' || field.type === 'textarea') {
      setValues((prev) => ({ ...prev, [field.name]: normalizeFor(field.format, prev[field.name] ?? '') }));
    }
  };

  const processFile = (selected: File | null | undefined) => {
    if (!selected?.type.startsWith('image/')) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
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
    setSubmitted(true);
    if (fields.some((field) => errorFor(field))) return;

    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      if (field.type === 'image') continue;
      const raw = values[field.name] ?? '';
      if (field.type === 'number') {
        payload[field.name] = raw === '' ? null : Number(raw);
      } else if (field.type === 'select' || field.type === 'date') {
        payload[field.name] = raw || null;
      } else {
        payload[field.name] = normalizeFor(field.format, raw) || null;
      }
    }
    onSave(payload, file);
  };

  const currentImagePath =
    pathColumn && initialData ? (initialData[pathColumn] as string | null) : null;
  const currentImageUrl = currentImagePath && bucket ? getPublicUrl(bucket, currentImagePath) : null;
  const shownImage = preview ?? currentImageUrl;

  return (
    <Slab tone="sunken" as="div">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {fields.map((field) => {
          const id = fieldId(field.name);
          const err = shownError(field);
          const describedBy = [field.help ? `${id}-help` : null, err ? `${id}-error` : null]
            .filter(Boolean)
            .join(' ') || undefined;
          const common = {
            id,
            name: field.name,
            'aria-invalid': !!err,
            'aria-describedby': describedBy,
            style: err ? FIELD_ERROR_RING : undefined,
          };

          const label = (
            <label htmlFor={id} className="label mb-2 block">
              {field.label}
              {field.required && ' *'}
            </label>
          );

          const footer = (
            <>
              {(field.help || field.maxLength) && (
                <div className="mt-1.5 flex items-start justify-between gap-4">
                  {field.help ? (
                    <p id={`${id}-help`} className="meta text-ink-faint">
                      {field.help}
                    </p>
                  ) : (
                    <span />
                  )}
                  {field.maxLength && (
                    <CharCount length={(values[field.name] ?? '').length} max={field.maxLength} />
                  )}
                </div>
              )}
              {err && (
                <p id={`${id}-error`} className="body-sm text-alert mt-1.5">
                  {err}
                </p>
              )}
            </>
          );

          if (field.type === 'image') {
            return (
              <div key={field.name}>
                {label}
                <div
                  className={`rounded-sm p-4 cursor-pointer transition-colors duration-[var(--d-hover)] ease-enter ${
                    dragActive ? 'bg-accent-veil' : 'bg-page hover:bg-accent-veil'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById(id)?.click()}
                >
                  <input
                    id={id}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={(e) => processFile(e.target.files?.[0])}
                    className="hidden"
                  />
                  <div className="flex items-center gap-4">
                    {shownImage ? (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-raised">
                        <Image
                          src={shownImage}
                          alt=""
                          fill
                          sizes="64px"
                          unoptimized={!!preview}
                          className={imageFit === 'contain' ? 'object-contain' : 'object-cover'}
                        />
                      </div>
                    ) : null}
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="body-sm text-ink truncate">
                        {file ? file.name : shownImage ? 'Current image' : 'Drop an image or click to browse'}
                      </span>
                      <span className="meta text-ink-faint">JPEG, PNG, WebP or AVIF, up to 2 MB</span>
                    </div>
                    {file && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFile();
                        }}
                        className="label ml-auto text-ink-muted hover:text-accent-ink transition-colors duration-[var(--d-hover)] ease-enter cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                {footer}
              </div>
            );
          }

          if (field.type === 'select') {
            return (
              <div key={field.name}>
                {label}
                <select
                  {...common}
                  value={values[field.name] ?? ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  onBlur={() => handleBlur(field)}
                  className={FIELD_WELL}
                >
                  <option value="">Select</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {field.options?.length === 0 && (
                  <p className="body-sm text-warn mt-1.5">
                    No roles exist yet. Add one under the Roles tab first.
                  </p>
                )}
                {footer}
              </div>
            );
          }

          if (field.type === 'textarea') {
            return (
              <div key={field.name}>
                {label}
                <textarea
                  {...common}
                  value={values[field.name] ?? ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  onBlur={() => handleBlur(field)}
                  placeholder={field.placeholder}
                  rows={4}
                  className={`${FIELD_WELL} resize-y`}
                />
                {footer}
              </div>
            );
          }

          const inputType =
            field.type === 'date' || field.type === 'time' || field.type === 'number'
              ? field.type
              : 'text';

          return (
            <div key={field.name}>
              {label}
              <input
                {...common}
                type={inputType}
                inputMode={field.type === 'number' ? 'numeric' : undefined}
                min={field.min}
                max={field.max}
                step={field.type === 'number' ? 1 : undefined}
                value={values[field.name] ?? ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                onBlur={() => handleBlur(field)}
                placeholder={field.placeholder}
                className={`${FIELD_WELL} ${field.type === 'number' || field.type === 'time' ? 'max-w-48' : ''}`}
              />
              {footer}
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
