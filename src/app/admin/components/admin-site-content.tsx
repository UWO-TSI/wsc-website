'use client';

import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import { useSupabaseMutation } from '@/lib/supabase/hooks/use-supabase-mutation';
import { normalizeFor, validateField, type FieldFormat } from '@/lib/normalize';
import { CONTENT_PAGES, type ContentKind } from '@/lib/site-content-defaults';
import { FIELD_ERROR_RING, FIELD_WELL } from '@/components/contact/field';
import Slab from '@/components/ui/slab';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';
import CharCount from './char-count';
import SaveBar from './save-bar';
import { useUnsavedChanges } from '../unsaved-changes';

/*
  Site text: every editable string on the public site, in the seven tabs
  the club thinks in (Home, About, Team, Events, Partners, Contact, Footer).

  Keys, labels, kinds and ceilings come from the database rows, which are
  seeded from src/lib/site-content-defaults.ts. An admin can change a value
  and nothing else; the database grants UPDATE on that one column.

  Edits batch: change any number of fields on a page, then save once.
  Switching page or tab with edits pending asks first, and leaving
  discards them.
  Each field validates against its own ceiling and kind, and Save is
  refused while any edited field is invalid. Values are normalised to one
  line on blur, so a pasted line break never splits a heading.
*/

interface ContentRow {
  key: string;
  value: string;
  kind: ContentKind;
  max_length: number;
  page: string;
  section: string;
  label: string;
  help: string | null;
  display_order: number;
}

const FORMAT: Record<ContentKind, FieldFormat> = {
  text: 'line',
  longtext: 'line',
  url: 'url',
  email: 'email',
};

export default function AdminSiteContent() {
  const { data: rows, loading, error, refetch } = useSupabaseQuery<ContentRow>('site_content');
  const { mutate, loading: saving, error: mutError, reset: resetMutError } = useSupabaseMutation();

  /** Edited values, keyed by content key. Only these get written. */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [activePage, setActivePage] = useState<string>(CONTENT_PAGES[0]);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const pages = useMemo(() => {
    const present = new Set(rows.map((r) => r.page));
    const ordered: string[] = CONTENT_PAGES.filter((p) => present.has(p));
    /* A page the code does not know yet still gets a tab. */
    for (const p of present) if (!ordered.includes(p)) ordered.push(p);
    return ordered;
  }, [rows]);

  /** Rows of the open page, grouped into their sections, in order. */
  const sections = useMemo(() => {
    const onPage = rows
      .filter((r) => r.page === activePage)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

    const grouped = new Map<string, ContentRow[]>();
    for (const row of onPage) {
      const bucket = grouped.get(row.section);
      if (bucket) bucket.push(row);
      else grouped.set(row.section, [row]);
    }
    return Array.from(grouped.entries());
  }, [rows, activePage]);

  const byKey = useMemo(() => new Map(rows.map((r) => [r.key, r])), [rows]);
  const dirtyKeys = Object.keys(drafts);

  const errorFor = (row: ContentRow, value: string) =>
    validateField(
      { label: row.label, maxLength: row.max_length, format: FORMAT[row.kind] },
      value
    );

  const invalid = dirtyKeys.filter((key) => {
    const row = byKey.get(key);
    return row ? errorFor(row, drafts[key]) : false;
  });

  const dirtyPages = new Set(dirtyKeys.map((key) => byKey.get(key)?.page));

  const confirmLeave = useUnsavedChanges('site_content', dirtyKeys.length > 0);

  const valueFor = (row: ContentRow) => drafts[row.key] ?? row.value ?? '';

  const setDraft = (row: ContentRow, next: string) => {
    setDrafts((prev) => {
      /* Typing a value back to its original un-dirties the field, so Save
         reflects real pending changes. */
      if (next === (row.value ?? '')) {
        const rest = { ...prev };
        delete rest[row.key];
        return rest;
      }
      return { ...prev, [row.key]: next };
    });
  };

  const discardAll = () => {
    setDrafts({});
    setSubmitted(false);
    resetMutError();
  };

  const handleSave = async () => {
    setSubmitted(true);
    if (dirtyKeys.length === 0 || invalid.length > 0) return;

    try {
      await mutate(async () => {
        for (const key of dirtyKeys) {
          const row = byKey.get(key);
          if (!row) continue;
          const { error: updateError } = await supabase
            .from('site_content')
            .update({ value: normalizeFor(FORMAT[row.kind], drafts[key]) })
            .eq('key', key);
          if (updateError) throw updateError;
        }
      });

      /* Refetch before clearing drafts, so no field shows its old value for
         a frame in between. */
      await refetch();
      setDrafts({});
      setSubmitted(false);
      setSavedAt(Date.now());
    } catch {
      // Surfaced through mutError.
    }
  };

  return (
    <div>
      <SaveBar
        title="Site text"
        hint="Every word on the public site, by page."
        pending={dirtyKeys.length}
        saving={saving}
        savedAt={savedAt}
        onSave={handleSave}
        onDiscard={discardAll}
      />

      {submitted && invalid.length > 0 && (
        <p className="body-sm text-alert mb-5">
          {invalid.length} field{invalid.length === 1 ? ' needs' : 's need'} fixing before saving.
        </p>
      )}
      {mutError && <p className="body-sm text-alert mb-5">{mutError.message}</p>}

      {/* Page switcher */}
      <div className="flex gap-1 mb-6 flex-wrap" role="tablist" aria-label="Page">
        {pages.map((page) => (
          <button
            key={page}
            role="tab"
            aria-selected={page === activePage}
            onClick={() => {
              if (page === activePage) return;
              confirmLeave(() => {
                discardAll();
                setActivePage(page);
              });
            }}
            className={`label rounded-md px-3 py-2 cursor-pointer transition-colors duration-[var(--d-hover)] ease-enter ${
              page === activePage
                ? 'bg-accent-veil text-accent-ink'
                : 'text-ink-muted hover:text-ink hover:bg-sunken'
            }`}
          >
            {page}
            {dirtyPages.has(page) && <span className="text-accent-ink"> *</span>}
          </button>
        ))}
      </div>

      <AsyncStateWrapper loading={loading} error={error} data={rows} onRetry={refetch}>
        <div className="flex flex-col gap-4 max-w-3xl">
          {sections.map(([section, sectionRows]) => (
            <Slab key={section} tone="raised">
              <h3 className="label text-accent-ink mb-5">{section}</h3>

              <div className="flex flex-col gap-5">
                {sectionRows.map((row) => {
                  const id = `field-${row.key}`;
                  const value = valueFor(row);
                  const dirty = row.key in drafts;
                  const err = dirty && (submitted || value !== row.value) ? errorFor(row, value) : null;
                  const common = {
                    id,
                    value,
                    'aria-invalid': !!err,
                    'aria-describedby': err ? `${id}-error` : undefined,
                    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                      setDraft(row, e.target.value),
                    onBlur: () => setDraft(row, normalizeFor(FORMAT[row.kind], value)),
                    style: err ? FIELD_ERROR_RING : undefined,
                  };

                  return (
                    <div key={row.key}>
                      <label className="label mb-2 block" htmlFor={id}>
                        {row.label}
                        {dirty && <span className="text-accent-ink"> *</span>}
                      </label>

                      {row.kind === 'longtext' ? (
                        <textarea {...common} rows={3} className={`${FIELD_WELL} resize-y`} />
                      ) : (
                        <input
                          {...common}
                          type={row.kind === 'email' ? 'email' : row.kind === 'url' ? 'url' : 'text'}
                          inputMode={row.kind === 'url' ? 'url' : row.kind === 'email' ? 'email' : 'text'}
                          className={FIELD_WELL}
                        />
                      )}

                      <div className="mt-1.5 flex items-start justify-between gap-4">
                        <p className="meta text-ink-faint">{row.help ?? row.key}</p>
                        <CharCount length={value.length} max={row.max_length} />
                      </div>
                      {err && (
                        <p id={`${id}-error`} className="body-sm text-alert mt-1.5">
                          {err}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Slab>
          ))}
        </div>
      </AsyncStateWrapper>
    </div>
  );
}
