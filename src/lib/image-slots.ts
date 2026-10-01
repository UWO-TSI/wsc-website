/**
 * Every swappable photo on the public site.
 *
 * A slot is a position in the design, named `page.section.imageN`. The
 * database checks the same shape (site_images.slot), and stores only which
 * uploaded file fills which slot. The frame, the alt text default and the
 * resolution floor live here, next to the layout they describe.
 *
 * Adding a slot is one entry here plus `image(slot)` in the component. No
 * migration: the row appears the first time an admin fills it.
 *
 * `aspect` is the frame's ratio as width / height, and must match the
 * component's aspect class. It drives the admin's crop preview, which is
 * the same frame with the same object-fit: cover, so the admin sees exactly
 * what will be cut off before saving.
 *
 * `minWidth` is the widest the frame renders, at 2x, read off the
 * component's `sizes`. Below it the photo looks soft, so the uploader
 * warns. Below half of it the uploader refuses.
 *
 * Brand marks are not slots. The shark is a CSS mask that needs an alpha
 * silhouette, and the Tethos mark and social icons are identity, so all of
 * them stay in code.
 */

export interface ImageSlot {
  page: 'Home' | 'About' | 'Events';
  section: string;
  label: string;
  /** Frame width / height. */
  aspect: number;
  /** The aspect class the component uses, for the admin preview. */
  aspectClass: string;
  minWidth: number;
  alt: string;
  /** Shown only from a breakpoint up, noted in the admin. */
  note?: string;
}

export const IMAGE_SLOTS = {
  'home.hero.image1': {
    page: 'Home', section: 'Hero', label: 'Banner under the headline',
    aspect: 21 / 9, aspectClass: 'aspect-[21/9]', minWidth: 1920,
    alt: 'University College tower on Western University campus in autumn',
  },
  'home.about.image1': {
    page: 'Home', section: 'About', label: 'Strip, left',
    aspect: 4 / 3, aspectClass: 'aspect-[4/3]', minWidth: 560,
    alt: 'Western Sales Club members at a sales competition',
  },
  'home.about.image2': {
    page: 'Home', section: 'About', label: 'Strip, middle',
    aspect: 4 / 3, aspectClass: 'aspect-[4/3]', minWidth: 560,
    alt: 'Western Sales Club members at a club event',
  },
  'home.about.image3': {
    page: 'Home', section: 'About', label: 'Strip, right',
    aspect: 4 / 3, aspectClass: 'aspect-[4/3]', minWidth: 560,
    alt: 'Western Sales Club members presenting',
  },
  'home.events.image1': {
    page: 'Home', section: 'Events', label: 'Portrait beside the list',
    aspect: 3 / 4, aspectClass: 'aspect-[3/4]', minWidth: 840,
    alt: 'Western Sales Club members at a club event',
  },
  'home.cta.image1': {
    page: 'Home', section: 'Join', label: 'Join band',
    aspect: 4 / 3, aspectClass: 'aspect-[4/3]', minWidth: 1040,
    alt: 'Western Sales Club members together at a club event',
  },
  'about.story.image1': {
    page: 'About', section: 'Story', label: 'Top right',
    aspect: 3 / 2, aspectClass: 'aspect-[3/2]', minWidth: 1400,
    alt: 'Western Sales Club members holding a competition prize cheque',
  },
  'about.story.image2': {
    page: 'About', section: 'Story', label: 'Bottom left',
    aspect: 3 / 2, aspectClass: 'aspect-[3/2]', minWidth: 1400,
    alt: 'Western Sales Club members standing with the club banner',
  },
  'events.strip.image1': {
    page: 'Events', section: 'Strip', label: 'Photo 1',
    aspect: 4 / 3, aspectClass: 'aspect-[4/3]', minWidth: 640,
    alt: 'Members at a Western Sales Club workshop',
  },
  'events.strip.image2': {
    page: 'Events', section: 'Strip', label: 'Photo 2',
    aspect: 4 / 3, aspectClass: 'aspect-[4/3]', minWidth: 640,
    alt: 'Western Sales Club members at an event',
  },
  'events.strip.image3': {
    page: 'Events', section: 'Strip', label: 'Photo 3',
    aspect: 4 / 3, aspectClass: 'aspect-[4/3]', minWidth: 640,
    alt: 'Western Sales Club members at an event',
  },
  'events.strip.image4': {
    page: 'Events', section: 'Strip', label: 'Photo 4',
    aspect: 4 / 3, aspectClass: 'aspect-[4/3]', minWidth: 640,
    alt: 'Western Sales Club members in a workshop discussion',
    note: 'Only shown on screens 850px and wider.',
  },
  'events.strip.image5': {
    page: 'Events', section: 'Strip', label: 'Photo 5',
    aspect: 4 / 3, aspectClass: 'aspect-[4/3]', minWidth: 640,
    alt: 'Western Sales Club members presenting',
    note: 'Only shown on screens 850px and wider.',
  },
} as const satisfies Record<string, ImageSlot>;

export type ImageSlotKey = keyof typeof IMAGE_SLOTS;

export const IMAGE_SLOT_KEYS = Object.keys(IMAGE_SLOTS) as ImageSlotKey[];

export const SITE_IMAGES_BUCKET = 'site-images';
