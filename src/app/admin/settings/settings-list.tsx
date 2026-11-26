'use client';

import type { ReactNode } from 'react';
import Button from '@/components/ui/button';
import { FIELD_ERROR_RING, FIELD_WELL } from '@/components/contact/field';
import { SETTINGS_COPY as C } from './copy';

/*
  The Settings page's lists: the editor list rows from Floor card 15, as
  docs/redesign/reference.html draws them under "Settings page, as it will
  look". A --raised list holds --sunken rows at --r-md; each row is the
  thing's name, one line about it, and its actions. No borders, no
  dialogs: a confirmation or a form replaces the row's own content.

  design-system/components.md, Edit mode, Settings page.
*/

/** The tray's small button size (7px by 14px, meta type), so row actions fit
    one line. A form row's own Save or Invite keeps the full size, which
    matches the height of the field beside it. */
export const SMALL = '!px-[14px] !py-[7px] !text-[length:var(--t-meta)]';

export function SettingsSection({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-col gap-1 px-1">
        <h2 id={id} className="title-sm text-ink">
          {title}
        </h2>
        <p className="body-sm text-ink-muted measure">{note}</p>
      </div>
      <ul className="m-0 flex list-none flex-col gap-2 rounded-lg bg-raised p-3">{children}</ul>
    </section>
  );
}

/**
 * One row. Under 640px the name and its line stack in the first column and
 * the actions take the second; from 640px the three sit side by side.
 */
export function SettingsRow({
  name,
  detail,
  actions,
  message,
}: {
  name: ReactNode;
  detail?: ReactNode;
  actions?: ReactNode;
  /** A line under the row: the result or the error of its last action. */
  message?: ReactNode;
}) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-md bg-sunken px-3 py-[10px] sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
      <span className="body-sm min-w-0 text-ink [overflow-wrap:anywhere]">{name}</span>
      {actions && (
        <span className="col-start-2 row-span-2 row-start-1 flex flex-wrap justify-end gap-2 sm:col-start-3 sm:row-span-1">
          {actions}
        </span>
      )}
      <span className="meta min-w-0 [overflow-wrap:anywhere] sm:col-start-2 sm:row-start-1">{detail}</span>
      {message && <span className="col-span-full">{message}</span>}
    </li>
  );
}

/** A row whose content is a form: a confirmation, a rename, an invite. */
export function SettingsFormRow({
  onSubmit,
  children,
  message,
}: {
  onSubmit: () => void;
  children: ReactNode;
  message?: ReactNode;
}) {
  return (
    <li className="rounded-md bg-sunken px-3 py-[10px]">
      <form
        noValidate
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {children}
        {message}
      </form>
    </li>
  );
}

/* The grid for RowFields side by side: one column on a phone, three label,
   input and error rows shared by every field from 640 up. The row gap
   matches RowField's own gap-2. */
export const ALIGNED_FIELDS =
  'grid grid-cols-1 gap-3 sm:grid-cols-3 sm:grid-rows-[auto_auto_auto] sm:gap-y-2';

export function RowField({
  id,
  label,
  value,
  onChange,
  error,
  type = 'text',
  maxLength,
  autoFocus,
  aligned = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  type?: 'text' | 'email';
  maxLength?: number;
  autoFocus?: boolean;
  /**
   * From 640 up, take the label, input and error rows from the parent grid
   * (ALIGNED_FIELDS), so a label that wraps to two lines moves every input
   * in the row down with it instead of only its own.
   */
  aligned?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col gap-2${
        aligned ? ' sm:row-span-3 sm:grid sm:grid-rows-subgrid' : ''
      }`}
    >
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        maxLength={maxLength}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        inputMode={type === 'email' ? 'email' : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={FIELD_WELL}
        style={error ? FIELD_ERROR_RING : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="body-sm text-alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** The result or error of the last action, read out once. */
export function RowMessage({ tone, children }: { tone: 'ok' | 'alert' | 'muted'; children: ReactNode }) {
  const color = tone === 'ok' ? 'text-ok' : tone === 'alert' ? 'text-alert' : 'text-ink-muted';
  return (
    <p role={tone === 'alert' ? 'alert' : 'status'} className={`body-sm ${color}`}>
      {children}
    </p>
  );
}

export function SaveCancel({
  busy,
  saveLabel,
  busyLabel,
  onCancel,
}: {
  busy: boolean;
  saveLabel: string;
  busyLabel: string;
  onCancel?: () => void;
}) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <Button type="submit" disabled={busy}>
        {busy ? busyLabel : saveLabel}
      </Button>
      {onCancel && (
        <Button variant="tertiary" onClick={onCancel} disabled={busy}>
          {C.cancel}
        </Button>
      )}
    </span>
  );
}
