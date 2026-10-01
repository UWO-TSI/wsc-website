/**
 * Intake normalising and validation for every admin text field.
 *
 * Pure functions, no React, so the form, the site text editor and the
 * image uploader all apply the same rules. The database applies the same
 * normalising in a trigger (public.normalize_line) and the same ceilings
 * as CHECK constraints, so this is the friendly half of a rule that is
 * enforced either way.
 *
 * Deliberately NOT done: rewriting quotes or dashes, title-casing, or
 * spell-fixing. Those change what the club meant to say.
 */

/**
 * One line, single spaces, trimmed. Line breaks and control characters
 * become spaces: every value renders on one line or wraps naturally, and a
 * pasted newline would otherwise break a heading in an odd place.
 */
export function normalizeLine(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Schemes the site will put in an href. Mirrors the database CHECK. */
const URL_PATTERN = /^(https?:\/\/|\/|#|mailto:)/i;
const HTTP_PATTERN = /^https?:\/\//i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * A bare domain ("westernusc.store/...") gets https:// in front, which is
 * what an admin pasting from an address bar almost always means.
 */
export function normalizeUrl(value: string): string {
  const v = normalizeLine(value).replace(/\s/g, '');
  if (!v) return '';
  if (URL_PATTERN.test(v)) return v;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(v)) return `https://${v}`;
  return v;
}

export type FieldFormat = 'line' | 'url' | 'https' | 'email' | 'time';

export interface FieldRule {
  label: string;
  required?: boolean;
  maxLength?: number;
  format?: FieldFormat;
  min?: number;
  max?: number;
}

/** Normalise a value for its format, as the form does on blur. */
export function normalizeFor(format: FieldFormat | undefined, value: string): string {
  if (format === 'url' || format === 'https') return normalizeUrl(value);
  if (format === 'email') return normalizeLine(value).replace(/\s/g, '').toLowerCase();
  return normalizeLine(value);
}

/**
 * What is wrong with a value, in words that say how to fix it, or null.
 * Never "Invalid input".
 */
export function validateField(rule: FieldRule, raw: unknown): string | null {
  if (rule.min !== undefined || rule.max !== undefined) {
    if (raw === '' || raw === null || raw === undefined) {
      return rule.required ? `Choose a ${rule.label.toLowerCase()}.` : null;
    }
    const n = Number(raw);
    if (!Number.isInteger(n)) return `${rule.label} has to be a whole number.`;
    if (rule.min !== undefined && n < rule.min) return `${rule.label} is at least ${rule.min}.`;
    if (rule.max !== undefined && n > rule.max) return `${rule.label} is at most ${rule.max}.`;
    return null;
  }

  const value = normalizeFor(rule.format, String(raw ?? ''));

  if (!value) return rule.required ? `Add a ${rule.label.toLowerCase()}.` : null;

  if (rule.maxLength && value.length > rule.maxLength) {
    return `${value.length} of ${rule.maxLength} characters. Cut ${value.length - rule.maxLength}.`;
  }

  switch (rule.format) {
    case 'https':
      return HTTP_PATTERN.test(value) ? null : 'Use a full web address starting with https://';
    case 'url':
      return URL_PATTERN.test(value)
        ? null
        : 'Use a web address starting with https://, or a page path starting with /';
    case 'email':
      return EMAIL_PATTERN.test(value) ? null : 'That is not an email address. Check for the @.';
    case 'time':
      return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? null : 'Pick a time from the time picker.';
    default:
      return null;
  }
}
