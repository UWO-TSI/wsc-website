'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/button';

/*
  Unsaved changes, for the whole content manager.

  Every editor batches its edits and saves them with one button, so leaving
  an editor with edits pending would lose them silently. Each editor reports
  whether it has pending edits through useUnsavedChanges(dirty), and anything
  that would unmount or reset an editor (a sidebar tab, a page tab inside an
  editor, Back to site, Sign out) runs through confirmLeave.

  Leaving is never refused. With nothing pending the action runs at once;
  with edits pending the editor is asked once, and "Discard and leave" runs
  the action, which drops the edits by unmounting or resetting the editor.

  Closing or reloading the browser tab cannot show this dialog, so the
  browser's own beforeunload prompt covers that case.
*/

interface UnsavedChangesValue {
  /** Run `action` now, or after the editor agrees to discard pending edits. */
  confirmLeave: (action: () => void) => void;
  setDirty: (id: string, dirty: boolean) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesValue | null>(null);

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  /* Keyed by editor, so one editor going clean does not clear another. */
  const dirtyRef = useRef(new Set<string>());
  const [pending, setPending] = useState<(() => void) | null>(null);

  const setDirty = useCallback((id: string, dirty: boolean) => {
    if (dirty) dirtyRef.current.add(id);
    else dirtyRef.current.delete(id);
  }, []);

  const confirmLeave = useCallback((action: () => void) => {
    if (dirtyRef.current.size === 0) action();
    /* Wrapped, because a bare function passed to a state setter is called
       as an updater rather than stored. */
    else setPending(() => action);
  }, []);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current.size === 0) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPending(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending]);

  const leave = () => {
    const action = pending;
    dirtyRef.current.clear();
    setPending(null);
    action?.();
  };

  return (
    <UnsavedChangesContext.Provider value={{ confirmLeave, setDirty }}>
      {children}

      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.6)] p-4"
          onClick={() => setPending(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="unsaved-title"
            aria-describedby="unsaved-body"
            className="bg-raised shadow-3 rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="unsaved-title" className="label text-accent-ink mb-4">
              Unsaved changes
            </h3>
            <p id="unsaved-body" className="body text-ink mb-6">
              You have changes that are not saved yet. Leaving now discards them.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Button onClick={() => setPending(null)}>Stay</Button>
              <Button variant="secondary" onClick={leave}>
                Discard and leave
              </Button>
            </div>
          </div>
        </div>
      )}
    </UnsavedChangesContext.Provider>
  );
}

/**
 * Registers an editor's pending edits with the dashboard and returns
 * confirmLeave, for page tabs inside the editor.
 */
export function useUnsavedChanges(id: string, dirty: boolean) {
  const ctx = useContext(UnsavedChangesContext);
  if (!ctx) throw new Error('useUnsavedChanges needs an UnsavedChangesProvider');
  const { setDirty, confirmLeave } = ctx;

  useEffect(() => {
    setDirty(id, dirty);
  }, [id, dirty, setDirty]);

  /* An editor that unmounts has nothing left to lose. */
  useEffect(() => () => setDirty(id, false), [id, setDirty]);

  return confirmLeave;
}

/** confirmLeave alone, for the dashboard's own navigation. */
export function useConfirmLeave() {
  const ctx = useContext(UnsavedChangesContext);
  if (!ctx) throw new Error('useConfirmLeave needs an UnsavedChangesProvider');
  return ctx.confirmLeave;
}
