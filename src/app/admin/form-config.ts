import type { FieldFormat } from '@/lib/normalize';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'time' | 'number' | 'select' | 'image';
  required?: boolean;
  placeholder?: string;
  showInTable?: boolean;
  options?: { value: string; label: string }[];
  /**
   * Fill `options` at runtime from a table instead of hardcoding them.
   * Executive roles live in `exec_groups`, so the dropdown has to follow
   * whatever the club has created.
   */
  optionsSource?: 'exec_groups';
  defaultValue?: string;
  help?: string;
  /**
   * Ceiling, shown as a live counter and enforced by the database with the
   * same number (migration 7). Keep the two in step.
   */
  maxLength?: number;
  /** Bounds for a number field. */
  min?: number;
  max?: number;
  /** How the value is normalised on blur and checked before submit. */
  format?: FieldFormat;
}

export const FORM_FIELDS: Record<string, FormField[]> = {
  events: [
    { name: 'title',       label: 'Title',       type: 'text',     required: true,  showInTable: true, maxLength: 80 },
    { name: 'date',        label: 'Date',        type: 'date',     required: true,  showInTable: true },
    { name: 'time',        label: 'Start time',  type: 'time',     required: false, showInTable: true, format: 'time', help: 'Optional. Shown on the site as, for example, 6:30 PM.' },
    { name: 'location',    label: 'Location',    type: 'text',     required: false, showInTable: true, maxLength: 60 },
    { name: 'description', label: 'Description', type: 'textarea', required: false, showInTable: false, maxLength: 800 },
  ],

  sponsors: [
    { name: 'name',        label: 'Name',        type: 'text',     required: true,  showInTable: true, maxLength: 40 },
    { name: 'logo_path',   label: 'Logo',        type: 'image',    required: false, showInTable: true, help: 'PNG with a transparent background works best. It is shown on a dark ground and never cropped.' },
    { name: 'description', label: 'Description', type: 'textarea', required: false, showInTable: false, maxLength: 500 },
    { name: 'link',        label: 'Website',     type: 'text',     required: false, showInTable: true, placeholder: 'https://', maxLength: 200, format: 'https' },
  ],

  executives: [
    { name: 'name',  label: 'Name',  type: 'text', required: true, showInTable: true, maxLength: 40 },
    { name: 'title', label: 'Title', type: 'text', required: true, showInTable: true, maxLength: 40, placeholder: 'e.g. VP Events', help: 'Free text, shown under the name.' },
    {
      name: 'year_of_study',
      label: 'Year of study',
      type: 'number',
      required: false,
      showInTable: true,
      min: 1,
      max: 6,
      help: 'Optional, 1 to 6.',
    },
    {
      name: 'group',
      label: 'Role',
      type: 'select',
      required: true,
      showInTable: true,
      optionsSource: 'exec_groups',
      help: 'Sets where they sit in the roster. Manage roles under the Roles tab.',
    },
    { name: 'headshot_path', label: 'Headshot', type: 'image', required: false, showInTable: true, help: 'Shown in a circle, so keep the face centred.' },
  ],

  gallery_photos: [
    { name: 'image_path', label: 'Photo',    type: 'image', required: false, showInTable: true },
    { name: 'alt',        label: 'Alt text', type: 'text',  required: false, showInTable: true, placeholder: 'Describe the image', maxLength: 120 },
    { name: 'caption',    label: 'Caption',  type: 'text',  required: false, showInTable: true, placeholder: 'Optional caption', maxLength: 100 },
  ],

  site_stats: [
    { name: 'value',  label: 'Figure', type: 'number', required: true,  showInTable: true, min: 0, max: 99999, help: 'Counts up from zero when it scrolls into view.' },
    { name: 'suffix', label: 'Suffix', type: 'text',   required: false, showInTable: true, maxLength: 2, placeholder: '+', help: 'Optional, e.g. + or %.' },
    { name: 'label',  label: 'Label',  type: 'text',   required: true,  showInTable: true, maxLength: 24, placeholder: 'e.g. Members' },
  ],

  exec_groups: [
    {
      name: 'singular_label',
      label: 'Role name',
      type: 'text',
      required: true,
      showInTable: true,
      maxLength: 40,
      placeholder: 'e.g. Director',
      help: 'Shown in the dropdown when adding a team member.',
    },
    {
      name: 'label',
      label: 'Plural',
      type: 'text',
      required: true,
      showInTable: true,
      maxLength: 40,
      placeholder: 'e.g. Directors',
    },
  ],
};
