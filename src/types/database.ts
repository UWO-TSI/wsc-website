export interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
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
  title: string;
  /** FK to exec_groups.slug. No longer a fixed union: roles are data. */
  group: string;
  headshot_path?: string;
  /** Optional, 1 to 6. */
  year_of_study?: number | null;
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
  visible: boolean;
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
  /** NULL only for the owner, who never expires. */
  expires_at: string | null;
  is_owner: boolean;
  invited_by: string | null;
}

export interface AdminInvite {
  id: string;
  email: string;
  note: string | null;
  invited_by: string | null;
  created_at: string;
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
