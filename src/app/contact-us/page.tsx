'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Slab from '@/components/ui/slab';
import CentredHead from '@/components/ui/centred-head';
import ContactForm, { orgTypeFromParam } from '@/components/contact/contact-form';
import ClosingBand from '@/components/layout/closing-band';
import { EditableButton } from '@/edit';

/*
  Page head, the form, then the closing band. On this page the band's
  business button points at the form above it rather than at the page
  itself.

  ?type= preselects the Organization type (Become a partner sends
  type=sponsor). Reading the query needs a Suspense boundary so the page
  stays static: the prerendered HTML carries the fallback, which is the
  same form with nothing preselected, and the client swaps in the read
  value before anyone can type.
*/
function ContactFormFromQuery() {
  const type = useSearchParams().get('type');
  return <ContactForm initialOrgType={orgTypeFromParam(type)} />;
}

export default function ContactPage() {
  return (
    <div className="stack">
      <Slab
        tone="inverse"
        texture="waist"
        overflowHidden
        aria-labelledby="contact-title"
        className="pt-[clamp(7.5rem,12vw,10rem)]! pb-[clamp(3.5rem,7vw,5.5rem)]!"
      >
        <CentredHead
          as="h1"
          id="contact-title"
          eyebrowKey="contact.header.eyebrow"
          titleKeys={['contact.header.title']}
          bodyKey="contact.header.body"
        />
      </Slab>

      <Suspense fallback={<ContactForm />}>
        <ContactFormFromQuery />
      </Suspense>

      <ClosingBand
        businessAction={
          <EditableButton
            labelKey="home.cta.business_label"
            hrefKey="contact.cta.form_href"
            variant="secondary"
          />
        }
      />
    </div>
  );
}
