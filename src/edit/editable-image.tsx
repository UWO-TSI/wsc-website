'use client';

import type { ComponentProps } from 'react';
import RevealImage from '@/components/ui/reveal-image';
import { useSiteContent } from '@/providers/site-content-provider';
import type { ImageSlotKey } from '@/lib/image-slots';

/*
  A photo slot from site_images.

  View mode: RevealImage with the slot's resolved src and alt. In edit mode
  the frame shows Replace photo, or Add photo when empty, and a chosen file
  fills the same frame before Publish.
*/

export type EditableImageProps = { slot: ImageSlotKey } & Omit<
  ComponentProps<typeof RevealImage>,
  'src' | 'alt'
>;

export default function EditableImage({ slot, ...props }: EditableImageProps) {
  const { image } = useSiteContent();
  return <RevealImage {...image(slot)} {...props} />;
}
