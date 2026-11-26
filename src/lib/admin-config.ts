export const LIMITS = {
  MAX_IMAGE_SIZE_MB: 2,
  MAX_HEADSHOT_DIMENSION: 3000,
  MAX_LOGO_DIMENSION: 2500,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  /*
    The most items each edited list holds. The database has no cap, so
    edit mode enforces these: at the cap the Add tile is disabled and says
    why. They keep the headshot and logo buckets within the storage budget
    and the public layouts within what they were designed for (the counted
    figures sit three to a row).
  */
  MAX_EVENTS: 50,
  MAX_SPONSORS: 20,
  MAX_EXECUTIVES: 30,
  MAX_SITE_STATS: 6,
  MAX_EVENT_FORMATS: 12,
};
