/**
 * Every editable string on the public site, in one registry.
 *
 * This file is the single source of truth for three things:
 *
 *   1. The compiled-in fallback a component renders when the database
 *      row is missing, the fetch fails, or Supabase is down. The site
 *      never shows a blank headline because of a network blip.
 *   2. The key space. `SiteContentKey` is derived from it, so a typo in
 *      a component is a compile error rather than a silently empty string.
 *   3. The seed. `scripts/gen-site-content-seed.mjs` writes
 *      `supabase/migrations/20260929000002_site_content_seed.sql` from
 *      this object, so the defaults and the seed cannot drift apart.
 *
 * Keys are `page.section.element`. Admins can change a value, never a key,
 * a kind or a ceiling: the database grants UPDATE on the value column only.
 *
 * `max` is the per-key ceiling the database enforces. It is set from the
 * type role the string renders in, so an editor cannot push a hero line
 * into a second row: the hero lines get 14 characters, a section head line
 * 24, a paragraph a few hundred. Structural line breaks are separate keys
 * (`title_line1`, `title_line2`), never a newline inside a value.
 *
 * Adding a string: add it here, regenerate the seed into a NEW migration,
 * and read it with `text()` in the component.
 *
 * Kept free of imports and path aliases so Node can run the seed script
 * against it directly with --experimental-strip-types.
 */

export type ContentKind = 'text' | 'longtext' | 'url' | 'email';

/** The seven Site text tabs, in sidebar order. */
export const CONTENT_PAGES = [
  'Home',
  'About',
  'Team',
  'Events',
  'Partners',
  'Contact',
  'Footer',
] as const;

export type ContentPage = (typeof CONTENT_PAGES)[number];

export interface ContentEntry {
  value: string;
  kind: ContentKind;
  page: ContentPage;
  section: string;
  label: string;
  max: number;
  help?: string;
}

const STORE_URL = 'https://westernusc.store/product/western-sales-club/';

export const SITE_CONTENT = {
  // Home / Hero
  'home.hero.title_line1': { value: '', kind: 'text', page: 'Home', section: 'Hero', label: 'Greeting', max: 24, help: 'Optional. A smaller line above the headline. Leave empty for none.' },
  'home.hero.title_line2': { value: 'Pitch real', kind: 'text', page: 'Home', section: 'Hero', label: 'Headline, line 1', max: 14, help: 'Each headline line is set very large, so keep it to one or two words.' },
  'home.hero.title_line3': { value: 'companies.', kind: 'text', page: 'Home', section: 'Hero', label: 'Headline, line 2', max: 14 },
  'home.hero.title_line4': { value: '', kind: 'text', page: 'Home', section: 'Hero', label: 'Headline, line 3', max: 14, help: 'Leave empty for a two-line headline.' },
  'home.hero.subtitle': { value: 'Sales competitions, office visits and guest speakers with companies like Owner.com and Vantage Marketing. 15+ events a year, run by students.', kind: 'text', page: 'Home', section: 'Hero', label: 'Subtitle', max: 160, help: 'Name real companies and a real number.' },
  'home.hero.button_label': { value: 'Apply to join', kind: 'text', page: 'Home', section: 'Hero', label: 'Button text', max: 28 },
  'home.hero.button_href': { value: STORE_URL, kind: 'url', page: 'Home', section: 'Hero', label: 'Button link', max: 200 },
  'home.hero.events_label': { value: 'See events', kind: 'text', page: 'Home', section: 'Hero', label: 'Second button text', max: 28 },
  'home.hero.events_href': { value: '/events', kind: 'url', page: 'Home', section: 'Hero', label: 'Second button link', max: 200 },

  'home.hero.partner_label': { value: 'Partner with us', kind: 'text', page: 'Home', section: 'Hero', label: 'Company button text', max: 28 },
  'home.hero.partner_href': { value: '/contact-us?type=sponsor', kind: 'url', page: 'Home', section: 'Hero', label: 'Company button link', max: 200, help: 'The type parameter preselects the organization type on the contact form.' },

  // Home / Brands
  'home.brands.label': { value: 'Events and competitions with', kind: 'text', page: 'Home', section: 'Brands', label: 'Line above the logos', max: 48, help: 'The logos are the active partners on the Partners tab.' },

  // Home / What we run
  'home.formats.title_line1': { value: 'Real partners, real experiences', kind: 'text', page: 'Home', section: 'What we run', label: 'Heading', max: 40, help: 'One line on wide screens. The cards under it are edited on the page.' },

  // Home / Results
  'home.results.title_line1': { value: 'The record', kind: 'text', page: 'Home', section: 'Results', label: 'Heading', max: 24, help: 'The figures come from the Stats tab.' },
  'home.results.result': { value: '', kind: 'longtext', page: 'Home', section: 'Results', label: 'One named result', max: 160, help: 'A real outcome, e.g. which team won which competition. Leave empty to hide the line.' },
  'home.results.result_date': { value: '', kind: 'text', page: 'Home', section: 'Results', label: 'Result date', max: 24, help: 'e.g. Mar 2026.' },

  // Home / Audiences
  'home.students.title_line1': { value: 'Learn sales', kind: 'text', page: 'Home', section: 'Audiences', label: 'Students heading, line 1', max: 20 },
  'home.students.title_line2': { value: 'by doing it', kind: 'text', page: 'Home', section: 'Audiences', label: 'Students heading, line 2', max: 20 },
  'home.students.point1': { value: 'Compete in sales competitions judged by the companies themselves', kind: 'text', page: 'Home', section: 'Audiences', label: 'Students point 1', max: 90 },
  'home.students.point2': { value: 'Visit sales offices and meet the people who hire', kind: 'text', page: 'Home', section: 'Audiences', label: 'Students point 2', max: 90 },
  'home.students.point3': { value: '15+ events a year, some run with other Western clubs', kind: 'text', page: 'Home', section: 'Audiences', label: 'Students point 3', max: 90 },
  'home.students.note': { value: 'Membership is through the Western USC store.', kind: 'text', page: 'Home', section: 'Audiences', label: 'Students note', max: 90 },
  'home.companies.title_line1': { value: 'Experience our', kind: 'text', page: 'Home', section: 'Audiences', label: 'Companies heading, line 1', max: 20 },
  'home.companies.title_line2': { value: 'ambition', kind: 'text', page: 'Home', section: 'Audiences', label: 'Companies heading, line 2', max: 20 },
  'home.companies.point1': { value: 'Run or judge a sales competition on your own product', kind: 'text', page: 'Home', section: 'Audiences', label: 'Companies point 1', max: 90 },
  'home.companies.point2': { value: 'Host an office visit or send a speaker', kind: 'text', page: 'Home', section: 'Audiences', label: 'Companies point 2', max: 90 },
  'home.companies.point3': { value: 'Reach 150+ members and 1,200+ Instagram followers', kind: 'text', page: 'Home', section: 'Audiences', label: 'Companies point 3', max: 90 },
  'home.companies.note': { value: 'A partnerships exec replies to every message.', kind: 'text', page: 'Home', section: 'Audiences', label: 'Companies note', max: 90, help: 'State the real reply time once the club commits to one.' },

  // Home / About
  'home.about.title_line1': { value: 'A sales floor', kind: 'text', page: 'Home', section: 'About', label: 'Heading, line 1', max: 24 },
  'home.about.title_line2': { value: 'run by students', kind: 'text', page: 'Home', section: 'About', label: 'Heading, line 2', max: 24, help: 'Leave empty for a one-line heading.' },
  'home.about.body': { value: 'Western Sales Club is a student-run organization at Western University. We run workshops and events through the year, and connect members with people who sell for a living.', kind: 'longtext', page: 'Home', section: 'About', label: 'Body copy', max: 320 },
  'home.about.link_label': { value: 'Learn about the club', kind: 'text', page: 'Home', section: 'About', label: 'Link text', max: 28, help: 'The arrow is added automatically.' },
  'home.about.link_href': { value: '/about', kind: 'url', page: 'Home', section: 'About', label: 'Link address', max: 200 },

  // Home / Events
  'home.events.title_line1': { value: 'Next on', kind: 'text', page: 'Home', section: 'Events', label: 'Heading, line 1', max: 24 },
  'home.events.title_line2': { value: 'the calendar', kind: 'text', page: 'Home', section: 'Events', label: 'Heading, line 2', max: 24, help: 'Leave empty for a one-line heading.' },
  'home.events.empty': { value: 'No events on the calendar yet.', kind: 'text', page: 'Home', section: 'Events', label: 'Empty message', max: 60, help: 'Shown when nothing is published.' },
  'home.events.link_label': { value: 'See all events', kind: 'text', page: 'Home', section: 'Events', label: 'Link text', max: 28 },
  'home.events.link_href': { value: '/events', kind: 'url', page: 'Home', section: 'Events', label: 'Link address', max: 200 },

  // Home / Partners
  'home.partners.title_line1': { value: 'Who we work with', kind: 'text', page: 'Home', section: 'Partners', label: 'Heading', max: 24 },
  'home.partners.link_label': { value: 'See all partners', kind: 'text', page: 'Home', section: 'Partners', label: 'Link text', max: 28 },
  'home.partners.link_href': { value: '/sponsors', kind: 'url', page: 'Home', section: 'Partners', label: 'Link address', max: 200 },

  // Home / Contact
  'home.contact.title_line1': { value: 'Get in touch', kind: 'text', page: 'Home', section: 'Contact', label: 'Heading', max: 24 },
  'home.contact.body': { value: 'Reach out about partnerships, speaking at an event, or joining the club.', kind: 'longtext', page: 'Home', section: 'Contact', label: 'Body copy', max: 200 },
  'home.contact.link_label': { value: 'Contact us', kind: 'text', page: 'Home', section: 'Contact', label: 'Button text', max: 28 },

  // Home / Join
  'home.cta.title_line1': { value: 'Join', kind: 'text', page: 'Home', section: 'Join', label: 'Heading', max: 24 },
  'home.cta.subtitle': { value: 'Students join through the Western USC store. Businesses can contact us about partnering.', kind: 'text', page: 'Home', section: 'Join', label: 'Subtitle', max: 90 },
  'home.cta.button_label': { value: 'Apply to join', kind: 'text', page: 'Home', section: 'Join', label: 'Button text', max: 28 },
  'home.cta.button_href': { value: STORE_URL, kind: 'url', page: 'Home', section: 'Join', label: 'Button link', max: 200 },
  'home.cta.business_label': { value: 'Get in touch', kind: 'text', page: 'Home', section: 'Join', label: 'Business button text', max: 28 },
  'home.cta.business_href': { value: '/contact-us', kind: 'url', page: 'Home', section: 'Join', label: 'Business button link', max: 200 },

  // About / Header
  'about.header.title': { value: 'What Western Sales Club does.', kind: 'text', page: 'About', section: 'Header', label: 'Page title', max: 60 },

  // About / Story: four facts. The tone and the grid placement are layout,
  // so they stay in code.
  'about.story.fact1_title': { value: 'Workshops and events, all year', kind: 'text', page: 'About', section: 'Fact 1', label: 'Heading', max: 48 },
  'about.story.fact1_body1': { value: 'Western Sales Club runs workshops and events through the year for students who want experience in sales before they graduate.', kind: 'longtext', page: 'About', section: 'Fact 1', label: 'First paragraph', max: 220 },
  'about.story.fact1_body2': { value: 'Members learn from people who do the work, not only from a reading list.', kind: 'longtext', page: 'About', section: 'Fact 1', label: 'Second paragraph', max: 220, help: 'Leave empty to hide.' },

  'about.story.fact2_title': { value: 'A student exec team', kind: 'text', page: 'About', section: 'Fact 2', label: 'Heading', max: 48 },
  'about.story.fact2_body1': { value: 'Presidents, vice presidents, and assistant vice presidents run the club.', kind: 'longtext', page: 'About', section: 'Fact 2', label: 'First paragraph', max: 220 },
  'about.story.fact2_body2': { value: 'The roster is on the executive team page, and it turns over every year.', kind: 'longtext', page: 'About', section: 'Fact 2', label: 'Second paragraph', max: 220, help: 'Leave empty to hide.' },

  'about.story.fact3_title': { value: 'Five industry partners', kind: 'text', page: 'About', section: 'Fact 3', label: 'Heading', max: 48 },
  'about.story.fact3_body1': { value: 'Partners support the club and connect members with people working in the field.', kind: 'longtext', page: 'About', section: 'Fact 3', label: 'First paragraph', max: 220 },
  'about.story.fact3_body2': { value: 'They are listed on the partners page.', kind: 'longtext', page: 'About', section: 'Fact 3', label: 'Second paragraph', max: 220, help: 'Leave empty to hide.' },

  'about.story.fact4_title': { value: 'Membership runs through the USC store', kind: 'text', page: 'About', section: 'Fact 4', label: 'Heading', max: 48 },
  'about.story.fact4_body1': { value: 'The club runs 15 or more events a year for its members.', kind: 'longtext', page: 'About', section: 'Fact 4', label: 'First paragraph', max: 220 },
  'about.story.fact4_body2': { value: 'Questions go to sales.club@westernusc.ca.', kind: 'longtext', page: 'About', section: 'Fact 4', label: 'Second paragraph', max: 220, help: 'Leave empty to hide.' },

  // Team
  'team.header.title_line1': { value: 'Meet our', kind: 'text', page: 'Team', section: 'Header', label: 'Heading, line 1', max: 24 },
  'team.header.title_line2': { value: 'executive team', kind: 'text', page: 'Team', section: 'Header', label: 'Heading, line 2', max: 24, help: 'Leave empty for a one-line heading.' },
  'team.header.empty': { value: 'No executives are published yet.', kind: 'text', page: 'Team', section: 'Header', label: 'Empty message', max: 60 },

  // Events
  'events.header.title_line1': { value: 'What we run', kind: 'text', page: 'Events', section: 'Header', label: 'Heading', max: 24 },
  'events.header.empty': { value: 'No events are on the calendar yet.', kind: 'text', page: 'Events', section: 'Header', label: 'Empty message', max: 60 },
  'events.ledger.register_label': { value: 'Register', kind: 'text', page: 'Events', section: 'Ledger', label: 'Register button', max: 20, help: 'Shown on upcoming events that have a registration link.' },

  // Partners
  'partners.header.title': { value: 'The businesses that support Western Sales Club.', kind: 'text', page: 'Partners', section: 'Header', label: 'Page title', max: 60 },
  'partners.wall.label': { value: 'Partners', kind: 'text', page: 'Partners', section: 'Logo wall', label: 'Label', max: 24 },
  'partners.wall.empty': { value: 'No partners listed yet.', kind: 'text', page: 'Partners', section: 'Logo wall', label: 'Empty message', max: 60 },
  'sponsors.cta.partner_label': { value: 'Become a partner', kind: 'text', page: 'Partners', section: 'Join', label: 'Partner button text', max: 28 },
  'sponsors.cta.partner_href': { value: '/contact-us?type=sponsor', kind: 'url', page: 'Partners', section: 'Join', label: 'Partner button link', max: 200, help: 'The type parameter preselects the organization type on the contact form.' },

  // Contact
  'contact.header.title': { value: 'Get in touch.', kind: 'text', page: 'Contact', section: 'Header', label: 'Page title', max: 60 },
  'contact.header.body': { value: 'Questions about membership, events, or partnerships. You can also email sales.club@westernusc.ca.', kind: 'longtext', page: 'Contact', section: 'Header', label: 'Intro', max: 240 },
  'contact.form.submit_label': { value: 'Send message', kind: 'text', page: 'Contact', section: 'Form', label: 'Send button', max: 28 },
  'contact.form.sent_title': { value: 'Message sent', kind: 'text', page: 'Contact', section: 'Form', label: 'Sent heading', max: 40 },
  'contact.form.sent_body': { value: 'It went to sales.club@westernusc.ca.', kind: 'text', page: 'Contact', section: 'Form', label: 'Sent message', max: 90 },
  'contact.cta.form_href': { value: '#contact-form', kind: 'url', page: 'Contact', section: 'Join', label: 'Business button link', max: 200, help: 'Points to the form on this page.' },

  // Footer
  'footer.contact.email': { value: 'sales.club@westernusc.ca', kind: 'email', page: 'Footer', section: 'Contact', label: 'Email address', max: 80 },
  'footer.social.instagram_url': { value: 'https://www.instagram.com/westernsalesclub/', kind: 'url', page: 'Footer', section: 'Social', label: 'Instagram link', max: 200, help: 'Leave empty to hide the icon.' },
  'footer.social.linkedin_url': { value: 'https://www.linkedin.com/company/western-sales-club/', kind: 'url', page: 'Footer', section: 'Social', label: 'LinkedIn link', max: 200, help: 'Leave empty to hide the icon.' },
} as const satisfies Record<string, ContentEntry>;

export type SiteContentKey = keyof typeof SITE_CONTENT;

/** Fallback value per key. */
export const SITE_CONTENT_DEFAULTS = Object.fromEntries(
  Object.entries(SITE_CONTENT).map(([key, entry]) => [key, entry.value])
) as Record<SiteContentKey, string>;
