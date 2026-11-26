'use client';

import { useSiteContent } from '@/providers/site-content-provider';
import { EditBranch, useEditBranch } from '@/edit/edit-mode';
import type { SiteContentKey } from '@/lib/site-content-defaults';
import type { TextTag } from '@/edit/editable-text';

/*
  A heading whose lines are separate site_content keys.

  View mode and Preview: one line span per non-empty key, with the inner <i>
  that Line Mask Reveal animates. Empty lines are skipped. While editing,
  the engine's InlineHeading renders instead: the lines are one field,
  Enter starts the next line, and each line saves to its own key.
*/

export interface EditableLinesProps {
  keys: SiteContentKey[];
  as?: TextTag;
  className?: string;
  /** Class on each line span. Line Mask Reveal needs `ln`. */
  lineClassName?: string;
  id?: string;
}

export default function EditableLines(props: EditableLinesProps) {
  const { keys, as: Tag = 'h2', className, lineClassName = 'ln', id } = props;
  const { text } = useSiteContent();
  if (useEditBranch()) return <EditBranch name="Lines" props={props} />;
  const lines = keys.map((k) => ({ k, value: text(k) })).filter((line) => line.value);
  if (lines.length === 0) return null;

  return (
    <Tag id={id} className={className}>
      {lines.map((line) => (
        <span key={line.k} className={lineClassName}>
          <i>{line.value}</i>
        </span>
      ))}
    </Tag>
  );
}
