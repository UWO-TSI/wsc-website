/*
  Stops iOS Safari zooming the page when a field under 16px gets focus,
  without changing any text size and without blocking pinch zoom.

  Edit mode fields inherit the type of the element they replace (an
  11px label, a 13px meta line, the 14px tray input), and iOS zooms in on
  focus for any input under 16px. Adding maximum-scale=1 to the viewport
  stops that zoom. iOS ignores maximum-scale for pinch zoom (since iOS 10),
  so pinching still works there. Android Chrome does honour it and would
  lose pinch zoom (WCAG 1.4.4), and Android never zooms on focus, so the
  tag is changed on iOS and iPadOS only, and only while edit mode is on.
*/

function isIos(): boolean {
  const ua = navigator.userAgent;
  /* iPadOS 13+ reports itself as a Mac; touch points tell them apart. */
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** Applies the rule, and returns the function that restores the tag. */
export function holdIosFocusZoom(): () => void {
  const tag = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!tag || !isIos()) return () => {};
  const before = tag.content;
  if (!/maximum-scale/.test(before)) tag.content = `${before}, maximum-scale=1`;
  return () => {
    tag.content = before;
  };
}
