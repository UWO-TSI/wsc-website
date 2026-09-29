'use client';

import { useMemo } from 'react';
import { useSupabaseQuery } from '@/lib/supabase/hooks/use-supabase-query';
import { getPublicUrl } from '@/lib/supabase/storage';
import Eyebrow from '@/components/ui/eyebrow';
import { useReveal } from '@/lib/reveal';
import StorySection from '@/components/about/story-section';
import BentoGallery from '@/components/about/bento-gallery';
import type { GalleryPhoto } from '@/types/database';

/*
  A page is a stack of slabs on --page, inset by the gutter. The title block
  sits bare on --page (design-system/README.md, Layout). StorySection brings
  its own asymmetric grid and its own slabs, so it is not wrapped in one here.
*/
export default function AboutPage() {
  const {
    data: photos,
    loading,
    error,
    refetch,
  } = useSupabaseQuery<GalleryPhoto>('gallery_photos');
  const titleRef = useReveal<HTMLDivElement>();

  const galleryItems = useMemo(
    () =>
      photos.map((photo) => ({
        id: photo.id,
        src: getPublicUrl('gallery', photo.image_path),
        alt: photo.alt,
        caption: photo.caption,
      })),
    [photos]
  );

  return (
    <main
      style={{
        paddingInline: 'var(--gut)',
        paddingTop: 'clamp(6rem, 10vw, 9rem)',
        paddingBottom: 'clamp(4rem, 8vw, 7rem)',
      }}
    >
      <div ref={titleRef} className="mb-10">
        <Eyebrow className="mb-3 block">About</Eyebrow>
        <h1 className="title">
          <span className="ln">
            <i>What Western Sales Club does.</i>
          </span>
        </h1>
      </div>

      <div className="stack">
        <StorySection />

        <BentoGallery
          photos={galleryItems}
          loading={loading}
          error={error}
          onRetry={refetch}
        />
      </div>
    </main>
  );
}
