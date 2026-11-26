'use client';

import { useSiteContent } from '@/providers/site-content-provider';
import { SITE_CONTENT_DEFAULTS } from '@/lib/site-content-defaults';

/*
  The club's email as a mailto link, inside running text on a server page
  (the legal pages). It reads footer.contact.email, the address the footer
  shows, so changing it in the footer changes it here. The legal copy is
  not site content, so this is not a field in edit mode. An emptied value
  falls back to the default address, because the sentence around it needs
  one.
*/
export default function ClubEmail() {
  const { text } = useSiteContent();
  const email = text('footer.contact.email') || SITE_CONTENT_DEFAULTS['footer.contact.email'];

  return (
    <a href={`mailto:${email}`} className="text-accent-ink hover:underline">
      {email}
    </a>
  );
}
