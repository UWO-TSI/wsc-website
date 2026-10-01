-- ================================================================
-- 20260929000008_executives_year.sql: year of study
-- ================================================================
-- Optional, 1 to 6 (covers a five-year dual degree plus a sixth year).
-- Nullable: existing executives have no value and the team page simply
-- omits it.
-- ================================================================

ALTER TABLE public.executives
  ADD COLUMN IF NOT EXISTS year_of_study INT
  CHECK (year_of_study BETWEEN 1 AND 6);

COMMENT ON COLUMN public.executives.year_of_study IS 'Optional year of study, 1 to 6.';
