'use client';

import type { ComponentProps } from 'react';
import RevealImage from '@/components/ui/reveal-image';
import { useSiteContent } from '@/providers/site-content-provider';
import type { ImageSlotKey } from '@/lib/image-slots';
import { EditBranch, useEditBranch } from '@/edit/edit-mode';

/*
  A photo slot from site_images.

  View mode and Preview: RevealImage with the slot's resolved src and alt.
  While editing, the engine's PhotoSlot renders instead: the frame shows
  Replace photo, or Add photo when empty, and a chosen file fills the same
  frame before Publish.
*/

export type EditableImageProps = { slot: ImageSlotKey } & Omit<
  ComponentProps<typeof RevealImage>,
  'src' | 'alt'
>;

export default function EditableImage(props: EditableImageProps) {
  const { slot, ...rest } = props;
  const { image } = useSiteContent();
  if (useEditBranch()) return <EditBranch name="Image" props={props} />;
  return <RevealImage {...image(slot)} {...rest} />;
}
