'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import { useReveal } from '@/lib/reveal';
import AsyncStateWrapper from '@/components/shared/async-state-wrapper';
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

  return (
    <div>
      <Eyebrow className="mb-6 block">Gallery</Eyebrow>

      <AsyncStateWrapper
        loading={loading}
        error={error}
        data={photos}
        onRetry={onRetry}
        emptyMessage="No photos yet."
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
                  className={`group relative overflow-hidden rounded-sm ${spanFor(index)} clip-cell`}
                  style={{ '--i': index } as React.CSSProperties}
                  aria-label={photo.caption ? `Open ${photo.caption}` : 'Open gallery photo'}
                >
                  <span className="clip-inner absolute inset-0 block">
                    <Image
                      src={photo.src as string}
                      alt={altText}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 33vw, 25vw"
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
                  <Image
                    src={selected.src}
                    alt={selected.alt ?? selected.caption ?? ''}
                    fill
                    className="object-contain"
                    sizes="90vw"
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
