-- ================================================================
-- 20261124000002_drop_executives_year.sql: remove year of study
-- ================================================================
-- The team page no longer shows a year after the title, and the admin
-- form no longer asks for one. The column and its 1 to 6 CHECK (from
-- 20260929000008) go together.
-- ================================================================

ALTER TABLE public.executives
  DROP COLUMN IF EXISTS year_of_study;
