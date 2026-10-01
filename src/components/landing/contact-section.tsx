'use client';

import Button from '@/components/ui/button';
import Slab from '@/components/ui/slab';
import SectionHead from '@/components/ui/section-head';
import { useSiteContent } from '@/providers/site-content-provider';

/*
  Contact: a short section pointing at the contact page. The form itself
  belongs to another agent's stream, so this only ever links out.
*/
export default function ContactSection() {
  const { text } = useSiteContent();

  return (
    <Slab tone="raised" className="mx-[var(--gut)]" aria-labelledby="contact-heading">
      <div className="flex flex-col gap-6">
        <SectionHead
          eyebrow={text('home.contact.eyebrow')}
          index="04"
          id="contact-heading"
          title={[text('home.contact.title_line1')]}
        />

        <p className="body measure">{text('home.contact.body')}</p>

        <div>
          <Button href="/contact-us" arrow>
            {text('home.contact.link_label')}
          </Button>
        </div>
      </div>
    </Slab>
  );
}
