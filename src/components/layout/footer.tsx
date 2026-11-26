"use client";

import Link from "next/link";
import Image from "next/image";
import Slab from "@/components/ui/slab";
import { useSiteContent } from "@/providers/site-content-provider";
import { EditableText, useEditMode } from "@/edit";
import EditableLink from "@/edit/editable-link";

/*
  Footer: a --sunken slab, flat elevation, no shadow, full width and 2px
  under the page's closing band. Its block padding is --pad-section, the
  page head's bottom, so it reads as a section of the page rather than a
  strip under it. Three columns on a
  shared rhythm: wordmark and socials on the left, the nav stacked in the
  center, and the Tethos mark right-aligned above "Website by Tethos".
  Social links are --r-disc buttons that go --accent on hover.

  design-system/components.md → Footer.
*/

const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Executive Team", href: "/executive-team" },
  { label: "Events", href: "/events" },
  { label: "Partners", href: "/sponsors" },
  { label: "Contact", href: "/contact-us" },
] as const;

const LEGAL_LINKS = [
  { label: "Terms", href: "/terms-of-service" },
  { label: "Privacy", href: "/privacy-policy" },
] as const;

/* The marks stay in code; the destinations are editable through
   EditableLink: in edit mode each icon is a control whose address is
   edited in the tray. A visitor's link passes safeHref, and an empty or
   refused address hides its icon (in Preview too). */
const SOCIAL_LINKS = [
  { label: "Instagram", key: "footer.social.instagram_url", icon: "/logos/instagram.svg" },
  { label: "LinkedIn", key: "footer.social.linkedin_url", icon: "/logos/linkedin.svg" },
] as const;

export default function Footer() {
  const year = new Date().getFullYear();
  const { text } = useSiteContent();
  const { editing } = useEditMode();
  const email = text("footer.contact.email");

  return (
    <Slab
      as="footer"
      tone="sunken"
      className="flex flex-col gap-4 py-[var(--pad-section)]!"
    >
      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-x-10">
        <div className="flex flex-col items-start gap-4">
          <Link href="/" className="flex items-center gap-[9px] no-underline" data-cursor="hover">
            <span
              aria-hidden="true"
              className="mark-mask h-[26px] w-[26px] text-ink"
              style={{
                WebkitMaskImage: 'url("/logos/wsc-shark.png")',
                maskImage: 'url("/logos/wsc-shark.png")',
              }}
            />
            <span className="font-display text-[12px] font-black uppercase tracking-[0.07em] text-ink">
              Western Sales Club
            </span>
          </Link>
          {/* While editing the address is a field, not a mailto link. */}
          {editing ? (
            <EditableText k="footer.contact.email" className="meta" />
          ) : email && (
            <a
              href={`mailto:${email}`}
              data-cursor="hover"
              className="meta w-fit no-underline transition-colors duration-[var(--d-hover)] ease-enter hover:text-ink"
            >
              <EditableText k="footer.contact.email" />
            </a>
          )}
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((social) => (
              <EditableLink
                key={social.label}
                hrefKey={social.key}
                label={social.label}
                className="grid h-11 w-11 place-items-center rounded-full bg-page text-ink-muted transition-colors duration-[var(--d-hover)] ease-enter hover:bg-accent hover:text-on-accent"
              >
                {/*
                  Both social SVGs are hardcoded fill="#ffffff", so rendering
                  them as images put a white glyph on the Showroom ground and
                  they disappeared. Masked and filled with currentColor they
                  inherit the link's own colour, including on hover.
                */}
                <span
                  aria-hidden="true"
                  className="mark-mask h-[22px] w-[22px]"
                  style={{
                    WebkitMaskImage: `url("${social.icon}")`,
                    maskImage: `url("${social.icon}")`,
                  }}
                />
              </EditableLink>
            ))}
          </div>
        </div>

        <nav className="flex flex-col items-center gap-0.5 md:justify-self-center" aria-label="Footer">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-cursor="hover"
              className="body-sm rounded-sm px-3 py-1.5 text-center no-underline transition-colors duration-[var(--d-hover)] ease-enter hover:bg-accent-veil hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <a
          href="https://tethos.ca"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Website by Tethos"
          data-cursor="hover"
          className="flex flex-col items-end gap-3 no-underline md:justify-self-end"
        >
          {/*
            The Tethos mark ships with its own black field baked into the file,
            so it gets no ground behind it and no padding: anything we put
            there would just be a second rectangle around the first. Corner and
            overflow come from the wrapper so the artwork inherits --r-sm.
          */}
          <span className="relative h-10 w-10 flex-none overflow-hidden rounded-sm shadow-1">
            <Image src="/logos/tethos.avif" alt="" fill sizes="40px" className="object-cover" />
          </span>
          <span className="meta text-right">Website by Tethos</span>
        </a>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="meta">&copy; {year} Western Sales Club</span>
        <nav className="flex items-center gap-3" aria-label="Legal">
          {LEGAL_LINKS.map((link, i) => (
            <span key={link.href} className="flex items-center gap-3">
              {i > 0 && (
                <span className="select-none meta" aria-hidden="true">
                  &middot;
                </span>
              )}
              <Link
                href={link.href}
                data-cursor="hover"
                className="meta no-underline transition-colors duration-[var(--d-hover)] ease-enter hover:text-ink"
              >
                {link.label}
              </Link>
            </span>
          ))}
        </nav>
      </div>
    </Slab>
  );
}
