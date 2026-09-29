'use client';

import Button from '@/components/ui/button';
import Slab from '@/components/ui/slab';
import SectionHead from '@/components/ui/section-head';

/*
  Contact — a short section pointing at the contact page. The form itself
  belongs to another agent's stream, so this only ever links out.
*/
export default function ContactSection() {
  return (
    <Slab tone="raised" className="mx-[var(--gut)]" aria-labelledby="contact-heading">
      <div className="flex flex-col gap-6">
        <SectionHead
          eyebrow="Contact"
          index="04"
          id="contact-heading"
          title={['HAVE A', 'QUESTION?']}
        />

        <p className="body measure">
          Reach out about partnerships, speaking at an event, or joining the club.
          We read every message and reply within a few days.
        </p>

        <div>
          <Button href="/contact-us" arrow>
            Contact us
          </Button>
        </div>
      </div>
    </Slab>
  );
}
