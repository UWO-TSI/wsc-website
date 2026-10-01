export const LIMITS = {
  MAX_IMAGE_SIZE_MB: 2,
  MAX_IMAGE_WIDTH: 1920,
  MAX_IMAGE_HEIGHT: 1080,
  MAX_HEADSHOT_DIMENSION: 3000,
  MAX_LOGO_DIMENSION: 2500,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  MAX_EVENTS: 50,
  MAX_SPONSORS: 20,
  MAX_EXECUTIVES: 30,
  MAX_GALLERY_PHOTOS: 40,
  MAX_SITE_STATS: 6,
  MAX_EXEC_GROUPS: 10,
};

export interface ContentConfig {
  table: string;
  bucket?: string;
  pathColumn?: string;
  visibilityColumn: string;
  displayName: string;
  /** Singular noun for the "Add X" button, when trimming an "s" is wrong. */
  singularName?: string;
  limit: number;
  /** Up and Down buttons on display_order. Default true. */
  orderable?: boolean;
  /** Fixed sort for a table that is not orderable. */
  sort?: { column: string; ascending: boolean; thenBy?: string };
}

export const CONTENT_CONFIG: Record<string, ContentConfig> = {
  events: {
    table: 'events',
    visibilityColumn: 'published',
    displayName: 'Events',
    singularName: 'Event',
    limit: LIMITS.MAX_EVENTS,
    // Events are ordered by their date, newest first, same as the site.
    // Manual ordering would only be overridden by the date anyway.
    orderable: false,
    sort: { column: 'date', ascending: false, thenBy: 'created_at' },
  },
  sponsors: {
    table: 'sponsors',
    bucket: 'sponsor-logos',
    pathColumn: 'logo_path',
    visibilityColumn: 'active',
    displayName: 'Sponsors',
    singularName: 'Sponsor',
    limit: LIMITS.MAX_SPONSORS,
  },
  executives: {
    table: 'executives',
    bucket: 'headshots',
    pathColumn: 'headshot_path',
    visibilityColumn: 'visible',
    displayName: 'Executives',
    singularName: 'Executive',
    limit: LIMITS.MAX_EXECUTIVES,
    // Was false, which left the club unable to order its own team even
    // though executives.display_order has always existed.
    orderable: true,
  },
  gallery_photos: {
    table: 'gallery_photos',
    bucket: 'gallery',
    pathColumn: 'image_path',
    visibilityColumn: 'visible',
    displayName: 'Gallery Photos',
    singularName: 'Photo',
    limit: LIMITS.MAX_GALLERY_PHOTOS,
  },
  site_stats: {
    table: 'site_stats',
    visibilityColumn: 'visible',
    displayName: 'Statistics',
    singularName: 'Statistic',
    limit: LIMITS.MAX_SITE_STATS,
  },
  exec_groups: {
    table: 'exec_groups',
    visibilityColumn: 'visible',
    displayName: 'Roles',
    singularName: 'Role',
    limit: LIMITS.MAX_EXEC_GROUPS,
  },
};
