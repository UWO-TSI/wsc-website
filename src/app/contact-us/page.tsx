'use client';

import Eyebrow from '@/components/ui/eyebrow';
import ContactForm from '@/components/contact/contact-form';
import { useReveal } from '@/lib/reveal';

export default function ContactPage() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div className="px-[var(--gut)] pt-[clamp(6rem,10vw,10rem)] pb-[clamp(5rem,10vw,9rem)]">
      <div className="stack mx-auto max-w-[640px]">
        <div ref={ref} className="flex flex-col gap-3">
          <Eyebrow>Contact</Eyebrow>
          <h1 className="title">
            <span className="ln">
              <i>Get in touch.</i>
            </span>
          </h1>
          <p className="body measure">
            Questions about membership, events, or partnerships. You can also
            email sales.club@westernusc.ca.
          </p>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
