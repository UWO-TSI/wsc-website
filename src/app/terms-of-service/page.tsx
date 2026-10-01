import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsOfServicePage() {
  return (
    <div className="px-[var(--gut)] pt-[clamp(6rem,10vw,10rem)] pb-[clamp(5rem,10vw,9rem)]">
      <div className="mx-auto flex max-w-[720px] flex-col gap-10">
        <h1 className="title">Terms of Service</h1>

        <div className="flex flex-col gap-10">
          <Section index="01" title="Acceptance of Terms">
            <p className="body measure">
              By accessing or using the Western Sales Club website, you agree to
              be bound by these Terms of Service. If you do not agree to these
              terms, please do not use our website.
            </p>
          </Section>

          <Section index="02" title="Description of Service">
            <p className="body measure">
              Western Sales Club provides a platform for students interested in
              sales and marketing to connect, learn, and participate in events.
              Our services include but are not limited to providing information
              about club activities, events, resources, and facilitating
              communication between members.
            </p>
          </Section>

          <Section index="03" title="User Conduct">
            <p className="body measure">Users of the Western Sales Club website agree to:</p>
            <ul className="body measure flex list-disc flex-col gap-2 pl-5">
              <li>
                Provide accurate and complete information when interacting with
                our website
              </li>
              <li>
                Use the website in a manner consistent with all applicable laws
                and regulations
              </li>
              <li>
                Not engage in any activity that disrupts or interferes with our
                services
              </li>
              <li>
                Not attempt to gain unauthorized access to any portion of the
                website
              </li>
              <li>
                Not use our website for any illegal or unauthorized purpose
              </li>
            </ul>
          </Section>

          <Section index="04" title="Intellectual Property">
            <p className="body measure">
              All content on the Western Sales Club website, including text,
              graphics, logos, images, and software, is the property of Western
              Sales Club or its content suppliers and is protected by Canadian and
              international copyright laws.
            </p>
          </Section>

          <Section index="05" title="Third-Party Links">
            <p className="body measure">
              Our website may contain links to third-party websites. Western
              Sales Club is not responsible for the content or practices of these
              websites and does not endorse or make any representations about
              them.
            </p>
          </Section>

          <Section index="06" title="Limitation of Liability">
            <p className="body measure">
              Western Sales Club shall not be liable for any direct, indirect,
              incidental, special, consequential, or punitive damages resulting
              from your access to or use of, or inability to access or use, the
              website or any content provided on or through the website.
            </p>
          </Section>

          <Section index="07" title="Changes to Terms">
            <p className="body measure">
              Western Sales Club reserves the right to modify these Terms of
              Service at any time. We will notify users of any changes by
              updating the date at the top of this page. Your continued use of
              the website after any modifications indicates your acceptance of
              the updated terms.
            </p>
          </Section>

          <Section index="08" title="Governing Law">
            <p className="body measure">
              These Terms of Service are governed by and construed in accordance
              with the laws of the Province of Ontario, Canada, without regard to
              its conflict of law principles.
            </p>
          </Section>

          <Section index="09" title="Contact Information">
            <p className="body measure">
              If you have any questions about these Terms of Service, please
              contact us at{" "}
              <a href="mailto:sales.club@westernusc.ca" className="text-accent-ink hover:underline">
                sales.club@westernusc.ca
              </a>
              .
            </p>
          </Section>
        </div>

        <p className="meta">Last Updated: May 7, 2025</p>
      </div>
    </div>
  );
}

function Section({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="title-sm flex items-baseline gap-3">
        <span className="label accent-mark">{index}</span>
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
