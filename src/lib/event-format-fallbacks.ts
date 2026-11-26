import type { EventFormat } from '@/types/database';

/**
 * Shipped format cards, mirroring the seed in
 * `supabase/migrations/20261125000001_event_formats.sql`.
 *
 * Rendered while the `event_formats` query is in flight and if it fails,
 * so the home page's card row never shows empty. They carry no photo: the
 * frames show their loading sweep while the query is in flight, and the
 * empty frame if it fails. Once the query returns, the database wins
 * outright, including when the club has hidden every card.
 */
export const EVENT_FORMAT_FALLBACKS: EventFormat[] = [
  {
    id: 'fallback-competitions',
    title: 'Sales competitions',
    body: 'Teams pitch to a real company, and people from that company judge the round.',
    meta: null,
    image_path: null,
    visible: true,
    display_order: 10,
  },
  {
    id: 'fallback-visits',
    title: 'Office visits',
    body: 'Members spend an afternoon at a company’s sales office and meet the team.',
    meta: null,
    image_path: null,
    visible: true,
    display_order: 20,
  },
  {
    id: 'fallback-speakers',
    title: 'Guest speakers',
    body: 'Sales leaders explain how they got their job and how they hire.',
    meta: null,
    image_path: null,
    visible: true,
    display_order: 30,
  },
  {
    id: 'fallback-socials',
    title: 'Social events',
    body: 'Members meet each other and students from other clubs at Western.',
    meta: null,
    image_path: null,
    visible: true,
    display_order: 40,
  },
];
