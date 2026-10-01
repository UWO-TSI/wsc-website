-- ================================================================
-- 20260929000009_fit_description_ceilings.sql
-- ================================================================
-- Migration 7 capped event descriptions at 400 and sponsor descriptions
-- at 200. Production already held longer copy that the live site renders
-- fine (one event at 572, all nine sponsors between 200 and 383), so the
-- caps were stricter than the content. NOT VALID let those rows stay, but
-- any later UPDATE of the row (even toggling `active`) re-checks every
-- constraint and was rejected.
--
-- New caps sit above the longest real copy with headroom: 800 and 500.
-- Every existing row fits, so both are added validated this time.
-- ================================================================

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_description_len,
  ADD CONSTRAINT events_description_len CHECK (char_length(description) <= 800);

ALTER TABLE public.sponsors
  DROP CONSTRAINT IF EXISTS sponsors_description_len,
  ADD CONSTRAINT sponsors_description_len CHECK (char_length(description) <= 500);
