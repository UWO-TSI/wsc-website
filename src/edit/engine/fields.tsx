'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import Button from '@/components/ui/button';
import Chip from '@/components/ui/chip';
import RevealImage from '@/components/ui/reveal-image';
import { useSiteContent } from '@/providers/site-content-provider';
import { SITE_CONTENT, type SiteContentKey } from '@/lib/site-content-defaults';
import { IMAGE_SLOTS, type ImageSlotKey } from '@/lib/image-slots';
import { LIMITS } from '@/lib/admin-config';
import type { EditableTextProps } from '@/edit/editable-text';
import type { EditableLinesProps } from '@/edit/editable-lines';
import type { EditableButtonProps } from '@/edit/editable-button';
import type { EditableImageProps } from '@/edit/editable-image';
import { COPY } from '@/edit/engine/copy';
import { setDraftPhoto, setDraftText } from '@/edit/engine/draft-store';
import {
  fieldHeight,
  onRemeasure,
  textWidth,
  wrapsOnPhones,
} from '@/edit/engine/measure';
import { blurField, edited, enterTray, focusField, setUi, type TrayContext } from '@/edit/engine/ui-store';

/*
  The edit branches of the four components in src/edit/. Same props as the
  view versions, so a page built against those needs no change.

  Every value is inside a Field: a shell filled with the text colour at 9
  percent (the skeleton's mix), --r-sm, 8px by 12px padding, visible at
  rest. The control inside inherits the element's font, case and colour,
  so the page reads as a form that is already filled in. Hover changes only
  the cursor. The focus ring is drawn on the shell.

  Each field is the size of the text it holds (its label while empty),
  capped at the column, and grows or shrinks as the editor types, so edit
  mode and Preview show the same box. Limits and labels come from each
  key's max_length, label and section in src/lib/site-content-defaults.ts,
  which the site_content seed is generated from, so the field and the
  database ceiling are one number.
*/

/** Room the inline label leaves for the button's padding and arrow. */
const BUTTON_CHROME = 96;
/** The inline label shell's inline padding, one side, from edit.css. */
const INBTN_X = 8;

const meta = (k: SiteContentKey) => SITE_CONTENT[k];

/** "About, body copy": the section plus the label, for screen readers. */
const fieldName = (section: string, label: string) => `${section}, ${label.toLowerCase()}`;

/** "Heading, line 1" names one line; the combined field is "Heading". */
const baseLabel = (label: string) => label.replace(/,\s*line \d+$/i, '');

const oneLine = (v: string) => v.replace(/\s*[\r\n]+\s*/g, ' ');

const refuseEnter = (e: KeyboardEvent) => {
  if (e.key === 'Enter') e.preventDefault();
};

/** Runs `measure` now, after fonts load, and on resize. */
function useMeasure(measure: () => void, deps: unknown[]) {
  const fn = useRef(measure);
  useLayoutEffect(() => {
    fn.current = measure;
  });
  useLayoutEffect(() => {
    fn.current();
    return onRemeasure(() => fn.current());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ── InlineText and InlineParagraph ── */

export function EditText({ k, as: Tag = 'span', className, id, size }: EditableTextProps) {
  const { text, published } = useSiteContent();
  const m = meta(k);
  const value = text(k);
  const pub = published.text(k);
  const fill = (size ?? (m.kind === 'longtext' ? 'fill' : 'fit')) === 'fill';
  const ref = useRef<HTMLTextAreaElement>(null);

  /* The width comes from the component's layout: a fill field takes the
     element's box (CSS), a fit field is as wide as its text and capped at
     that box by max-width. Only the height is measured, at the width the
     field was given. The fill is drawn outside the text (.ed-out), so the
     text sits where Preview puts it. */
  useMeasure(() => {
    const el = ref.current;
    if (!el) return;
    const s = value || m.label;
    /* min() with a percentage keeps a long value from widening the box
       around it: the field never asks for more than the space it has. */
    el.style.width = fill ? '' : `min(${textWidth(el, s) + 2}px, 100%)`;
    el.style.height = `${fieldHeight(el, s)}px`;
  }, [value, m.label, fill]);

  const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    edited();
    setDraftText(k, oneLine(e.target.value).slice(0, m.max), pub);
  };

  return (
    <Tag id={id} className={className}>
      <span className={`ed ed-out ${fill ? 'ed-fill' : 'ed-fit'}`} data-ed-field={k}>
        <textarea
          ref={ref}
          className="ed-in"
          rows={1}
          value={value}
          maxLength={m.max}
          placeholder={m.label}
          aria-label={fieldName(m.section, m.label)}
          onChange={onChange}
          onKeyDown={refuseEnter}
          onFocus={() => focusField({ type: 'text', key: k })}
          onBlur={blurField}
        />
      </span>
    </Tag>
  );
}

/* ── InlineHeading ── */

/** Lines as the textarea holds them: trailing empty lines dropped. */
const joinLines = (lines: string[]) => {
  const out = [...lines];
  while (out.length > 1 && !out[out.length - 1]) out.pop();
  return out.join('\n');
};

export function EditLines({ keys, as: Tag = 'h2', className, lineClassName, id }: EditableLinesProps) {
  const { text, published } = useSiteContent();
  const metas = keys.map(meta);
  const joined = joinLines(keys.map((k) => text(k)));
  const ref = useRef<HTMLTextAreaElement>(null);

  /* The textarea keeps its own text so an Enter at the end of line 1 holds
     an empty line 2 for the caret. It follows the draft when the draft
     changes from outside (Discard, Publish). */
  const [raw, setRaw] = useState(joined);
  const [seen, setSeen] = useState(joined);
  if (joined !== seen) {
    setSeen(joined);
    if (joinLines(raw.split('\n')) !== joined) setRaw(joined);
  }

  const lines = raw.split('\n');
  const label = baseLabel(metas[0].label);

  const report = () => {
    const el = ref.current;
    if (keys.length < 2 || !el) return focusField({ type: 'text', key: keys[0] });
    const tooWide = lines.some(
      (l) => l !== '' && (textWidth(el, l) > el.clientWidth || wrapsOnPhones(el, l))
    );
    focusField({ type: 'lines', keys, tooWide });
  };

  /* A heading field fills the box its component gives the title (the
     page head's title measure, a card's column), so headings are one size
     wherever the same component is used and a line wraps where it wraps
     in Preview. Only the height is measured, on every keystroke, so no
     text is ever hidden. */
  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = `${fieldHeight(el, el.value || label)}px`;
  };
  useMeasure(fit, [raw, label]);

  const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    const typed = el.value.split(/\r?\n/);
    /* A paste with more lines than keys folds the rest into the last line. */
    const parts =
      typed.length > keys.length
        ? [...typed.slice(0, keys.length - 1), typed.slice(keys.length - 1).join(' ')]
        : typed;
    const next = parts.map((l, i) => l.slice(0, metas[i].max));
    const value = next.join('\n');
    const caret = el.selectionStart;
    edited();
    setRaw(value);
    keys.forEach((k, i) => setDraftText(k, next[i] ?? '', published.text(k)));
    if (value !== el.value) requestAnimationFrame(() => el.setSelectionRange(caret, caret));
  };

  /* The tray follows each keystroke while the heading has focus. */
  useEffect(() => {
    if (ref.current && document.activeElement === ref.current) report();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && lines.length >= keys.length) e.preventDefault();
  };

  /* The lines are one field here, so the type role a page sets on each
     line span (the hero's name lines take .title-hero) goes on the field's
     element instead, or the lines would show in body type. `ln` is left
     off: it is the Line Mask, which is off in edit mode, and its clip
     would cut the focus ring. */
  const role = lineClassName?.split(/\s+/).filter((c) => c && c !== 'ln').join(' ');

  return (
    <Tag id={id} className={[className, role].filter(Boolean).join(' ') || undefined}>
      <span className="ed ed-out ed-fill" data-ed-field={keys.join(' ')}>
        <textarea
          ref={ref}
          className="ed-in ed-lines"
          rows={keys.length}
          value={raw}
          maxLength={metas.reduce((n, m) => n + m.max, 0) + keys.length - 1}
          placeholder={label}
          aria-label={fieldName(metas[0].section, label)}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={report}
          onBlur={blurField}
        />
      </span>
    </Tag>
  );
}

/* ── InlineLabel ── */

/*
  The button is drawn by the Button primitive, inert so it takes no focus
  and no click, with an empty spacer where its label goes. The field is
  placed over the spacer in the same grid cell, so it moves with the button
  and with nothing else. It copies the button's font and colour, and the
  spacer is as wide as the label, so the button is the size it is in
  Preview and follows the label as it is typed.

  A label-only button (no hrefKey: a row's own URL, a form submit) works
  the same way. The face takes no href or type, so it is an inert <button>
  that cannot submit, and the tray shows the label's count instead of a
  link address.

  With a hrefKey the pill itself is the keyboard route to the link address
  (.ed-btn-link): a transparent button after the label field in tab order,
  under the field on screen. Pressing it moves focus to the tray's link
  address, as a list row's Options does; Escape or Enter there returns to
  the label field.
*/
export function EditButton({ labelKey, hrefKey, variant, arrow, onAccent, className }: EditableButtonProps) {
  const { text, published } = useSiteContent();
  const m = meta(labelKey);
  const value = text(labelKey);
  const pub = published.text(labelKey);
  const face = useRef<HTMLSpanElement>(null);
  const spacer = useRef<HTMLSpanElement>(null);
  const shell = useRef<HTMLSpanElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const ctx: TrayContext = hrefKey ? { type: 'button', labelKey, hrefKey } : { type: 'text', key: labelKey };

  const measure = () => {
    const button = face.current?.firstElementChild as HTMLElement | null;
    const sp = spacer.current;
    const el = input.current;
    const sh = shell.current;
    if (!button || !sp || !el || !sh) return;
    const cs = getComputedStyle(button);
    el.style.font = cs.font;
    el.style.letterSpacing = cs.letterSpacing;
    el.style.color = cs.color;
    /* The cap is the width of the region the button is placed in. A button
       row is often a flex item sized to its content, which would make the
       cap depend on the label it limits, so the row itself is not used. */
    const region = face.current!.closest<HTMLElement>('li, section, nav, footer, form');
    const regionWidth = region
      ? region.clientWidth - parseFloat(getComputedStyle(region).paddingLeft) - parseFloat(getComputedStyle(region).paddingRight)
      : document.documentElement.clientWidth;
    const cap = Math.max(40, regionWidth - BUTTON_CHROME);
    const shown = value || m.label;
    const width = Math.min(textWidth(el, shown) + 2, cap);
    sp.style.width = `${width}px`;
    el.style.width = `${width}px`;
    el.style.height = `${fieldHeight(el, shown)}px`;
    sh.style.marginLeft = `${sp.offsetLeft - INBTN_X}px`;
  };
  useMeasure(measure, [value, m.label, variant, arrow, onAccent]);

  return (
    <span className={`ed-btn ${className ?? ''}`.trim()}>
      <span className="ed-btn-face" ref={face} inert>
        <Button variant={variant} arrow={arrow} onAccent={onAccent}>
          <span ref={spacer} className="ed-btn-spacer" />
        </Button>
      </span>
      <span ref={shell} className="ed ed-inbtn" data-ed-field={labelKey}>
        <textarea
          ref={input}
          className="ed-in"
          rows={1}
          wrap="off"
          value={value}
          maxLength={m.max}
          placeholder={m.label}
          aria-label={fieldName(m.section, m.label)}
          onChange={(e) => {
            edited();
            setDraftText(labelKey, oneLine(e.target.value).slice(0, m.max), pub);
          }}
          onKeyDown={refuseEnter}
          onFocus={() => focusField(ctx)}
          onBlur={blurField}
        />
      </span>
      {hrefKey && (
        <button
          type="button"
          className="ed-btn-link"
          aria-label={COPY.linkAddress(fieldName(m.section, m.label))}
          onFocus={() => focusField(ctx)}
          onBlur={blurField}
          onClick={() => input.current && enterTray(ctx, input.current)}
        />
      )}
    </span>
  );
}

/* ── PhotoSlot ── */

function readWidth(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img.naturalWidth);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('unreadable'));
    };
    img.src = url;
  });
}

/**
 * Today's uploader rules: type and size first, then resolution. Below the
 * slot's minWidth the photo is accepted with a warning; below half of it
 * the photo is refused.
 */
export async function choosePhoto(slot: ImageSlotKey, file: File) {
  const def = IMAGE_SLOTS[slot];
  const label = COPY.photoHead(def.section, def.label);
  const fail = (text: string) => setUi({ flash: { tone: 'alert', label, text, announce: true } });

  if (!LIMITS.ALLOWED_IMAGE_TYPES.includes(file.type)) return fail(COPY.photoType);
  if (file.size > LIMITS.MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return fail(COPY.photoSize(file.size / 1024 / 1024, LIMITS.MAX_IMAGE_SIZE_MB));
  }
  let width: number;
  try {
    width = await readWidth(file);
  } catch {
    return fail(COPY.photoUnreadable);
  }
  if (width < def.minWidth / 2) return fail(COPY.photoRefused(width, def.minWidth));

  setDraftPhoto(slot, file, width);
  setUi({
    flash:
      width < def.minWidth
        ? { tone: 'warn', label, text: COPY.photoTooSmall(width, def.minWidth) }
        : null,
  });
}

export function EditImage({ slot, className, ...rest }: EditableImageProps) {
  const { image } = useSiteContent();
  const shown = image(slot);
  const def = IMAGE_SLOTS[slot];
  const picker = useRef<HTMLInputElement>(null);
  const action = shown.src ? COPY.replacePhoto : COPY.addPhoto;

  return (
    <span className={`ed-photo ${className ?? ''}`.trim()} data-ed-field={slot}>
      <RevealImage {...shown} {...rest} />
      <button
        type="button"
        className="ed-photo-btn"
        aria-label={`${action}, ${fieldName(def.section, def.label)}`}
        onClick={() => picker.current?.click()}
        onFocus={() => focusField({ type: 'photo', slot })}
        onBlur={blurField}
      >
        <Chip className="ed-photo-chip">{action}</Chip>
      </button>
      <input
        ref={picker}
        type="file"
        hidden
        accept={LIMITS.ALLOWED_IMAGE_TYPES.join(',')}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) choosePhoto(slot, file);
        }}
      />
    </span>
  );
}
