-- ================================================================
-- 20261124000005_events_register_url.sql: event registration link
-- ================================================================
-- Optional. The site renders it as an href on a public page, so it
-- gets the same checks as sponsors.link (20260929000007): at most 200
-- characters, http or https only, and the same normalising trigger.
-- The column is new and empty, so the checks are added validated.
-- ================================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS register_url TEXT,
  ADD CONSTRAINT events_register_url_len    CHECK (char_length(register_url) <= 200),
  ADD CONSTRAINT events_register_url_scheme CHECK (register_url IS NULL OR register_url ~* '^https?://');

COMMENT ON COLUMN public.events.register_url IS 'Optional registration link, http or https.';

-- The trigger's column list is fixed in its arguments, so it is
-- recreated with register_url added.
DROP TRIGGER IF EXISTS normalize_events ON public.events;
CREATE TRIGGER normalize_events
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.normalize_lines('title', 'time', 'location', 'description', 'register_url');
