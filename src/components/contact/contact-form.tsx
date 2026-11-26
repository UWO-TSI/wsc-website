'use client';

import { useRef, useState, type FormEvent, type ChangeEvent, type FocusEvent } from 'react';
import emailjs from '@emailjs/browser';
import Button from '@/components/ui/button';
import Slab from '@/components/ui/slab';
import Chip from '@/components/ui/chip';
import Field from '@/components/contact/field';
import { EditableButton, EditableText } from '@/edit';

interface FormData {
  name: string;
  email: string;
  organization_type: string;
  subject: string;
  message: string;
}

type FieldName = 'name' | 'email' | 'subject' | 'message';

const INITIAL_FORM_DATA: FormData = {
  name: '',
  email: '',
  organization_type: '',
  subject: '',
  message: '',
};

const MAX_MESSAGE_LENGTH = 1000;

const ORG_TYPE_OPTIONS = [
  { value: '', label: 'Select an option' },
  { value: 'student', label: 'Student' },
  { value: 'company', label: 'Company / Organization' },
  { value: 'sponsor', label: 'Potential Sponsor' },
  { value: 'other', label: 'Other' },
];

/*
  The Organization type a link may preselect with ?type=, for example
  Become a partner on the Partners page. Only a value already offered by
  the select is accepted; anything else leaves the select empty.
*/
export function orgTypeFromParam(value: string | null | undefined): string {
  if (!value) return '';
  return ORG_TYPE_OPTIONS.some((opt) => opt.value && opt.value === value) ? value : '';
}

/*
  The form section is its own full-width sunken slab, the one content
  section on an inner page that keeps a ground: the fields are a group, and
  each --page well needs the sunken bed to read as a field. The form is a
  640px column centred in the slab, under the centred page head. Labels and
  inputs inside it stay left-aligned for reading; the submit button, the
  failure message and the confirmation are centred on the column. Its id is
  the target of the closing band's business button on this page.
*/
export const CONTACT_FORM_ID = 'contact-form';

const SECTION_CLASS = 'scroll-mt-[clamp(5rem,8vw,7rem)]';
const COLUMN_CLASS = 'mx-auto w-full max-w-[640px]';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/*
  What broke and how to fix it, never "Invalid input".
*/
function validateField(name: FieldName, formData: FormData): string | undefined {
  const value = formData[name].trim();

  if (name === 'name' && !value) return 'Add your name before sending.';
  if (name === 'subject' && !value) return 'Add a subject line before sending.';
  if (name === 'message' && !value) return 'Add a message before sending.';

  if (name === 'email') {
    if (!value) return 'Add an email so we can reply.';
    if (!EMAIL_PATTERN.test(value)) return 'That is missing an @. Check it and send again.';
  }

  return undefined;
}

function validateAll(formData: FormData): Record<FieldName, string | undefined> {
  return {
    name: validateField('name', formData),
    email: validateField('email', formData),
    subject: validateField('subject', formData),
    message: validateField('message', formData),
  };
}

interface ContactFormProps {
  /** A value from orgTypeFromParam: preselects the Organization type. */
  initialOrgType?: string;
}

export default function ContactForm({ initialOrgType = '' }: ContactFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<FormData>({
    ...INITIAL_FORM_DATA,
    organization_type: initialOrgType,
  });
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);
  const [sent, setSent] = useState(false);

  const errors = validateAll(formData);
  const shownError = (name: FieldName) => (touched[name] || submitted ? errors[name] : undefined);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'message' && value.length > MAX_MESSAGE_LENGTH) return;

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    setSubmitFailed(false);

    const currentErrors = validateAll(formData);
    if (Object.values(currentErrors).some(Boolean)) return;

    setIsSubmitting(true);

    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    // Send the form data using EmailJS - NOTE: Limit is 200 emails per month
    emailjs
      .sendForm('service_qwpe0fl', 'template_lt8anmn', formRef.current!, publicKey)
      .then(() => {
        setSent(true);
      })
      .catch((error) => {
        console.error('Error sending email:', error.text);
        setSubmitFailed(true);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  if (sent) {
    return (
      <Slab tone="sunken" id={CONTACT_FORM_ID} className={SECTION_CLASS}>
        <div
          className={`${COLUMN_CLASS} flex flex-col items-center gap-4 py-[clamp(2rem,5vw,3rem)]`}
        >
          <Chip status="ok">Sent</Chip>
          <EditableText k="contact.form.sent_title" as="p" className="title-sm text-center" />
          <EditableText k="contact.form.sent_body" as="p" className="body-sm measure text-center" />
          <Button
            variant="tertiary"
            onClick={() => {
              setFormData(INITIAL_FORM_DATA);
              setTouched({});
              setSubmitted(false);
              setSubmitFailed(false);
              setSent(false);
            }}
          >
            Send another message
          </Button>
        </div>
      </Slab>
    );
  }

  return (
    <Slab tone="sunken" id={CONTACT_FORM_ID} className={SECTION_CLASS}>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={`${COLUMN_CLASS} flex flex-col gap-6`}
        noValidate
      >
        <Field
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isSubmitting}
          error={shownError('name')}
          required
        />

        <Field
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isSubmitting}
          error={shownError('email')}
          required
        />

        <Field
          as="select"
          label="Organization type"
          name="organization_type"
          value={formData.organization_type}
          onChange={handleChange}
          options={ORG_TYPE_OPTIONS}
          disabled={isSubmitting}
        />

        <Field
          label="Subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isSubmitting}
          error={shownError('subject')}
          required
        />

        <Field
          as="textarea"
          label="Message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          onBlur={handleBlur}
          rows={5}
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={isSubmitting}
          error={shownError('message')}
          required
          trailing={
            <span className="meta self-end">
              {formData.message.length} / {MAX_MESSAGE_LENGTH}
            </span>
          }
        />

        <div aria-live="polite" aria-atomic="true">
          {submitFailed && (
            <div className="flex flex-col items-center gap-2 text-center">
              <Chip status="alert">Not sent</Chip>
              <p className="body-sm">
                Something went wrong on our end. Check your connection and try again.
              </p>
            </div>
          )}
        </div>

        <EditableButton
          labelKey="contact.form.submit_label"
          type="submit"
          disabled={isSubmitting}
          label={isSubmitting ? 'Sending' : undefined}
          className="self-center"
        />
      </form>
    </Slab>
  );
}
