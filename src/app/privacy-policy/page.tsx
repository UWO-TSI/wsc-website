import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="px-[var(--gut)] pt-[clamp(6rem,10vw,10rem)] pb-[clamp(5rem,10vw,9rem)]">
      <div className="mx-auto flex max-w-[720px] flex-col gap-10">
        <h1 className="title">Privacy Policy</h1>

        <div className="flex flex-col gap-10">
          <Section index="01" title="Introduction">
            <p className="body measure">
              Western Sales Club (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
              &ldquo;us&rdquo;) is committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you visit our website. Please read
              this policy carefully.
            </p>
          </Section>

          <Section index="02" title="Information We Collect">
            <p className="body measure">
              We may collect personal information that you voluntarily provide to
              us when you:
            </p>
            <ul className="body measure flex list-disc flex-col gap-2 pl-5">
              <li>Register for events or workshops</li>
              <li>Sign up for our newsletter</li>
              <li>Complete contact or application forms</li>
              <li>Participate in surveys or contests</li>
            </ul>
            <p className="body measure">The personal information we may collect includes:</p>
            <ul className="body measure flex list-disc flex-col gap-2 pl-5">
              <li>First and last name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Student information (program, year)</li>
              <li>Resume or CV (when applicable)</li>
            </ul>
            <h3 className="label text-ink-muted">Automatically Collected Information</h3>
            <p className="body measure">
              When you visit our website, we may automatically collect certain
              information about your device, including:
            </p>
            <ul className="body measure flex list-disc flex-col gap-2 pl-5">
              <li>IP address</li>
              <li>Browser type</li>
              <li>Access times</li>
              <li>Pages viewed</li>
              <li>Operating system</li>
            </ul>
          </Section>

          <Section index="03" title="How We Use Your Information">
            <p className="body measure">
              We may use the information we collect for various purposes,
              including to:
            </p>
            <ul className="body measure flex list-disc flex-col gap-2 pl-5">
              <li>Provide, maintain, and improve our services</li>
              <li>Process event registrations and send related information</li>
              <li>
                Send administrative information, updates, and promotional content
              </li>
              <li>Respond to inquiries and provide support</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Protect against unauthorized access to our services</li>
            </ul>
          </Section>

          <Section index="04" title="Disclosure of Your Information">
            <p className="body measure">
              We may share your information in the following situations:
            </p>
            <ul className="body measure flex list-disc flex-col gap-2 pl-5">
              <li>
                With club sponsors and partners when necessary for events or
                opportunities (with your consent)
              </li>
              <li>With service providers who perform services on our behalf</li>
              <li>To comply with legal obligations</li>
              <li>To protect and defend our rights and property</li>
              <li>With your consent or at your direction</li>
            </ul>
          </Section>

          <Section index="05" title="Cookies and Tracking Technologies">
            <p className="body measure">
              We may use cookies and similar tracking technologies to collect
              information about your browsing activities. You can instruct your
              browser to refuse all cookies or to indicate when a cookie is being
              sent.
            </p>
          </Section>

          <Section index="06" title="Data Security">
            <p className="body measure">
              We have implemented appropriate technical and organizational
              security measures to protect your information. However, please note
              that no method of transmission over the Internet or electronic
              storage is 100% secure.
            </p>
          </Section>

          <Section index="07" title="Your Privacy Rights">
            <p className="body measure">
              Depending on your location, you may have certain rights regarding
              your personal information, such as:
            </p>
            <ul className="body measure flex list-disc flex-col gap-2 pl-5">
              <li>The right to access your personal information</li>
              <li>The right to correct inaccurate information</li>
              <li>The right to request deletion of your information</li>
              <li>The right to restrict or object to processing</li>
              <li>The right to data portability</li>
            </ul>
            <p className="body measure">
              To exercise these rights, please contact us using the information
              provided below.
            </p>
          </Section>

          <Section index="08" title="Children's Privacy">
            <p className="body measure">
              Our website is not intended for individuals under the age of 18. We
              do not knowingly collect personal information from children under
              18.
            </p>
          </Section>

          <Section index="09" title="Changes to This Privacy Policy">
            <p className="body measure">
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page
              and updating the &ldquo;Last Updated&rdquo; date.
            </p>
          </Section>

          <Section index="10" title="Contact Us">
            <p className="body measure">
              If you have questions or concerns about this Privacy Policy, please
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
