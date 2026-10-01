/**
 * Link targets became editable, so `target="_blank"` can no longer be
 * hardcoded per call site: an admin may point a button at an internal
 * anchor, and opening `#contact-form` in a new tab is broken behaviour.
 *
 * Returns the new-tab props only for genuinely external URLs, always
 * with `rel="noopener noreferrer"` so an admin-set destination can
 * never reach back through `window.opener`.
 */
export function externalLinkProps(
  href: string | null | undefined
): { target: '_blank'; rel: string } | Record<string, never> {
  if (!href || !/^https?:\/\//i.test(href.trim())) return {};
  return { target: '_blank', rel: 'noopener noreferrer' };
}
