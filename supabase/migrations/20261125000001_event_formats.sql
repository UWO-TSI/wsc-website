-- ================================================================
-- 20261125000001_event_formats.sql: the home page's format cards
-- ================================================================
-- The sideways row of cards on Home ("Sales competitions", "Office
-- visits", ...) used to be four fixed cards: copy compiled into the
-- frontend and one photo slot each (home.about.image1 to image4 in
-- site_images). This table holds one row per card, so admins can add,
-- edit, reorder, hide and remove cards from edit mode.
--
-- Photos are stored in the existing public site-images bucket, as a
-- root-level object name in image_path, never a URL. The seed points
-- each card at the object its old slot already uses, so production
-- keeps its photos. The four site_images rows are left in place: no
-- page reads those slots once this ships, and leaving them keeps the
-- previous frontend whole until the new one is deployed.
--
-- No audit trigger: admin_audit records admin and invite changes
-- only, and no content table writes to it.
-- ================================================================


-- ----------------------------------------------------------------
-- 1. TABLE
-- ----------------------------------------------------------------
-- The ceilings match the frontend fields (LIMIT in
-- src/edit/engine/list-editors.tsx). body and meta are optional: the
-- card hides an empty line. visible defaults to false, the
-- safe-by-default rule every content table follows.
CREATE TABLE IF NOT EXISTS public.event_formats (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  body           TEXT,
  meta           TEXT,
  -- Object name in the site-images bucket, never a URL.
  image_path     TEXT,
  visible        BOOLEAN NOT NULL DEFAULT false,
  display_order  INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_formats_title_len  CHECK (char_length(title) BETWEEN 1 AND 28),
  CONSTRAINT event_formats_body_len   CHECK (char_length(body) <= 140),
  CONSTRAINT event_formats_meta_len   CHECK (char_length(meta) <= 60),
  CONSTRAINT event_formats_image_name CHECK (image_path ~ '^[A-Za-z0-9._-]{1,200}$')
);

COMMENT ON TABLE public.event_formats IS
  'One card in the home page row of event formats. Photo object in the site-images bucket.';
COMMENT ON COLUMN public.event_formats.meta IS
  'Who ran it, e.g. With Owner.com. NULL hides the line.';
COMMENT ON COLUMN public.event_formats.image_path IS
  'Object name in the site-images bucket. NULL shows the empty photo frame.';

-- Collapses whitespace and turns an empty optional line into NULL, as
-- on every other content table. A blank title becomes NULL and is
-- refused by NOT NULL.
CREATE TRIGGER normalize_event_formats
  BEFORE INSERT OR UPDATE ON public.event_formats
  FOR EACH ROW EXECUTE FUNCTION public.normalize_lines('title', 'body', 'meta');

CREATE TRIGGER set_event_formats_updated_at
  BEFORE UPDATE ON public.event_formats
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ----------------------------------------------------------------
-- 2. GRANTS + RLS
-- ----------------------------------------------------------------
-- Same pattern as sponsors: anon reads visible rows only, and has
-- SELECT and nothing else (no REFERENCES, TRIGGER or TRUNCATE).
-- authenticated may issue writes, and RLS lets a write through only
-- for an admin who has passed the second-factor challenge.
REVOKE ALL ON public.event_formats FROM anon, authenticated;
GRANT  SELECT                         ON public.event_formats TO anon;
GRANT  SELECT, INSERT, UPDATE, DELETE ON public.event_formats TO authenticated;

ALTER TABLE public.event_formats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read visible event formats"
  ON public.event_formats FOR SELECT
  USING (visible = true);

CREATE POLICY "Admin full access to event formats"
  ON public.event_formats FOR ALL
  USING (public.is_admin_mfa())
  WITH CHECK (public.is_admin_mfa());


-- ----------------------------------------------------------------
-- 3. SEED: the four cards the site showed before this table
-- ----------------------------------------------------------------
-- Copy is the compiled default the frontend shipped with (those keys
-- were never in site_content). Each photo is the object its old slot
-- points at, or NULL where the slot was empty. Seeds only while the
-- table is empty, so it never brings back a card the club removed.
INSERT INTO public.event_formats (title, body, meta, image_path, visible, display_order)
SELECT f.title, f.body, NULL, si.object_name, true, f.display_order
FROM (VALUES
  ('home.about.image1', 'Sales competitions',
   'Teams pitch to a real company, and people from that company judge the round.', 10),
  ('home.about.image2', 'Office visits',
   'Members spend an afternoon at a company’s sales office and meet the team.', 20),
  ('home.about.image3', 'Guest speakers',
   'Sales leaders explain how they got their job and how they hire.', 30),
  ('home.about.image4', 'Social events',
   'Members meet each other and students from other clubs at Western.', 40)
) AS f(slot, title, body, display_order)
LEFT JOIN public.site_images si ON si.slot = f.slot
WHERE NOT EXISTS (SELECT 1 FROM public.event_formats);
