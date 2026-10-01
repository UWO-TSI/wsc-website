-- ================================================================
-- 20260929000003_exec_groups.sql: Make executive roles user-defined
-- ================================================================
-- Today executives."group" is pinned by a CHECK constraint to exactly
-- three values, and those values are repeated in form-config.ts and
-- in executive-team/page.tsx. Adding a role therefore needs a
-- migration plus two code edits.
--
-- This replaces the CHECK with a lookup table + foreign key, so the
-- club can add, rename, reorder and hide roles from the dashboard.
--
-- ORDER MATTERS: seed exec_groups BEFORE adding the FK, or every
-- existing executives row fails the constraint.
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- EXEC GROUPS
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exec_groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,       -- stable key, e.g. 'vice_president'
  label           TEXT NOT NULL,              -- section header, e.g. 'Vice Presidents'
  singular_label  TEXT NOT NULL,              -- admin dropdown, e.g. 'Vice President'
  visible         BOOLEAN DEFAULT true,       -- see note below re: default
  display_order   INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.exec_groups IS 'Executive role tiers. Replaces the old CHECK constraint on executives."group".';
COMMENT ON COLUMN public.exec_groups.visible IS
  'Defaults TRUE, unlike content tables. A hidden group silently drops its members from the team page, which reads as data loss rather than a draft state.';

-- Auto-derive slug from singular_label so the admin UI only asks for
-- a human label. Explicit slugs still win when supplied.
CREATE OR REPLACE FUNCTION public.exec_groups_set_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    NEW.slug := trim(both '_' from
      lower(regexp_replace(NEW.singular_label, '[^a-zA-Z0-9]+', '_', 'g'))
    );
  END IF;
  IF NEW.slug = '' THEN
    RAISE EXCEPTION 'Role name must contain at least one letter or number';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER exec_groups_set_slug_trg
  BEFORE INSERT ON public.exec_groups
  FOR EACH ROW EXECUTE FUNCTION public.exec_groups_set_slug();

CREATE TRIGGER set_exec_groups_updated_at
  BEFORE UPDATE ON public.exec_groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ────────────────────────────────────────────────────────────────
-- SEED the three existing roles (must run before the FK is added)
-- ────────────────────────────────────────────────────────────────
INSERT INTO public.exec_groups (slug, label, singular_label, visible, display_order) VALUES
  ('president',                'Presidents',                'President',                true, 10),
  ('vice_president',           'Vice Presidents',           'Vice President',           true, 20),
  ('assistant_vice_president', 'Assistant Vice Presidents', 'Assistant Vice President', true, 30)
ON CONFLICT (slug) DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Drop the CHECK on executives."group", add the FK
-- ────────────────────────────────────────────────────────────────
-- The constraint name was auto-generated, so find it rather than
-- guessing. This drops any CHECK on the table that references "group".
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.executives'::regclass
      AND contype  = 'c'
      AND pg_get_constraintdef(oid) LIKE '%group%'
  LOOP
    EXECUTE format('ALTER TABLE public.executives DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

-- Safety net: refuse to proceed if any row points at a role that does
-- not exist, rather than failing with an opaque FK violation.
DO $$
DECLARE orphan_count INT;
BEGIN
  SELECT count(*) INTO orphan_count
  FROM public.executives e
  WHERE e."group" IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.exec_groups g WHERE g.slug = e."group");

  IF orphan_count > 0 THEN
    RAISE EXCEPTION
      'Cannot add FK: % executives row(s) reference a role not present in exec_groups. Seed the missing roles first.',
      orphan_count;
  END IF;
END $$;

ALTER TABLE public.executives
  ADD CONSTRAINT executives_group_fkey
  FOREIGN KEY ("group") REFERENCES public.exec_groups(slug)
  ON UPDATE CASCADE      -- renaming a slug follows through to members
  ON DELETE RESTRICT;    -- a role with members cannot be deleted

CREATE INDEX IF NOT EXISTS executives_group_idx ON public.executives ("group");


-- ════════════════════════════════════════════════════════════════
-- GRANTS + RLS
-- ════════════════════════════════════════════════════════════════

REVOKE ALL ON public.exec_groups FROM anon, authenticated;
GRANT  SELECT                         ON public.exec_groups TO anon;
GRANT  SELECT, INSERT, UPDATE, DELETE ON public.exec_groups TO authenticated;

ALTER TABLE public.exec_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read visible exec groups"
  ON public.exec_groups FOR SELECT
  USING (visible = true);

CREATE POLICY "Admin full access to exec groups"
  ON public.exec_groups FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
