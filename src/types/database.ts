export interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  /** Optional registration link, http or https. */
  register_url?: string | null;
  published: boolean;
  display_order: number;
}

export interface Sponsor {
  id: string;
  name: string;
  description?: string;
  link?: string;
  logo_path?: string;
  active: boolean;
  display_order: number;
}

export interface Executive {
  id: string;
  name: string;
  /**
   * Legacy free-text title. Shown only while area_id is null; dropped once
   * the area backfill has been reviewed.
   */
  title: string;
  /** FK to exec_groups.slug. No longer a fixed union: roles are data. */
  group: string;
  /** FK to exec_areas.id. Null means the title is the role alone. */
  area_id?: string | null;
  headshot_path?: string;
  visible: boolean;
  display_order: number;
}

/** Executive role tiers. Replaced the old CHECK constraint on executives.group. */
export interface ExecGroup {
  id: string;
  slug: string;
  /** Section header on the team page, e.g. 'Vice Presidents'. */
  label: string;
  /** Admin dropdown option, e.g. 'Vice President'. */
  singular_label: string;
  /** Role in a built title, e.g. 'VP' in "VP, Marketing". */
  short_label: string;
  visible: boolean;
  display_order: number;
}

/** The portfolio an executive leads, e.g. 'Marketing'. Unique by lower(name). */
export interface ExecArea {
  id: string;
  name: string;
  display_order: number;
}

export interface SiteStat {
  id: string;
  /** Counted up from zero on screen. */
  value: number;
  /** Static, e.g. "+". */
  suffix: string | null;
  label: string;
  visible: boolean;
  display_order: number;
}

/** One card in the home page row of event formats. */
export interface EventFormat {
  id: string;
  title: string;
  /** One sentence on what happens there. Null hides the line. */
  body: string | null;
  /** Who ran it, e.g. "With Owner.com". Null hides the line. */
  meta: string | null;
  /** Object name in the site-images bucket, or null for the empty frame. */
  image_path: string | null;
  visible: boolean;
  display_order: number;
}

/** Which uploaded file fills a design photo slot. No row means empty. */
export interface SiteImage {
  slot: string;
  object_name: string;
  alt: string;
  updated_at?: string;
}

export interface GalleryPhoto {
  id: string;
  image_path?: string;
  alt?: string;
  caption?: string;
  visible: boolean;
  display_order: number;
}

/** A row of the admin roster. Readable only by an admin at aal2. */
export interface AdminRow {
  user_id: string;
  email: string | null;
  note: string | null;
  added_at: string | null;
  is_owner: boolean;
  invited_by: string | null;
}

/** A row from the admin_last_sign_ins() RPC. Callable only by an admin at aal2. */
export interface AdminLastSignIn {
  user_id: string;
  email: string | null;
  /** Null when the account has never completed a sign-in. */
  last_sign_in_at: string | null;
  /** False until the person has finished two-factor setup. */
  has_two_factor: boolean;
}

export interface AdminInvite {
  id: string;
  email: string;
  note: string | null;
  invited_by: string | null;
  created_at: string;
  /** An unclaimed invite stops working 14 days after it is created. */
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
}

export interface AdminAuditEntry {
  id: number;
  actor_email: string | null;
  action: 'invited' | 'invite_revoked' | 'invite_claimed' | 'removed';
  target_email: string | null;
  detail: string | null;
  created_at: string;
}

export interface QueryError {
  category: 'auth' | 'forbidden' | 'network' | 'paused' | 'conflict' | 'server' | 'unknown';
  message: string;
  retryable: boolean;
}

export interface QueryResult<T> {
  data: T[];
  loading: boolean;
  error: QueryError | null;
  refetch: () => Promise<void>;
}
