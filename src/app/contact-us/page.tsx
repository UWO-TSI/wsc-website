'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHead from '@/components/layout/page-head';
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
      <PageHead
        id="contact-title"
        titleKeys={['contact.header.title']}
        bodyKey="contact.header.body"
      />

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
