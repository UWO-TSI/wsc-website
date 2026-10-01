'use client';

/*
  A whole-viewport loading state, for a route that has nothing to show yet.

  The spinner is the .spin class: a masked conic gradient, not a border-top
  trick, because borders are out.

  Nothing imports this today. AsyncState covers loading inside a section and
  the Preloader covers the first paint, so reach for one of those first; this
  is only for a route that genuinely has no frame to put a spinner inside.
*/
export default function FullPageLoader() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-page">
      <span className="spin" role="status" aria-label="Loading" />
      <span className="label">Loading</span>
    </div>
  );
}
