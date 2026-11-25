'use client';

import { useRef } from 'react';
import { normalizeUrl, validateField } from '@/lib/normalize';
import { COPY } from '@/edit/engine/copy';
import { blurField, leaveTray, setUi } from '@/edit/engine/ui-store';

/*
  The one link address input in the tray: a site_content button's link,
  an event's register link and a partner's site.

  An address the database would refuse is refused here instead, when the
  field is left: the draft goes back to the address it had on focus and
  the tray says why. A bare domain gets https:// in front, as everywhere
  else on the site. `format` is the column's CHECK: 'url' for site_content
  links (https://, http://, /, # and mailto:), 'https' for list columns
  (http:// or https:// only). Enter keeps the address and returns focus to
  the field the tray belongs to.
*/
export function LinkField({
  label,
  value,
  format,
  maxLength,
  placeholder,
  onSave,
}: {
  /** The input's accessible name. */
  label: string;
  value: string;
  format: 'url' | 'https';
  maxLength: number;
  placeholder?: string;
  /** Saves the draft value: trimmed while typing, normalised on blur. */
  onSave: (value: string) => void;
}) {
  const before = useRef('');
  return (
    <input
      aria-label={label}
      value={value}
      maxLength={maxLength}
      inputMode="url"
      spellCheck={false}
      placeholder={placeholder}
      onFocus={() => {
        before.current = value;
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        leaveTray();
      }}
      onBlur={(e) => {
        const v = normalizeUrl(e.target.value);
        if (validateField({ label, format }, v)) {
          onSave(before.current);
          setUi({
            flash: {
              tone: 'alert',
              label: COPY.linkRefusedLabel,
              text: format === 'https' ? COPY.linkRefusedHttps : COPY.linkRefused,
              announce: true,
            },
          });
        } else if (v !== e.target.value) {
          onSave(v);
        }
        blurField();
      }}
      onChange={(e) => onSave(e.target.value.trim())}
    />
  );
}
