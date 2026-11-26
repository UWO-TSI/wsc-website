import type { Metadata } from 'next';

/*
  Per-route metadata. Every public route passes its own path, title and
  description, so each page has its own <title>, description, canonical
  URL and og:url, resolved against metadataBase in src/app/layout.tsx.

  Next merges metadata shallowly: a segment that sets openGraph replaces
  the parent's openGraph whole, including the image that
  src/app/opengraph-image.png supplies at the root. So the shared Open
  Graph fields, the image among them, are spread into every openGraph here
  rather than inherited. The image URL is the route Next serves for that
  file; the alt text matches opengraph-image.alt.txt.
*/

export const SHARED_OPEN_GRAPH = {
  type: 'website',
  locale: 'en_CA',
  siteName: 'Western Sales Club',
  images: [
    {
      url: '/opengraph-image.png',
      width: 1200,
      height: 630,
      type: 'image/png',
      alt: 'Western Sales Club',
    },
  ],
} satisfies Metadata['openGraph'];

interface PageMetadataInput {
  /** The route path, such as "/about". */
  path: string;
  /** Filled into the root template: "<title> | Western Sales Club". */
  title: string;
  description: string;
}

export function pageMetadata({ path, title, description }: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...SHARED_OPEN_GRAPH, url: path },
  };
}

/*
  For routes that are not part of the public site (the 404 page, /admin,
  /auth): never indexed, and no canonical or og:url, which the root layout
  sets to the home page.
*/
export const UNLISTED_METADATA = {
  alternates: null,
  openGraph: SHARED_OPEN_GRAPH,
  robots: { index: false, follow: false },
} satisfies Metadata;
