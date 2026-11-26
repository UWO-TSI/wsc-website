'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import { normalizeLine } from '@/lib/normalize';
import type { ExecArea, ExecGroup } from '@/types/database';
import { COPY } from '@/edit/engine/copy';
import { SETTINGS_COPY as C } from './copy';
import {
  deleteArea,
  deleteRole,
  failureOf,
  loadTitles,
  saveArea,
  saveRole,
  type Failure,
  type RoleFields,
} from './data';
import {
  ALIGNED_FIELDS,
  RowField,
  RowMessage,
  SaveCancel,
  SettingsFormRow,
  SettingsRow,
  SettingsSection,
  SMALL,
} from './settings-list';
import { LoadState, rowsSkeleton, useSettingsData } from './load-state';

/*
  Roles and areas, the two halves of an executive title ("VP, Marketing").

  Roles: the role name in the team page's select, its short label in
  titles, and the plural heading over its group on the team page. Areas:
  a name only. Renaming either renames it on every executive, because
  executives point at the row, not at the words. A role or area that an
  executive uses has no Delete, and the database refuses the delete anyway
  (executives.group and executives.area_id are ON DELETE RESTRICT).
*/

/* The CHECK ceilings in the database. */
const ROLE_MAX = 40;
const AREA_MAX = 40;

const tooLong = (v: string, max: number) => (v.length > max ? C.tooLong(v.length, max) : null);
const nextOrder = (rows: Array<{ display_order: number }>) =>
  rows.reduce((m, r) => Math.max(m, r.display_order), 0) + 1;

type Editing = { kind: 'role' | 'area'; id: string | null } | null;
type RowNote = { key: string; tone: 'ok' | 'alert'; text: string };

export default function Titles() {
  const { data, error: loadError, reload: load } = useSettingsData(loadTitles);
  const [editing, setEditing] = useState<Editing>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<RowNote | null>(null);

  const failText = (f: Failure, inUse: string, exists: string) =>
    f === 'expired'
      ? C.expired
      : f === 'in-use'
        ? inUse
        : f === 'conflict'
          ? exists
          : C.writeFailed;

  const run = async (key: string, write: () => Promise<void>, onFail: (f: Failure) => string) => {
    setBusy(key);
    setNote(null);
    try {
      await write();
      setEditing(null);
      await load();
      setBusy(null);
      return null;
    } catch (e) {
      setBusy(null);
      return onFail(failureOf(e));
    }
  };

  const open = (next: Editing) => {
    setNote(null);
    setEditing(next);
  };

  const noteFor = (key: string) =>
    note?.key === key ? <RowMessage tone={note.tone}>{note.text}</RowMessage> : undefined;

  const loading = !data && !loadError;
  const error = loadError ? C.loadFailed(`${C.roles} and ${C.areas.toLowerCase()}`) : null;

  return (
    <>
      <SettingsSection id="settings-roles" title={C.roles} note={C.rolesNote}>
        <LoadState
          loading={loading}
          error={error}
          expired={loadError === 'expired'}
          onRetry={load}
          skeleton={rowsSkeleton(3)}
        >
          {data?.roles.map((role) =>
            editing?.kind === 'role' && editing.id === role.id ? (
              <RoleForm
                key={role.id}
                role={role}
                busy={busy === role.id}
                onCancel={() => setEditing(null)}
                onSave={(fields) =>
                  run(
                    role.id,
                    () => saveRole(role.id, fields, role.display_order),
                    (f) => failText(f, C.writeFailed, C.roleExists(fields.singular_label))
                  )
                }
              />
            ) : (
              <SettingsRow
                key={role.id}
                name={role.singular_label}
                detail={C.roleUse(role.short_label, data.roleUse[role.slug] ?? 0)}
                actions={
                  <>
                    <Button
                      variant="tertiary"
                      className={SMALL}
                      onClick={() => open({ kind: 'role', id: role.id })}
                      aria-label={`${C.edit} ${role.singular_label}`}
                    >
                      {C.edit}
                    </Button>
                    {!data.roleUse[role.slug] && (
                      <Button
                        variant="tertiary"
                        className={`${SMALL} !text-alert`}
                        disabled={busy === role.id}
                        aria-label={`${C.delete} ${role.singular_label}`}
                        onClick={async () => {
                          const text = await run(role.id, () => deleteRole(role.id), (f) =>
                            failText(f, C.roleInUse(role.singular_label), C.writeFailed)
                          );
                          if (text) setNote({ key: role.id, tone: 'alert', text });
                        }}
                      >
                        {C.delete}
                      </Button>
                    )}
                  </>
                }
                message={noteFor(role.id)}
              />
            )
          )}
          {data &&
            (editing?.kind === 'role' && editing.id === null ? (
              <RoleForm
                busy={busy === 'new-role'}
                onCancel={() => setEditing(null)}
                onSave={(fields) =>
                  run(
                    'new-role',
                    () => saveRole(null, fields, nextOrder(data.roles)),
                    (f) => failText(f, C.writeFailed, C.roleExists(fields.singular_label))
                  )
                }
              />
            ) : (
              <li className="px-1 py-1">
                <Button variant="tertiary" className={SMALL} onClick={() => open({ kind: 'role', id: null })}>
                  {C.addRole}
                </Button>
              </li>
            ))}
        </LoadState>
      </SettingsSection>

      <SettingsSection id="settings-areas" title={C.areas} note={C.areasNote}>
        <LoadState
          loading={loading}
          error={error}
          expired={loadError === 'expired'}
          onRetry={load}
          skeleton={rowsSkeleton(3)}
        >
          {data?.areas.map((area) =>
            editing?.kind === 'area' && editing.id === area.id ? (
              <AreaForm
                key={area.id}
                area={area}
                areas={data.areas}
                busy={busy === area.id}
                onCancel={() => setEditing(null)}
                onSave={(name) =>
                  run(
                    area.id,
                    () => saveArea(area.id, name, area.display_order),
                    (f) => failText(f, C.writeFailed, COPY.duplicateArea(name))
                  )
                }
              />
            ) : (
              <SettingsRow
                key={area.id}
                name={area.name}
                detail={C.areaUse(data.areaUse[area.id] ?? 0)}
                actions={
                  <>
                    <Button
                      variant="tertiary"
                      className={SMALL}
                      onClick={() => open({ kind: 'area', id: area.id })}
                      aria-label={`${C.rename} ${area.name}`}
                    >
                      {C.rename}
                    </Button>
                    {!data.areaUse[area.id] && (
                      <Button
                        variant="tertiary"
                        className={`${SMALL} !text-alert`}
                        disabled={busy === area.id}
                        aria-label={`${C.delete} ${area.name}`}
                        onClick={async () => {
                          const text = await run(area.id, () => deleteArea(area.id), (f) =>
                            failText(f, C.areaInUse(area.name), C.writeFailed)
                          );
                          if (text) setNote({ key: area.id, tone: 'alert', text });
                        }}
                      >
                        {C.delete}
                      </Button>
                    )}
                  </>
                }
                message={noteFor(area.id)}
              />
            )
          )}
          {data && (
            <AreaForm
              key="new-area"
              areas={data.areas}
              busy={busy === 'new-area'}
              onSave={(name) =>
                run(
                  'new-area',
                  () => saveArea(null, name, nextOrder(data.areas)),
                  (f) => failText(f, C.writeFailed, COPY.duplicateArea(name))
                )
              }
            />
          )}
        </LoadState>
      </SettingsSection>
    </>
  );
}

type Save<T> = (value: T) => Promise<string | null>;

function RoleForm({
  role,
  busy,
  onSave,
  onCancel,
}: {
  role?: ExecGroup;
  busy: boolean;
  onSave: Save<RoleFields>;
  onCancel: () => void;
}) {
  const id = role?.id ?? 'new';
  const [fields, setFields] = useState<RoleFields>({
    singular_label: role?.singular_label ?? '',
    short_label: role?.short_label ?? '',
    label: role?.label ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RoleFields, string>>>({});
  const [failure, setFailure] = useState<string | null>(null);

  const LABELS: Record<keyof RoleFields, string> = {
    singular_label: C.roleName,
    short_label: C.roleShort,
    label: C.rolePlural,
  };

  const submit = async () => {
    const clean = {
      singular_label: normalizeLine(fields.singular_label),
      short_label: normalizeLine(fields.short_label),
      label: normalizeLine(fields.label),
    };
    const next: Partial<Record<keyof RoleFields, string>> = {};
    for (const k of Object.keys(clean) as Array<keyof RoleFields>) {
      const problem = !clean[k] ? C.missing(LABELS[k]) : tooLong(clean[k], ROLE_MAX);
      if (problem) next[k] = problem;
    }
    setErrors(next);
    setFailure(null);
    if (Object.keys(next).length) return;
    setFailure(await onSave(clean));
  };

  return (
    <SettingsFormRow
      onSubmit={submit}
      message={failure ? <RowMessage tone="alert">{failure}</RowMessage> : undefined}
    >
      <div className={ALIGNED_FIELDS}>
        {(Object.keys(LABELS) as Array<keyof RoleFields>).map((k, i) => (
          <RowField
            key={k}
            aligned
            id={`settings-role-${id}-${k}`}
            label={LABELS[k]}
            value={fields[k]}
            maxLength={ROLE_MAX}
            autoFocus={i === 0}
            error={errors[k]}
            onChange={(v) => {
              setFields((f) => ({ ...f, [k]: v }));
              if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
            }}
          />
        ))}
      </div>
      <SaveCancel
        busy={busy}
        saveLabel={role ? C.save : C.add}
        busyLabel={C.saving}
        onCancel={onCancel}
      />
    </SettingsFormRow>
  );
}

/**
 * Rename one area, or add one when `area` is absent. A name that matches
 * another area ignoring case is refused before it is sent; the unique
 * index on lower(name) refuses it in the database too.
 */
function AreaForm({
  area,
  areas,
  busy,
  onSave,
  onCancel,
}: {
  area?: ExecArea;
  areas: ExecArea[];
  busy: boolean;
  onSave: Save<string>;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(area?.name ?? '');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const clean = normalizeLine(name);
    const twin = areas.find((a) => a.id !== area?.id && a.name.toLowerCase() === clean.toLowerCase());
    const problem = !clean ? C.areaEmpty : (tooLong(clean, AREA_MAX) ?? (twin ? COPY.duplicateArea(twin.name) : null));
    setError(problem);
    if (problem) return;
    if (area && clean === area.name) return onCancel?.();
    const failed = await onSave(clean);
    setError(failed);
    if (!failed && !area) setName('');
  };

  return (
    <SettingsFormRow onSubmit={submit}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <RowField
          id={`settings-area-${area?.id ?? 'new'}`}
          label={area ? C.areaName : C.addArea}
          value={name}
          maxLength={AREA_MAX}
          autoFocus={Boolean(area)}
          error={error}
          onChange={(v) => {
            setName(v);
            if (error) setError(null);
          }}
        />
        <SaveCancel busy={busy} saveLabel={area ? C.save : C.add} busyLabel={C.saving} onCancel={onCancel} />
      </div>
    </SettingsFormRow>
  );
}
