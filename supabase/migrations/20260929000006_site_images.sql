-- ================================================================
-- 20260929000006_site_images.sql: photo slots, bucket limits
-- ================================================================
-- A SLOT is a position in the design, e.g. 'about.story.image2'. The
-- slot list and each slot's frame live in code (src/lib/image-slots.ts),
-- so adding a slot is a one-line change with no migration. This table
-- only records which uploaded file currently fills which slot.
--
-- No row means the slot is empty and the page renders a still
-- placeholder at the slot's aspect ratio. DELETE empties a slot.
--
-- Cropping is the frame's job, not storage's: the original is stored
-- uncropped and drawn with object-fit: cover inside a fixed-aspect
-- frame. A wide photo in a tall slot scales up and crops; the frame
-- never resizes. Physically cropping on upload would be irreversible
-- and would bake in today's layout.
--
-- Also sets size and type limits on all five buckets. Until now those
-- limits existed only in browser code, which any client can skip.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.site_images (
  -- The database's half of the ID scheme: page.section.imageN.
  slot         TEXT PRIMARY KEY
               CHECK (slot ~ '^[a-z]+\.[a-z]+\.image[1-9][0-9]*$'),
  -- Object name in the site-images bucket, never a URL.
  object_name  TEXT NOT NULL
               CHECK (object_name ~ '^[A-Za-z0-9._-]{1,200}$'),
  -- Required: once the photo can change, its description has to as well.
  alt          TEXT NOT NULL CHECK (char_length(alt) BETWEEN 1 AND 120),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by   UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.site_images IS 'Which uploaded file fills each design photo slot. No row means empty.';

CREATE TRIGGER set_site_images_updated_at
  BEFORE UPDATE ON public.site_images
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.site_images_normalize()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.alt := public.normalize_line(NEW.alt);
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;

CREATE TRIGGER normalize_site_images
  BEFORE INSERT OR UPDATE ON public.site_images
  FOR EACH ROW EXECUTE FUNCTION public.site_images_normalize();


-- ----------------------------------------------------------------
-- GRANTS AND RLS
-- ----------------------------------------------------------------
REVOKE ALL ON public.site_images FROM anon, authenticated;
GRANT  SELECT                         ON public.site_images TO anon;
GRANT  SELECT, INSERT, UPDATE, DELETE ON public.site_images TO authenticated;

ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read site images"
  ON public.site_images FOR SELECT
  USING (true);

CREATE POLICY "Admin full access to site images"
  ON public.site_images FOR ALL
  USING (public.is_admin_mfa())
  WITH CHECK (public.is_admin_mfa());


-- ----------------------------------------------------------------
-- BUCKET LIMITS: 2 MB, raster images only
-- ----------------------------------------------------------------
-- Mirrors LIMITS in src/lib/admin-config.ts. SVG is deliberately not
-- allowed: it can carry script, and these buckets are public.
UPDATE storage.buckets
SET file_size_limit    = 2 * 1024 * 1024,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
WHERE id IN ('headshots', 'sponsor-logos', 'event-images', 'gallery', 'site-images');
