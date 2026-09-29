'use client';

import { useRef, useState } from 'react';
import RevealImage from '@/components/ui/reveal-image';
import * as Dialog from '@radix-ui/react-dialog';
import { useReveal } from '@/lib/reveal';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';
import Skeleton from '@/components/ui/skeleton';
import Eyebrow from '@/components/ui/eyebrow';
import type { QueryError } from '@/types/database';

interface GalleryItem {
  id: string;
  src: string | null;
  alt?: string;
  caption?: string;
}

interface BentoGalleryProps {
  photos: GalleryItem[];
  loading: boolean;
  error: QueryError | null;
  onRetry?: () => void;
}

/*
  Three columns, the repo's existing span pattern: large 2x2, tall 1x2, wide
  2x1, then three squares (design-system/floor.html, .bc rules). Cells are
  --r-sm with overflow hidden and run Sequence 9, Clip Reveal, staggered 60ms
  in reading order via the --i custom property useReveal's clip-cell/clip-
  inner classes read.
*/
const cellSpan = ['col-span-2 row-span-2', 'row-span-2', 'col-span-2', '', '', ''];

function spanFor(index: number) {
  return cellSpan[index % cellSpan.length];
}

export default function BentoGallery({ photos, loading, error, onRetry }: BentoGalleryProps) {
  const gridRef = useReveal<HTMLDivElement>();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const lastOpenedIndex = useRef<number | null>(null);

  const openPhoto = photos.filter((p) => p.src);
  const selected = openIndex !== null ? openPhoto[openIndex] ?? null : null;

  const open = (index: number) => {
    lastOpenedIndex.current = index;
    setOpenIndex(index);
  };

  /* Same three column grid and the same span pattern as the real bento, so
     the bed keeps its height and the page below it does not move when the
     photos arrive. */
  const skeleton = (
    <div className="bg-sunken rounded-xl p-3 sm:p-4">
      <div
        className="grid grid-cols-3 gap-2"
        style={{ gridAutoRows: 'clamp(90px, 18vw, 160px)' }}
      >
        {cellSpan.map((span, i) => (
          <Skeleton key={i} index={i} className={`h-full w-full rounded-sm ${span}`} />
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <Eyebrow className="mb-6 block">Gallery</Eyebrow>

      <AsyncStateWrapper
        loading={loading}
        error={error}
        data={photos}
        onRetry={onRetry}
        emptyMessage="No photos yet."
        skeleton={skeleton}
      >
        <div className="bg-sunken rounded-xl p-3 sm:p-4">
          <div
            ref={gridRef}
            className="grid grid-cols-3 gap-2"
            style={{ gridAutoRows: 'clamp(90px, 18vw, 160px)' }}
          >
            {openPhoto.map((photo, index) => {
              const altText = photo.alt ?? photo.caption ?? '';
              return (
                <button
                  key={photo.id}
                  ref={(el) => {
                    triggerRefs.current[index] = el;
                  }}
                  type="button"
                  onClick={() => open(index)}
                  className={`group relative overflow-hidden rounded-sm ${spanFor(index)}`}
                  aria-label={photo.caption ? `Open ${photo.caption}` : 'Open gallery photo'}
                >
                  {/*
                    Each cell now owns its own Clip Reveal and waits on its own
                    bytes, rather than the whole grid clipping in on scroll
                    while the photos were still decoding behind it.
                  */}
                  <span className="absolute inset-0">
                    <RevealImage
                      src={photo.src as string}
                      alt={altText}
                      sizes="(max-width: 768px) 33vw, 25vw"
                      className="h-full w-full"
                      index={index}
                    />
                  </span>

                  <span
                    aria-hidden="true"
                    className="bg-inverse/60 pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[var(--d-move)] ease-enter group-hover:opacity-100 group-focus-visible:opacity-100"
                  />

                  {photo.caption && (
                    <span
                      aria-hidden="true"
                      className="text-on-inverse pointer-events-none absolute inset-x-2 bottom-2 translate-y-2 text-left opacity-0 transition-all duration-[var(--d-move)] ease-enter group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
                      style={{
                        fontFamily: 'var(--f-data)',
                        fontSize: '10px',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {photo.caption}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Dialog.Root
          open={selected !== null}
          onOpenChange={(next) => {
            if (!next) setOpenIndex(null);
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay
              className="bg-inverse/90 fixed inset-0 transition-opacity duration-[var(--d-move)] ease-enter data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
              style={{ zIndex: 'var(--layer-overlay)' }}
            />
            <Dialog.Content
              className="shadow-3 fixed left-1/2 top-1/2 w-[min(760px,90vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg transition-[opacity,transform] duration-[var(--d-move)] ease-enter data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100"
              style={{ zIndex: 'var(--layer-overlay)' }}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                const index = lastOpenedIndex.current;
                if (index !== null) triggerRefs.current[index]?.focus();
              }}
            >
              <Dialog.Title asChild>
                <span className="sr-only">{selected?.caption || 'Gallery photo'}</span>
              </Dialog.Title>
              <Dialog.Description asChild>
                <span className="sr-only">Enlarged view. Press Escape to close.</span>
              </Dialog.Description>

              {selected?.src && (
                <div className="relative aspect-video w-full">
                  {/* The full-size file is a fresh request even when the
                      thumbnail is cached, so the lightbox skeletons too rather
                      than opening onto an empty frame. */}
                  <RevealImage
                    src={selected.src}
                    alt={selected.alt ?? selected.caption ?? ''}
                    sizes="90vw"
                    className="h-full w-full"
                    fit="contain"
                    sequence="fade"
                    priority
                  />
                  {selected.caption && (
                    <span
                      className="text-on-inverse absolute inset-x-0 bottom-0"
                      style={{
                        fontFamily: 'var(--f-data)',
                        fontSize: '12px',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        textAlign: 'center',
                        padding: '26px 16px 14px',
                        background:
                          'linear-gradient(to top, color-mix(in srgb, var(--inverse) 70%, transparent), transparent)',
                      }}
                    >
                      {selected.caption}
                    </span>
                  )}
                </div>
              )}

              <Dialog.Close
                className="text-on-inverse bg-inverse/40 absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-lg"
                aria-label="Close"
              >
                &times;
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </AsyncStateWrapper>
    </div>
  );
}
