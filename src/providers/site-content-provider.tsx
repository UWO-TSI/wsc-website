'use client';

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import { getPublicUrl } from '@/lib/supabase/storage';
import { SITE_CONTENT_DEFAULTS, type SiteContentKey } from '@/lib/site-content-defaults';
import { IMAGE_SLOTS, SITE_IMAGES_BUCKET, type ImageSlotKey } from '@/lib/image-slots';
import type { SiteImage } from '@/types/database';

interface SiteContentRow {
  key: string;
  value: string;
}

export interface SlotImage {
  /**
   * Public URL; null for an empty slot; undefined until site_images has
   * answered, so a frame keeps loading rather than revealing empty and
   * then popping its photo in.
   */
  src: string | null | undefined;
  alt: string;
}

interface SiteContentValue {
  /**
   * Resolve an editable string.
   *
   * A row that EXISTS is returned verbatim, including when it is empty.
   * That is what makes the "leave empty to hide" fields work. The
   * compiled-in default is used only when the key is absent entirely,
   * which is the shape of a failed or pending fetch, so an outage shows
   * real copy rather than a blank page.
   */
  text: (key: SiteContentKey) => string;
  /**
   * Resolve a photo slot. An unfilled slot has `src: null`, and
   * RevealImage renders a still placeholder at the frame's size, so the
   * page never shifts whether or not a photo exists.
   */
  image: (slot: ImageSlotKey) => SlotImage;
  /** False while the first fetch is in flight. */
  ready: boolean;
}

const SiteContentContext = createContext<SiteContentValue | null>(null);

const emptySlot = (slot: ImageSlotKey): SlotImage => ({ src: null, alt: IMAGE_SLOTS[slot].alt });

/**
 * Fetches `site_content` and `site_images` once for the whole public site.
 *
 * One query each at the layout level rather than one per component: both
 * tables are a few dozen tiny rows, and every page needs some of them.
 */
export function SiteContentProvider({ children }: { children: ReactNode }) {
  const { data: rows, loading: textLoading } = useSupabaseQuery<SiteContentRow>('site_content', {
    select: 'key,value',
    orderBy: 'key',
  });
  const { data: images, loading: imagesLoading } = useSupabaseQuery<SiteImage>('site_images', {
    select: 'slot,object_name,alt',
    orderBy: 'slot',
  });

  const value = useMemo<SiteContentValue>(() => {
    const text = new Map<string, string>();
    for (const row of rows) {
      if (row?.key != null) text.set(row.key, row.value ?? '');
    }

    const slots = new Map<string, SiteImage>();
    for (const row of images) {
      if (row?.slot) slots.set(row.slot, row);
    }

    return {
      text: (key) => text.get(key) ?? SITE_CONTENT_DEFAULTS[key],
      image: (slot) => {
        if (imagesLoading) return { src: undefined, alt: IMAGE_SLOTS[slot].alt };
        const row = slots.get(slot);
        if (!row) return emptySlot(slot);
        return {
          src: getPublicUrl(SITE_IMAGES_BUCKET, row.object_name),
          alt: row.alt || IMAGE_SLOTS[slot].alt,
        };
      },
      ready: !textLoading && !imagesLoading,
    };
  }, [rows, images, textLoading, imagesLoading]);

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

/**
 * Editable site copy and photos.
 *
 * Usable outside the provider (the admin tree does not mount it), in which
 * case every string is its compiled-in default and every slot is empty.
 */
export function useSiteContent(): SiteContentValue {
  const ctx = useContext(SiteContentContext);
  if (ctx) return ctx;

  return {
    text: (key) => SITE_CONTENT_DEFAULTS[key],
    image: emptySlot,
    ready: false,
  };
}
