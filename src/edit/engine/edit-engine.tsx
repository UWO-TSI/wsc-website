'use client';

import { useEffect, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { supabase } from '@/lib/supabase/client';
import { setEditSnapshot, type EditEngineApi } from '@/edit/edit-mode';
import type { ListDraftApi, ListEngineApi, ListTable } from '@/edit/list-draft';
import { COPY, draftDay } from '@/edit/engine/copy';
import {
  changeCount,
  lastChangeAt,
  listApi,
  loadDrafts,
  overlayImage,
  overlayRows,
  overlayText,
  unloadDrafts,
} from '@/edit/engine/draft-store';
import { EditButton, EditImage, EditLines, EditText } from '@/edit/engine/fields';
import EditBar from '@/edit/engine/edit-bar';
import { LIST_EDITORS } from '@/edit/engine/list-editors';
import { supabasePublisher, type Publisher } from '@/edit/engine/publish';
import { resetUi, setUi } from '@/edit/engine/ui-store';
import '@/edit/engine/edit.css';

/*
  The edit engine. Loaded only by EditGate, through a dynamic import, after
  is_admin() passes at aal2, so none of this
  is in a visitor's bundle. Mounting it turns the page into edit mode;
  unmounting it returns the page to the visitor version. Drafts stay in
  IndexedDB either way.
*/

/* Preview keeps the section nearest the top of the screen at the same
   height: measure it, switch in one synchronous commit (fields re-measure
   in their layout effects), measure again, and scroll by the difference. */
function preview(on: boolean) {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('main section'));
  const anchor = sections.find((s) => s.getBoundingClientRect().bottom > 0);
  const before = anchor?.getBoundingClientRect().top ?? 0;
  flushSync(() => {
    setUi({ focus: null, confirmDiscard: false });
    setEditSnapshot({ status: on ? 'preview' : 'editing' });
  });
  if (!anchor) return;
  const shift = anchor.getBoundingClientRect().top - before;
  if (shift) window.scrollTo({ top: window.scrollY + shift, behavior: 'instant' });
}

const lists = new Map<ListTable, ListDraftApi>();

const API: ListEngineApi = {
  text: overlayText,
  image: overlayImage,
  rows: overlayRows,
  list: (table) => {
    if (!lists.has(table)) lists.set(table, listApi(table));
    return lists.get(table)!;
  },
  preview,
  components: { Text: EditText, Lines: EditLines, Button: EditButton, Image: EditImage } as EditEngineApi['components'],
  /* The list editors, reached through ListEditBranch in src/edit/list-draft.ts. */
  listEditors: LIST_EDITORS as ListEngineApi['listEditors'],
};

export interface EditEngineProps {
  userId: string;
  /** A stand-in for tests, so nothing writes to a database. */
  publisher?: Publisher;
}

export default function EditEngine({ userId, publisher = supabasePublisher }: EditEngineProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    resetUi();
    setUi({ online: navigator.onLine });

    loadDrafts(userId).then(() => {
      if (!live) return;
      const n = changeCount();
      const at = lastChangeAt();
      if (n && at) {
        setUi({ flash: { tone: 'info', label: COPY.firstLabel, text: COPY.draftFromEarlier(n, draftDay(at)) } });
      }
      setEditSnapshot({ status: 'editing', engine: API });
      document.documentElement.classList.add('ed-on');
      setReady(true);
    });

    const online = () => setUi({ online: true });
    const offline = () => setUi({ online: false });
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);

    /* Signed out elsewhere, or the refresh token failed: keep the draft and
       say so. Signing in again in another tab clears it. */
    const { data: auth } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setUi({ expired: true });
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        publisher.session().then((s) => setUi({ expired: s === 'expired' }));
      }
    });

    return () => {
      live = false;
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      auth.subscription.unsubscribe();
      document.documentElement.classList.remove('ed-on');
      setEditSnapshot({ status: 'off', engine: null });
      unloadDrafts();
      lists.clear();
    };
  }, [userId, publisher]);

  if (!ready) return null;
  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      {createPortal(<EditBar publisher={publisher} />, document.body)}
    </>
  );
}
