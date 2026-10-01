'use client';

import Eyebrow from '@/components/ui/eyebrow';
import ContactForm from '@/components/contact/contact-form';
import { useReveal } from '@/lib/reveal';
import { useSiteContent } from '@/providers/site-content-provider';

export default function ContactPage() {
  const ref = useReveal<HTMLDivElement>();
  const { text } = useSiteContent();

  return (
    <div className="px-[var(--gut)] pt-[clamp(6rem,10vw,10rem)] pb-[clamp(5rem,10vw,9rem)]">
      <div className="stack mx-auto max-w-[640px]">
        <div ref={ref} className="flex flex-col gap-3">
          <Eyebrow>{text('contact.header.eyebrow')}</Eyebrow>
          <h1 className="title">
            <span className="ln">
              <i>{text('contact.header.title')}</i>
            </span>
          </h1>
          <p className="body measure">{text('contact.header.body')}</p>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
