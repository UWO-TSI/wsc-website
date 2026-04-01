export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'image';
  required?: boolean;
  placeholder?: string;
  showInTable?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: string;
}

export const FORM_FIELDS: Record<string, FormField[]> = {
  events: [
    { name: 'title',       label: 'Title',       type: 'text',     required: true,  showInTable: true },
    { name: 'date',        label: 'Date',        type: 'date',     required: true,  showInTable: true },
    { name: 'time',        label: 'Time',        type: 'text',     required: false, placeholder: 'e.g. 6:00 PM', showInTable: true },
    { name: 'location',    label: 'Location',    type: 'text',     required: false, showInTable: true },
    { name: 'description', label: 'Description', type: 'textarea', required: false, showInTable: false },
  ],

  sponsors: [
    { name: 'name',        label: 'Name',        type: 'text',     required: true,  showInTable: true },
    { name: 'description', label: 'Description', type: 'textarea', required: false, showInTable: false },
    { name: 'link',        label: 'Website URL', type: 'text',     required: false, placeholder: 'https://...', showInTable: true },
    { name: 'logo_path',   label: 'Logo',        type: 'image',    required: false, showInTable: true },
  ],

  executives: [
    { name: 'name',  label: 'Name',  type: 'text',   required: true,  showInTable: true },
    { name: 'title', label: 'Title', type: 'text',   required: true,  showInTable: true, placeholder: 'e.g. Co-President' },
    {
      name: 'group',
      label: 'Group',
      type: 'select',
      required: true,
      showInTable: true,
      options: [
        { value: 'president',                label: 'President' },
        { value: 'vice_president',           label: 'Vice President' },
        { value: 'assistant_vice_president', label: 'Assistant Vice President' },
      ],
    },
    { name: 'headshot_path', label: 'Headshot', type: 'image', required: false, showInTable: true },
  ],

  gallery_photos: [
    { name: 'image_path', label: 'Photo',    type: 'image', required: false, showInTable: true },
    { name: 'alt',        label: 'Alt Text', type: 'text',  required: false, showInTable: true, placeholder: 'Describe the image' },
    { name: 'caption',    label: 'Caption',  type: 'text',  required: false, showInTable: true, placeholder: 'Optional caption' },
  ],
};
