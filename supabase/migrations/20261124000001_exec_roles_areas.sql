-- ================================================================
-- 20261124000001_exec_roles_areas.sql: short role labels and areas
-- ================================================================
-- An executive's title becomes two pieces of data: the role (already
-- executives."group", a FK to exec_groups) and an optional area such
-- as Marketing. The site builds the title when it shows it:
--
--   role short label, comma, area    "VP, Marketing"
--   role short label alone           "President" (no area)
--
-- The built title is never stored. executives.title stays for now:
-- the site shows it for every executive whose area_id is NULL, so the
-- live team page reads the same until a person has reviewed
-- supabase/scripts/backfill-exec-areas.sql. A later migration drops
-- executives.title once every row has been mapped.
-- ================================================================


-- ----------------------------------------------------------------
-- 1. exec_groups.short_label
-- ----------------------------------------------------------------
-- The three seeded roles get their usual abbreviations. Any role the
-- club created since gets its singular label, which an admin can
-- shorten from the Roles tab.
ALTER TABLE public.exec_groups
  ADD COLUMN IF NOT EXISTS short_label TEXT;

UPDATE public.exec_groups
  SET short_label = CASE slug
    WHEN 'president'                THEN 'President'
    WHEN 'vice_president'           THEN 'VP'
    WHEN 'assistant_vice_president' THEN 'AVP'
    ELSE singular_label
  END
  WHERE short_label IS NULL;

ALTER TABLE public.exec_groups
  ALTER COLUMN short_label SET NOT NULL,
  ADD CONSTRAINT exec_groups_short_label_len CHECK (char_length(short_label) BETWEEN 1 AND 40);

COMMENT ON COLUMN public.exec_groups.short_label IS
  'Role as it appears in a built title, e.g. VP in "VP, Marketing".';

-- Same normalising as the other two labels. The trigger is recreated
-- because its column list is fixed in its arguments.
DROP TRIGGER IF EXISTS normalize_exec_groups ON public.exec_groups;
CREATE TRIGGER normalize_exec_groups
  BEFORE INSERT OR UPDATE ON public.exec_groups
  FOR EACH ROW EXECUTE FUNCTION public.normalize_lines('label', 'singular_label', 'short_label');


-- ----------------------------------------------------------------
-- 2. exec_areas
-- ----------------------------------------------------------------
-- No visibility column. An area appears on the site only through an
-- executive, and the executive row carries its own `visible` flag.
CREATE TABLE IF NOT EXISTS public.exec_areas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  display_order  INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT exec_areas_name_len CHECK (char_length(name) BETWEEN 1 AND 40)
);

COMMENT ON TABLE public.exec_areas IS
  'Portfolio an executive leads, e.g. Marketing. Joined to the role to build the title shown on the site.';

-- "Marketing" and "marketing" are the same area.
CREATE UNIQUE INDEX IF NOT EXISTS exec_areas_name_lower_idx
  ON public.exec_areas (lower(name));

CREATE TRIGGER normalize_exec_areas
  BEFORE INSERT OR UPDATE ON public.exec_areas
  FOR EACH ROW EXECUTE FUNCTION public.normalize_lines('name');

CREATE TRIGGER set_exec_areas_updated_at
  BEFORE UPDATE ON public.exec_areas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ----------------------------------------------------------------
-- 3. executives.area_id
-- ----------------------------------------------------------------
-- RESTRICT: an area that still has members cannot be deleted. The
-- admin has to move or clear those members first.
ALTER TABLE public.executives
  ADD COLUMN IF NOT EXISTS area_id UUID
  REFERENCES public.exec_areas(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS executives_area_id_idx ON public.executives (area_id);

COMMENT ON COLUMN public.executives.area_id IS
  'Optional area. NULL means the title is the role alone, or, until the backfill is reviewed, the stored title.';
COMMENT ON COLUMN public.executives.title IS
  'Legacy free-text title. Shown only while area_id is NULL. Dropped once supabase/scripts/backfill-exec-areas.sql has been reviewed and applied.';


-- ================================================================
-- GRANTS + RLS for exec_areas
-- ================================================================
-- Same pattern as exec_groups: anon reads, authenticated may issue
-- writes, and RLS lets a write through only for an admin who has
-- passed the second-factor challenge (is_admin_mfa(), which calls
-- is_admin()).

REVOKE ALL ON public.exec_areas FROM anon, authenticated;
GRANT  SELECT                         ON public.exec_areas TO anon;
GRANT  SELECT, INSERT, UPDATE, DELETE ON public.exec_areas TO authenticated;

ALTER TABLE public.exec_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read exec areas"
  ON public.exec_areas FOR SELECT
  USING (true);

CREATE POLICY "Admin full access to exec areas"
  ON public.exec_areas FOR ALL
  USING (public.is_admin_mfa())
  WITH CHECK (public.is_admin_mfa());
