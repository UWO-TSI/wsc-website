-- ================================================================
-- 20260929000001_site_content.sql: editable site copy and stats
-- ================================================================
-- Adds:
--   site_content  Key/value store for every editable string on the
--                 public site. Keys, kinds and ceilings are STRUCTURAL
--                 and owned by the code (src/lib/site-content-defaults.ts);
--                 admins may UPDATE the value column and nothing else.
--                 A missing key is not an error: the frontend falls back
--                 to its compiled-in default.
--   site_stats    The counted figures in the home About slab
--                 (150+ members and so on). Integer plus a static suffix,
--                 because the figure counts up from zero on screen.
--   site-images   Bucket for the photo slots (table in migration 6).
--
-- DEVIATION FROM THE STANDARD TABLE PATTERN (on purpose):
-- site_content has NO visibility column. Hiding a page title would
-- render a blank page, so every row is public by definition. Fields
-- that may be hidden say "leave empty to hide" and the component
-- handles the empty string. site_stats follows the normal pattern.
-- ================================================================


-- ----------------------------------------------------------------
-- NORMALISER: one line, single spaces, no control characters
-- ----------------------------------------------------------------
-- The admin form normalises on blur; this is the backstop for any
-- client that skips it. Paragraph breaks are separate keys, so no
-- value ever needs a newline, and a pasted line break would otherwise
-- render as an awkward wrap in the middle of a heading.
CREATE OR REPLACE FUNCTION public.normalize_line(v TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT CASE
    WHEN v IS NULL THEN NULL
    ELSE btrim(regexp_replace(
           regexp_replace(v, '[[:cntrl:]]', ' ', 'g'),
           '\s+', ' ', 'g'))
  END;
$$;


-- ----------------------------------------------------------------
-- SITE CONTENT
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_content (
  key            TEXT PRIMARY KEY
                 CHECK (key ~ '^[a-z]+\.[a-z]+\.[a-z0-9_]+$'),
  value          TEXT NOT NULL DEFAULT '',
  kind           TEXT NOT NULL DEFAULT 'text'
                 CHECK (kind IN ('text', 'longtext', 'url', 'email')),
  max_length     INT  NOT NULL CHECK (max_length BETWEEN 1 AND 600),
  page           TEXT NOT NULL,              -- admin tab, e.g. 'Home'
  section        TEXT NOT NULL,              -- admin group, e.g. 'Hero'
  label          TEXT NOT NULL,              -- admin field label
  help           TEXT,                       -- optional hint under the field
  display_order  INT  NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT site_content_value_fits
    CHECK (char_length(value) <= max_length),

  -- Same scheme allowlist as the frontend. Blocks javascript: and
  -- data: links, which would otherwise be stored XSS in an href.
  CONSTRAINT site_content_url_scheme
    CHECK (kind <> 'url' OR value = '' OR value ~* '^(https?://|/|#|mailto:)'),

  CONSTRAINT site_content_email_shape
    CHECK (kind <> 'email' OR value = '' OR value ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$')
);

COMMENT ON TABLE  public.site_content IS 'Editable site copy. Keys, kinds and ceilings are owned by the code; admins update value only.';
COMMENT ON COLUMN public.site_content.max_length IS 'Per-key ceiling, set from the type role the string renders in.';

CREATE INDEX IF NOT EXISTS site_content_page_idx
  ON public.site_content (page, section, display_order);

CREATE TRIGGER set_site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.site_content_normalize()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.value := coalesce(public.normalize_line(NEW.value), '');
  RETURN NEW;
END;
$$;

CREATE TRIGGER normalize_site_content
  BEFORE INSERT OR UPDATE OF value ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.site_content_normalize();


-- ----------------------------------------------------------------
-- SITE STATS: repeatable rows, standard visibility pattern
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_stats (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value          INT  NOT NULL CHECK (value BETWEEN 0 AND 99999),
  suffix         TEXT CHECK (char_length(suffix) <= 2),
  label          TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 24),
  visible        BOOLEAN DEFAULT false,      -- safe-by-default
  display_order  INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

COMMENT ON COLUMN public.site_stats.value  IS 'Counted up from zero on screen, so it has to be a number.';
COMMENT ON COLUMN public.site_stats.suffix IS 'Static, never animated: "+" or "%". NULL for none.';

CREATE TRIGGER set_site_stats_updated_at
  BEFORE UPDATE ON public.site_stats
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ================================================================
-- GRANTS
-- ================================================================

-- site_content: admins may UPDATE the value column only. No INSERT or
-- DELETE, so a misclick can never remove a key and blank a section,
-- and no UPDATE on max_length or kind, so a ceiling cannot be lifted
-- from the browser.
REVOKE ALL ON public.site_content FROM anon, authenticated;
GRANT  SELECT          ON public.site_content TO anon;
GRANT  SELECT          ON public.site_content TO authenticated;
GRANT  UPDATE (value)  ON public.site_content TO authenticated;

-- site_stats: full CRUD for admins (they add and remove stats).
REVOKE ALL ON public.site_stats FROM anon, authenticated;
GRANT  SELECT                                  ON public.site_stats TO anon;
GRANT  SELECT, INSERT, UPDATE, DELETE          ON public.site_stats TO authenticated;


-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read site content"
  ON public.site_content FOR SELECT
  USING (true);

CREATE POLICY "Admin can update site content"
  ON public.site_content FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read visible site stats"
  ON public.site_stats FOR SELECT
  USING (visible = true);

CREATE POLICY "Admin full access to site stats"
  ON public.site_stats FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ================================================================
-- STORAGE: site-images bucket
-- ================================================================
-- Size and type limits for all five buckets are set in migration 6.

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "site-images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-images');

CREATE POLICY "site-images: admin upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-images' AND public.is_admin());

CREATE POLICY "site-images: admin update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'site-images' AND public.is_admin());

CREATE POLICY "site-images: admin delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site-images' AND public.is_admin());
