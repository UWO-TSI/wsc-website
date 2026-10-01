-- ================================================================
-- 20260929000010_event_time_structured.sql: event time as HH:MM
-- ================================================================
-- events.time was free text ("6:00 PM", "6pm", "18:30"). The admin form
-- now uses a time picker, which produces 24-hour HH:MM, and the site
-- formats it for display. Stays TEXT rather than TIME so the column
-- type does not change under the live site mid-deploy.
--
-- Existing values are converted where they parse. A value that does not
-- parse is LEFT AS IS and reported with a NOTICE, never discarded: the
-- format check is NOT VALID, so old rows survive, and the next edit of
-- that event asks for a proper time.
-- ================================================================

CREATE OR REPLACE FUNCTION public.parse_event_time(v TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog
AS $$
DECLARE
  m  TEXT[];
  h  INT;
  mi INT;
BEGIN
  IF v IS NULL OR btrim(v) = '' THEN
    RETURN NULL;
  END IF;

  -- Already HH:MM or H:MM, 24-hour.
  m := regexp_match(btrim(v), '^([01]?[0-9]|2[0-3]):([0-5][0-9])$');
  IF m IS NOT NULL THEN
    RETURN lpad(m[1], 2, '0') || ':' || m[2];
  END IF;

  -- 12-hour, first time in the string: "6pm", "6:30 PM", "6:30 p.m. - 8".
  m := regexp_match(lower(v), '^\s*(1[0-2]|0?[1-9])(?::([0-5][0-9]))?\s*([ap])\.?\s*m?\.?');
  IF m IS NOT NULL THEN
    h  := m[1]::INT % 12 + CASE WHEN m[3] = 'p' THEN 12 ELSE 0 END;
    mi := coalesce(m[2], '0')::INT;
    RETURN lpad(h::TEXT, 2, '0') || ':' || lpad(mi::TEXT, 2, '0');
  END IF;

  RETURN NULL;
END;
$$;

-- Only rows whose value actually changes are written, and each write is
-- its own subtransaction: an UPDATE re-checks every constraint on the row,
-- so one row failing some other ceiling must leave its time as is with a
-- NOTICE, not abort the migration.
DO $$
DECLARE
  r      RECORD;
  parsed TEXT;
BEGIN
  FOR r IN SELECT id, time FROM public.events WHERE time IS NOT NULL LOOP
    parsed := public.parse_event_time(r.time);
    IF parsed IS NULL THEN
      RAISE NOTICE 'events %: time % did not parse; left as is', r.id, quote_literal(r.time);
    ELSIF parsed IS DISTINCT FROM r.time THEN
      BEGIN
        UPDATE public.events SET time = parsed WHERE id = r.id;
      EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'events %: time % not converted (%); left as is', r.id, quote_literal(r.time), SQLERRM;
      END;
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.events
  ADD CONSTRAINT events_time_format
  CHECK (time IS NULL OR time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
  NOT VALID;

COMMENT ON COLUMN public.events.time IS '24-hour HH:MM, or NULL. Formatted for display by the site.';
