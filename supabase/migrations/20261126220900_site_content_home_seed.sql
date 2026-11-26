-- ================================================================
-- 20261126220900_site_content_home_seed.sql: seed the keys added by the Home rebuild
-- ================================================================
-- The Home rebuild added 19 keys to src/lib/site-content-defaults.ts
-- without a seed migration. The site showed their compiled-in defaults,
-- but admins can only UPDATE site_content, so every edit to these keys
-- matched no row and did not save.
--
-- Rows copied from the output of scripts/gen-site-content-seed.mjs,
-- limited to the keys missing from the table. ON CONFLICT DO NOTHING
-- never overwrites copy the club has written.
-- ================================================================

INSERT INTO public.site_content
  (key, value, kind, max_length, page, section, label, help, display_order)
VALUES
  ('home.hero.partner_label', 'Partner with us', 'text', 28, 'Home', 'Hero', 'Company button text', NULL, 100),
  ('home.hero.partner_href', '/contact-us?type=sponsor', 'url', 200, 'Home', 'Hero', 'Company button link', 'The type parameter preselects the organization type on the contact form.', 110),
  ('home.brands.label', 'Events and competitions with', 'text', 48, 'Home', 'Brands', 'Line above the logos', 'The logos are the active partners on the Partners tab.', 120),
  ('home.formats.title_line1', 'Real partners, real experiences', 'text', 40, 'Home', 'What we run', 'Heading', 'One line on wide screens. The cards under it are edited on the page.', 130),
  ('home.results.title_line1', 'The record', 'text', 24, 'Home', 'Results', 'Heading', 'The figures come from the Stats tab.', 140),
  ('home.results.result', '', 'longtext', 160, 'Home', 'Results', 'One named result', 'A real outcome, e.g. which team won which competition. Leave empty to hide the line.', 150),
  ('home.results.result_date', '', 'text', 24, 'Home', 'Results', 'Result date', 'e.g. Mar 2026.', 160),
  ('home.students.title_line1', 'Learn sales', 'text', 20, 'Home', 'Audiences', 'Students heading, line 1', NULL, 170),
  ('home.students.title_line2', 'by doing it', 'text', 20, 'Home', 'Audiences', 'Students heading, line 2', NULL, 180),
  ('home.students.point1', 'Compete in sales competitions judged by the companies themselves', 'text', 90, 'Home', 'Audiences', 'Students point 1', NULL, 190),
  ('home.students.point2', 'Visit sales offices and meet the people who hire', 'text', 90, 'Home', 'Audiences', 'Students point 2', NULL, 200),
  ('home.students.point3', '15+ events a year, some run with other Western clubs', 'text', 90, 'Home', 'Audiences', 'Students point 3', NULL, 210),
  ('home.students.note', 'Membership is through the Western USC store.', 'text', 90, 'Home', 'Audiences', 'Students note', NULL, 220),
  ('home.companies.title_line1', 'Experience our', 'text', 20, 'Home', 'Audiences', 'Companies heading, line 1', NULL, 230),
  ('home.companies.title_line2', 'ambition', 'text', 20, 'Home', 'Audiences', 'Companies heading, line 2', NULL, 240),
  ('home.companies.point1', 'Run or judge a sales competition on your own product', 'text', 90, 'Home', 'Audiences', 'Companies point 1', NULL, 250),
  ('home.companies.point2', 'Host an office visit or send a speaker', 'text', 90, 'Home', 'Audiences', 'Companies point 2', NULL, 260),
  ('home.companies.point3', 'Reach 150+ members and 1,200+ Instagram followers', 'text', 90, 'Home', 'Audiences', 'Companies point 3', NULL, 270),
  ('home.companies.note', 'A partnerships exec replies to every message.', 'text', 90, 'Home', 'Audiences', 'Companies note', 'State the real reply time once the club commits to one.', 280)
ON CONFLICT (key) DO NOTHING;
