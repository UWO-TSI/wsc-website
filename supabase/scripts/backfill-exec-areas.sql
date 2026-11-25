-- ================================================================
-- backfill-exec-areas.sql: map each executive's title to a role and area
-- ================================================================
-- For review by a person before it is applied anywhere. Needs
-- 20261124000001_exec_roles_areas.sql.
--
-- What it does, inside one transaction:
--   1. Reads every executives.title and splits it into a role and an
--      area with the rules below.
--   2. Creates each area it found in exec_areas (case-insensitive, so
--      "Events" and "events" become one area).
--   3. Sets executives.area_id for every row that still has none.
--   4. Prints one line per executive: the stored title, the role it
--      read from the title, the role the row has today, the area, and
--      the title the site will show afterwards. The `check` column
--      flags rows that need a person.
--   5. Ends with ROLLBACK, so a first run changes nothing. Read the
--      output, fix anything flagged by hand, then change the last line
--      to COMMIT and run it again.
--
-- It never changes executives."group". A row whose title reads as a
-- different role from its group is flagged as 'role differs' and left
-- for a person to fix in the Team tab.
--
-- Rules, applied to the trimmed title, ignoring case:
--   - Role words at the start: "Assistant Vice President",
--     "Assistant VP" or "AVP" read as assistant_vice_president;
--     "Vice President" or "VP" as vice_president; "President" or
--     "Co-President" as president. Longer forms are tried first, so
--     "AVP Events" never reads as VP.
--   - The rest of the title, after a separating comma, colon, hyphen,
--     dash, "of", "for" or "and", is the area, kept as written:
--     "VP of Events" is VP plus Events, "AVP, Marketing & Design" is
--     AVP plus Marketing & Design.
--   - Role words at the end ("Marketing VP") read the same way, with
--     the words before them as the area.
--   - A title that is only a role ("President", "Co-President") gets
--     no area, and the site keeps showing the stored title. The role
--     and area model has no "Co-", so once executives.title is dropped
--     a Co-President shows as President. The `check` column flags it.
--   - Any other title (for example "Director of Finance") gets no role
--     and no area. It is flagged 'no match' and keeps showing its
--     stored title, because area_id stays NULL.
-- ================================================================

BEGIN;

CREATE TEMP TABLE exec_title_map ON COMMIT DROP AS
WITH t AS (
  SELECT e.id, e.name, e.title, e."group" AS current_role, btrim(e.title) AS raw
  FROM public.executives AS e
),
-- Role words, longest first, and the separators allowed between the
-- role and the area. chr(8211) and chr(8212) are the en and em dash
-- characters, written as code points so the file stays plain ASCII.
words AS (
  SELECT
    '(assistant\s+vice[\s-]+president|assistant\s+vp|avp|vice[\s-]+president|vp|(?:co[\s-]*)?president)' AS role_re,
    '(?:,|:|-|' || chr(8211) || '|' || chr(8212) || ')' AS sep_re
),
parsed AS (
  SELECT
    t.*,
    regexp_match(
      t.raw,
      '^' || w.role_re || '\y(?:\s*(?:' || w.sep_re || '|\yof\y|\yfor\y|\yand\y)\s*|\s+)*(.*)$',
      'i'
    ) AS lead,
    regexp_match(
      t.raw,
      '^(.*?)(?:\s*' || w.sep_re || '\s*|\s+)' || w.role_re || '$',
      'i'
    ) AS trail
  FROM t CROSS JOIN words AS w
),
split AS (
  SELECT
    p.id, p.name, p.title, p.current_role,
    lower(coalesce(p.lead[1], p.trail[2])) AS role_words,
    nullif(btrim(coalesce(p.lead[2], p.trail[1])), '') AS area
  FROM parsed AS p
)
SELECT
  s.id, s.name, s.title, s.current_role, s.area, s.role_words,
  CASE
    WHEN s.role_words IS NULL              THEN NULL
    WHEN s.role_words ~ '^(assistant|avp)' THEN 'assistant_vice_president'
    WHEN s.role_words ~ '^(vice|vp)'       THEN 'vice_president'
    ELSE                                        'president'
  END AS read_role
FROM split AS s;

-- Areas in alphabetical order. display_order leaves gaps of ten so a
-- person can place one between two others later. When two titles spell
-- an area with different capitals, the spelling with capitals is kept
-- ("Events" over "events"): byte order puts upper case first.
INSERT INTO public.exec_areas (name, display_order)
SELECT area, 10 * row_number() OVER (ORDER BY lower(area))
FROM (
  SELECT DISTINCT ON (lower(area)) area
  FROM exec_title_map
  WHERE area IS NOT NULL AND read_role IS NOT NULL
  ORDER BY lower(area), area COLLATE "C"
) AS d
ON CONFLICT ((lower(name))) DO NOTHING;

-- The area name is normalised by a trigger on insert, so match on the
-- normalised form.
UPDATE public.executives AS e
SET area_id = a.id
FROM exec_title_map AS m
JOIN public.exec_areas AS a ON lower(a.name) = lower(public.normalize_line(m.area))
WHERE e.id = m.id
  AND e.area_id IS NULL
  AND m.read_role IS NOT NULL;

-- The review sheet.
SELECT
  m.name,
  m.title          AS stored_title,
  m.read_role,
  m.current_role,
  a.name           AS area,
  CASE
    WHEN e.area_id IS NULL THEN m.title
    ELSE g.short_label || ', ' || a.name
  END              AS shown_after,
  CASE
    WHEN m.read_role IS NULL                         THEN 'no match'
    WHEN m.read_role IS DISTINCT FROM m.current_role THEN 'role differs'
    WHEN m.role_words ~ '^co'                        THEN 'co- not kept'
    ELSE ''
  END              AS "check"
FROM exec_title_map AS m
JOIN public.executives       AS e ON e.id = m.id
LEFT JOIN public.exec_areas  AS a ON a.id = e.area_id
LEFT JOIN public.exec_groups AS g ON g.slug = e."group"
ORDER BY "check" DESC, m.current_role, m.title;

-- Areas created or reused by this run.
SELECT name, display_order FROM public.exec_areas ORDER BY display_order, name;

ROLLBACK;   -- change to COMMIT only after the review sheet is correct
