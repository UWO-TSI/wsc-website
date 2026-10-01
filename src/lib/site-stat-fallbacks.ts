import type { SiteStat } from '@/types/database';

/**
 * Shipped stats, mirroring the seed in
 * `supabase/migrations/20260929000002_site_content_seed.sql`.
 *
 * Rendered while the `site_stats` query is in flight and if it fails, so
 * the about slab never appears half-built. Once the query returns, the
 * database wins outright, including when the club has hidden every stat.
 */
export const SITE_STAT_FALLBACKS: SiteStat[] = [
  { id: 'fallback-members', value: 150, suffix: '+', label: 'Members', visible: true, display_order: 10 },
  { id: 'fallback-events', value: 10, suffix: '+', label: 'Annual events', visible: true, display_order: 20 },
  { id: 'fallback-partners', value: 5, suffix: '+', label: 'Industry partners', visible: true, display_order: 30 },
];
