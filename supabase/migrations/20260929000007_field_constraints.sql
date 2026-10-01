-- ================================================================
-- 20260929000007_field_constraints.sql: ceilings and normalising
-- ================================================================
-- The admin form shows a live counter and blocks submit past these
-- limits; the database enforces the same numbers so a client that
-- skips the form gets the same answer. Keep in step with
-- src/app/admin/form-config.ts.
--
-- Every ceiling is added NOT VALID: existing rows are not checked, so
-- the migration cannot fail on copy the club already published. New
-- and edited rows are checked. VALIDATE CONSTRAINT later, once old
-- rows have been tidied, if a hard guarantee is wanted.
--
-- The normalising trigger collapses whitespace and strips line breaks
-- and control characters, then turns an empty optional field into
-- NULL. A required field left blank therefore hits its NOT NULL and is
-- refused, instead of saving an invisible title.
-- ================================================================


-- ----------------------------------------------------------------
-- NORMALISER, generic over the columns named in the trigger args
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_lines()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  col  TEXT;
  rec  JSONB := to_jsonb(NEW);
  v    TEXT;
BEGIN
  FOREACH col IN ARRAY TG_ARGV LOOP
    IF jsonb_typeof(rec -> col) = 'string' THEN
      v := nullif(public.normalize_line(rec ->> col), '');
      rec := jsonb_set(rec, ARRAY[col], coalesce(to_jsonb(v), 'null'::jsonb));
    END IF;
  END LOOP;
  NEW := jsonb_populate_record(NEW, rec);
  RETURN NEW;
END;
$$;

CREATE TRIGGER normalize_events
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.normalize_lines('title', 'time', 'location', 'description');

CREATE TRIGGER normalize_sponsors
  BEFORE INSERT OR UPDATE ON public.sponsors
  FOR EACH ROW EXECUTE FUNCTION public.normalize_lines('name', 'description', 'link');

CREATE TRIGGER normalize_executives
  BEFORE INSERT OR UPDATE ON public.executives
  FOR EACH ROW EXECUTE FUNCTION public.normalize_lines('name', 'title');

CREATE TRIGGER normalize_exec_groups
  BEFORE INSERT OR UPDATE ON public.exec_groups
  FOR EACH ROW EXECUTE FUNCTION public.normalize_lines('label', 'singular_label');

CREATE TRIGGER normalize_gallery_photos
  BEFORE INSERT OR UPDATE ON public.gallery_photos
  FOR EACH ROW EXECUTE FUNCTION public.normalize_lines('alt', 'caption');

CREATE TRIGGER normalize_site_stats
  BEFORE INSERT OR UPDATE ON public.site_stats
  FOR EACH ROW EXECUTE FUNCTION public.normalize_lines('label', 'suffix');


-- ----------------------------------------------------------------
-- CEILINGS
-- ----------------------------------------------------------------
ALTER TABLE public.events
  ADD CONSTRAINT events_title_len       CHECK (char_length(title) BETWEEN 1 AND 80)        NOT VALID,
  ADD CONSTRAINT events_location_len    CHECK (char_length(location) <= 60)                NOT VALID,
  ADD CONSTRAINT events_description_len CHECK (char_length(description) <= 400)            NOT VALID;

ALTER TABLE public.sponsors
  ADD CONSTRAINT sponsors_name_len        CHECK (char_length(name) BETWEEN 1 AND 40)       NOT VALID,
  ADD CONSTRAINT sponsors_description_len CHECK (char_length(description) <= 200)          NOT VALID,
  ADD CONSTRAINT sponsors_link_len        CHECK (char_length(link) <= 200)                 NOT VALID,
  -- https only: the link is rendered as an href on a public page.
  ADD CONSTRAINT sponsors_link_scheme     CHECK (link IS NULL OR link ~* '^https?://')     NOT VALID;

ALTER TABLE public.executives
  ADD CONSTRAINT executives_name_len  CHECK (char_length(name) BETWEEN 1 AND 40)           NOT VALID,
  ADD CONSTRAINT executives_title_len CHECK (char_length(title) BETWEEN 1 AND 40)          NOT VALID;

ALTER TABLE public.exec_groups
  ADD CONSTRAINT exec_groups_label_len          CHECK (char_length(label) BETWEEN 1 AND 40)          NOT VALID,
  ADD CONSTRAINT exec_groups_singular_label_len CHECK (char_length(singular_label) BETWEEN 1 AND 40) NOT VALID;

ALTER TABLE public.gallery_photos
  ADD CONSTRAINT gallery_photos_alt_len     CHECK (char_length(alt) <= 120)                NOT VALID,
  ADD CONSTRAINT gallery_photos_caption_len CHECK (char_length(caption) <= 100)            NOT VALID;
