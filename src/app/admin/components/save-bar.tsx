'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/button';

/*
  The head of every editor: its title, a status line, and the one Save that
  commits everything pending in that editor.

  Save has four states and the button alone carries them:
  - nothing pending: "Save changes", disabled (Button's sunken disabled tone)
  - edits pending:   "Save all changes", primary, with Discard beside it
  - writing:         "Saving"
  - just written:    "Saved" for SAVED_MS, then back to the disabled rest
  The list underneath is not reloaded or replaced; rows update in place.

  design-system/floor.html, Editor section.
*/

const SAVED_MS = 2000;

interface SaveBarProps {
  title: string;
  /** Shown under the title when nothing is pending. */
  hint: React.ReactNode;
  /** Number of pending edits. Zero disables Save. */
  pending: number;
  saving: boolean;
  /** Bumped by the editor after each successful save; drives "Saved". */
  savedAt: number | null;
  onSave: () => void;
  onDiscard: () => void;
  /** Extra controls, such as "Add executive", placed before Save. */
  children?: React.ReactNode;
}

export default function SaveBar({
  title,
  hint,
  pending,
  saving,
  savedAt,
  onSave,
  onDiscard,
  children,
}: SaveBarProps) {
  /* The save whose flash has run out. Each new savedAt shows "Saved" until
     its own timer marks it expired; an edit cuts it short. */
  const [expired, setExpired] = useState<number | null>(null);

  useEffect(() => {
    if (!savedAt) return;
    const t = setTimeout(() => setExpired(savedAt), SAVED_MS);
    return () => clearTimeout(t);
  }, [savedAt]);

  const saved = !!savedAt && savedAt !== expired && pending === 0 && !saving;
  const label = saving ? 'Saving' : saved ? 'Saved' : pending > 0 ? 'Save all changes' : 'Save changes';

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="title-sm text-ink">{title}</h2>
        <p className="meta text-ink-faint mt-1">
          {pending > 0 ? `${pending} unsaved change${pending === 1 ? '' : 's'}` : hint}
        </p>
      </div>
      <div className="flex gap-3 flex-wrap">
        {children}
        {pending > 0 && (
          <Button variant="secondary" onClick={onDiscard} disabled={saving}>
            Discard
          </Button>
        )}
        <Button onClick={onSave} disabled={saving || pending === 0}>
          <span aria-live="polite">{label}</span>
        </Button>
      </div>
    </div>
  );
}
