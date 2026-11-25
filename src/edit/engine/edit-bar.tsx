'use client';

import { useEffect, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import Button from '@/components/ui/button';
import { useSiteContent } from '@/providers/site-content-provider';
import { SITE_CONTENT, type SiteContentKey } from '@/lib/site-content-defaults';
import { IMAGE_SLOTS, type ImageSlotKey } from '@/lib/image-slots';
import { setEditPreview, useEditSnapshot } from '@/edit/edit-mode';
import { COPY } from '@/edit/engine/copy';
import {
  changeCount,
  discardAll,
  setDraftText,
  useDraftVersion,
} from '@/edit/engine/draft-store';
import { missingName, publishDraft, type Publisher } from '@/edit/engine/publish';
import { rowTrayView } from '@/edit/engine/list-parts';
import {
  enteredTray,
  getUi,
  leaveTray,
  setUi,
  trayControls,
  useUi,
  type Tone,
  type TrayContext,
} from '@/edit/engine/ui-store';
import { holdIosFocusZoom } from '@/edit/engine/ios-zoom';
import { LinkField } from '@/edit/engine/link-field';
import { signOutAndReload } from '@/edit/sign-out';

/*
  The edit bar: change count, Edit and Preview, Discard, Publish, the tray
  between them, and Settings and Sign out (under the count on phones,
  under Edit and Preview from 900px).

  The bar has one fixed size at each width. The tray is the only region
  whose content changes, and it never grows: it holds whatever has focus
  (the field's name and count, a link address, a photo's minimum width),
  confirmations, and results. There are no dialogs.

  The tray is not a live region, because it changes on every focus move.
  Errors and publish results are read out by the two hidden regions below
  it, and nothing else is.
*/

const PUBLISHED_FOR_MS = 2000;

const meta = (k: string) => SITE_CONTENT[k as SiteContentKey];
const baseLabel = (label: string) => label.replace(/,\s*line \d+$/i, '');

/*
  The tray is a grid of three areas: the label, the body (a line of copy,
  a count, a link address) and the actions (tray buttons). On phones the
  actions sit at the end of the label row, so the body keeps its full
  width for up to three lines; from 900px they sit at the end of the body
  row. The tray keeps one height across every state at each width.
*/
interface TrayView {
  label: string;
  tone?: Tone;
  body: ReactNode;
  actions?: ReactNode;
}

/* A button's label count and its link address (link-field.tsx refuses an
   address the database would refuse). */
function LinkAddress({ labelKey, hrefKey }: { labelKey: string; hrefKey: string }) {
  const { text, published } = useSiteContent();
  const label = meta(labelKey);
  const href = meta(hrefKey);
  return (
    <>
      <span className="meta ed-flex-none">
        {COPY.labelCount(text(labelKey as SiteContentKey).length, label.max)}
      </span>
      <LinkField
        label={COPY.linkAddress(`${label.section}, ${label.label.toLowerCase()}`)}
        value={text(hrefKey as SiteContentKey)}
        format="url"
        maxLength={href.max}
        onSave={(v) => setDraftText(hrefKey, v, published.text(hrefKey as SiteContentKey))}
      />
    </>
  );
}

/*
  Keys inside the tray. Escape returns focus to the field or row control
  the tray belongs to. After a row's Options moved focus here, Tab past the
  last control or Shift+Tab before the first goes back to that control
  too, so the tray sits in the tab order right after it.
*/
function trayKeys(e: KeyboardEvent<HTMLDivElement>) {
  if (e.key === 'Escape') {
    if (leaveTray()) e.preventDefault();
    return;
  }
  if (e.key !== 'Tab' || !enteredTray()) return;
  const controls = trayControls();
  const edge = e.shiftKey ? controls[0] : controls[controls.length - 1];
  if (document.activeElement === edge && leaveTray()) e.preventDefault();
}

function focusView(ctx: TrayContext, text: (k: SiteContentKey) => string): TrayView {
  if (ctx.type === 'text') {
    const m = meta(ctx.key);
    return {
      label: COPY.fieldHead(m.section, m.label),
      body: COPY.fieldCount(text(ctx.key as SiteContentKey).length, m.max),
    };
  }
  if (ctx.type === 'lines') {
    const m = meta(ctx.keys[0]);
    const label = COPY.fieldHead(m.section, baseLabel(m.label));
    if (ctx.tooWide) return { label, tone: 'warn', body: COPY.lineTooWide };
    const counts = COPY.headingCount(
      ctx.keys.map((k) => ({ n: text(k as SiteContentKey).length, max: meta(k).max }))
    );
    return { label, body: `${counts} ${ctx.keys.length === 2 ? COPY.headingHint : COPY.headingHintMany}` };
  }
  if (ctx.type === 'button') {
    const m = meta(ctx.labelKey);
    return {
      label: COPY.fieldHead(m.section, m.label),
      body: <LinkAddress labelKey={ctx.labelKey} hrefKey={ctx.hrefKey} />,
    };
  }
  /* A list row: its name, a hint or its link, and Remove (list-parts.tsx). */
  if (ctx.type === 'row') {
    return rowTrayView(ctx.table, ctx.id, ctx.field) ?? { label: COPY.firstLabel, body: COPY.first };
  }
  if (ctx.type === 'area') return { label: COPY.newArea, body: COPY.newAreaHint };
  const def = IMAGE_SLOTS[ctx.slot as ImageSlotKey];
  return { label: COPY.photoHead(def.section, def.label), body: COPY.photoHint(def.minWidth) };
}

export default function EditBar({ publisher }: { publisher: Publisher }) {
  useDraftVersion();
  const ui = useUi();
  const { status } = useEditSnapshot();
  const { text, published } = useSiteContent();
  const bar = useRef<HTMLDivElement>(null);
  const n = changeCount();
  const preview = status === 'preview';
  const busy = ui.phase !== 'idle';

  useEffect(() => holdIosFocusZoom(), []);

  /* Pages get bottom padding equal to the bar, so the footer stays
     reachable above it. */
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      document.documentElement.style.setProperty('--ed-bar-h', `${el.offsetHeight}px`)
    );
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--ed-bar-h');
    };
  }, []);

  const publish = async () => {
    const missing = missingName();
    if (missing) {
      document
        .querySelector<HTMLElement>(
          `[data-ed-field="${missing.table}.${missing.id}.${missing.field}"] :is(input, textarea)`
        )
        ?.focus();
      const copy = COPY.list[missing.table];
      setUi({
        flash: { tone: 'alert', label: COPY.blockedLabel, text: missing.added ? copy.missing : copy.cleared, announce: true },
      });
      return;
    }
    setUi({ phase: 'publishing', confirmDiscard: false, flash: null });
    const r = await publishDraft(publisher, (slot) => published.image(slot as ImageSlotKey).alt);
    if (r.expired) {
      setUi({
        phase: 'idle',
        expired: true,
        flash: { tone: 'alert', label: COPY.expiredLabel, text: COPY.expired, announce: true },
      });
    } else if (r.failed) {
      setUi({
        phase: 'idle',
        flash: { tone: 'alert', label: COPY.failedLabel, text: COPY.partlyFailed(r.failed), announce: true },
      });
    } else {
      const body = r.gone ? COPY.publishedGone(r.gone) : COPY.publishedBody;
      setUi({
        phase: 'published',
        flash: { tone: r.gone ? 'warn' : 'ok', label: COPY.publishedLabel, text: body, announce: true },
      });
      setTimeout(() => getUi().phase === 'published' && setUi({ phase: 'idle' }), PUBLISHED_FOR_MS);
    }
  };

  const discard = async () => {
    setUi({ confirmDiscard: false, flash: null, focus: null });
    await discardAll();
  };

  /* A refused link address keeps its message while the editor is back on
     that button or row, so the address can be fixed in place, and the
     tray's other controls (a row's Remove) stay where they are. */
  const linkRefused =
    ui.flash?.label === COPY.linkRefusedLabel && (ui.focus?.type === 'button' || ui.focus?.type === 'row');

  /* What the tray shows, most urgent first. */
  let view: TrayView;
  if (ui.confirmDiscard) {
    view = {
      label: COPY.discard,
      body: COPY.confirmDiscard(n),
      actions: (
        <>
          <Button variant="secondary" className="ed-small" onClick={() => setUi({ confirmDiscard: false })}>
            {COPY.keepEditing}
          </Button>
          <Button className="ed-small" onClick={discard}>
            {COPY.discardN(n)}
          </Button>
        </>
      ),
    };
  } else if (ui.flash && !linkRefused) {
    view = ui.flash.text === COPY.expired ? expiredView() : { ...ui.flash, body: ui.flash.text };
  } else if (ui.focus && !preview) {
    view = focusView(ui.focus, text);
    if (linkRefused) {
      const head = ui.focus.type === 'row' ? COPY.linkRefusedHeadHttps : COPY.linkRefusedHead;
      view = { ...view, label: head, tone: 'alert' };
    }
  } else if (ui.expired) {
    view = expiredView();
  } else if (!ui.online) {
    view = { label: COPY.offlineLabel, tone: 'warn', body: COPY.offline };
  } else if (preview) {
    view = { label: COPY.previewing, body: COPY.previewIdle };
  } else {
    view = { label: COPY.firstLabel, body: COPY.first };
  }

  const publishLabel =
    ui.phase === 'publishing' ? COPY.publishing : ui.phase === 'published' ? COPY.published : COPY.publish(n);
  const announced = ui.flash?.announce ? ui.flash : null;

  return (
    <div ref={bar} className="ed-bar" role="region" aria-label={COPY.firstLabel}>
      <div className="ed-status">
        <span className="label">{preview ? COPY.previewing : COPY.editing}</span>
        <span className="meta">{n ? COPY.pendingShort(n) : COPY.noChanges}</span>
      </div>

      <div className="ed-acct" role="group" aria-label={COPY.accountGroup}>
        <Button variant="tertiary" className="ed-link" href="/admin/settings">
          {COPY.settings}
        </Button>
        <Button variant="tertiary" className="ed-link" disabled={ui.phase === 'publishing'} onClick={() => signOutAndReload()}>
          {COPY.signOut}
        </Button>
      </div>

      <div className="ed-seg" role="group" aria-label={COPY.modeGroup}>
        <button type="button" aria-pressed={!preview} onClick={() => setEditPreview(false)}>
          {COPY.edit}
        </button>
        <button type="button" aria-pressed={preview} onClick={() => setEditPreview(true)}>
          {COPY.previewing}
        </button>
      </div>

      <div className="ed-tray" data-ed-tray="" onKeyDown={trayKeys}>
        <span className="label ed-tray-label">{view.label}</span>
        <div className={`ed-tray-body${view.tone ? ` ed-t-${view.tone}` : ''}`}>
          {typeof view.body === 'string' ? <span className="ed-grow">{view.body}</span> : view.body}
        </div>
        {view.actions && <div className="ed-tray-actions">{view.actions}</div>}
      </div>

      <div className="ed-discard">
        <Button
          variant="secondary"
          disabled={!n || busy}
          onClick={() => setUi({ confirmDiscard: true, flash: null })}
        >
          {COPY.discard}
        </Button>
      </div>
      <div className="ed-publish">
        <Button disabled={!n || busy || !ui.online || ui.expired} onClick={publish}>
          {publishLabel}
        </Button>
      </div>

      <p className="sr-only" role="status">
        {announced && announced.tone !== 'alert' ? announced.text : ''}
      </p>
      <p className="sr-only" role="alert">
        {announced && announced.tone === 'alert' ? announced.text : ''}
      </p>
    </div>
  );
}

function expiredView(): TrayView {
  return {
    label: COPY.expiredLabel,
    tone: 'alert',
    body: COPY.expired,
    actions: (
      <Button variant="secondary" className="ed-small" href="/admin">
        {COPY.signIn}
      </Button>
    ),
  };
}
