'use client';

import type { ChangeEvent, FocusEvent, ReactNode } from 'react';

/*
  Field. The component a borderless system has to get right.

  Each field is a --page well at --r-sm inside the --sunken form slab it
  lives in, one tone step away from its container in both themes. No stroke.
  Label sits above in .label, value in .body.

  A light fill on white cannot reach 3:1, and no borderless light theme can,
  so identification is carried by the persistent visible label rather than a
  placeholder. That is why this component always renders one, with a stable
  id and a <label for> pointing at it.

  State is --focus at focus (the global focus-visible ring) and --alert plus
  written text at error. Colour never carries the meaning alone. The caller
  decides when `error` is set, which is what keeps errors off the first
  keystroke: pass it only once the field has been touched or the form has
  been submitted.

  design-system/components.md → Field.
*/

interface FieldBaseProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** Rendered between the well and the error text, e.g. a character count. */
  trailing?: ReactNode;
}

interface InputFieldProps extends FieldBaseProps {
  as?: 'input';
  type?: 'text' | 'email';
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: FocusEvent<HTMLInputElement>) => void;
}

interface TextareaFieldProps extends FieldBaseProps {
  as: 'textarea';
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur: (e: FocusEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  maxLength?: number;
}

interface SelectFieldProps extends FieldBaseProps {
  as: 'select';
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}

type FieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps;

/* Exported so the admin form builds its wells from the same class rather
   than a copy of it. */
export const FIELD_WELL =
  'w-full rounded-sm bg-page px-[15px] py-[13px] font-text text-[length:var(--t-body)] text-ink outline-none transition-shadow duration-[var(--d-hover)] ease-enter disabled:cursor-not-allowed disabled:opacity-50';

export const FIELD_ERROR_RING = { boxShadow: '0 0 0 2px var(--alert)' };

export default function Field(props: FieldProps) {
  const { label, name, error, required, disabled, trailing } = props;
  const id = `contact-${name}`;
  const errorId = `${id}-error`;
  const errorRing = error ? FIELD_ERROR_RING : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="label">
        {label}
        {required && ' *'}
      </label>

      {props.as === 'textarea' && (
        <textarea
          id={id}
          name={name}
          value={props.value}
          onChange={props.onChange}
          onBlur={props.onBlur}
          rows={props.rows ?? 5}
          maxLength={props.maxLength}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`${FIELD_WELL} resize-y`}
          style={errorRing}
        />
      )}

      {props.as === 'select' && (
        <div className="relative">
          <select
            id={id}
            name={name}
            value={props.value}
            onChange={props.onChange}
            disabled={disabled}
            className={`${FIELD_WELL} appearance-none pr-10`}
            style={errorRing}
          >
            {props.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}

      {(!props.as || props.as === 'input') && (
        <input
          id={id}
          name={name}
          type={props.type ?? 'text'}
          value={props.value}
          onChange={props.onChange}
          onBlur={props.onBlur}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={FIELD_WELL}
          style={errorRing}
        />
      )}

      {trailing}

      {error && (
        <p id={errorId} className="body-sm text-alert">
          {error}
        </p>
      )}
    </div>
  );
}
