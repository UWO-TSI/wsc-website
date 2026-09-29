"use client";

import Link from "next/link";
import Image from "next/image";
import Slab from "@/components/ui/slab";

/*
  Footer: a --sunken slab, flat elevation, no shadow. Wordmark, the nav
  links inline with dot separators, social links as --r-disc --sunken icon
  buttons that go --accent on hover, and the Tethos affiliation lockup.

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

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/westernsalesclub/",
    icon: "/logos/instagram.svg",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/western-sales-club/",
    icon: "/logos/linkedin.svg",
  },
] as const;

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <Slab
      as="footer"
      tone="sunken"
      className="mx-[var(--gut)] mb-6 mt-6 flex flex-col gap-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex flex-col gap-[10px]">
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
          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                data-cursor="hover"
                className="grid h-[34px] w-[34px] place-items-center rounded-full bg-page text-ink-muted transition-colors duration-[var(--d-hover)] ease-enter hover:bg-accent hover:text-on-accent"
              >
                {/*
                  Both social SVGs are hardcoded fill="#ffffff", so rendering
                  them as images put a white glyph on the Showroom ground and
                  they disappeared. Masked and filled with currentColor they
                  inherit the link's own colour and flip with the theme.
                */}
                <span
                  aria-hidden="true"
                  className="mark-mask h-4 w-4"
                  style={{
                    WebkitMaskImage: `url("${social.icon}")`,
                    maskImage: `url("${social.icon}")`,
                  }}
                />
              </a>
            ))}
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-[2px]" aria-label="Footer">
          {NAV_LINKS.map((link, i) => (
            <span key={link.href} className="flex items-center">
              {i > 0 && (
                <span className="mx-1 select-none body-sm" aria-hidden="true">
                  &middot;
                </span>
              )}
              <Link
                href={link.href}
                data-cursor="hover"
                className="body-sm rounded-sm px-[9px] py-[7px] no-underline transition-colors duration-[var(--d-hover)] ease-enter hover:bg-accent-veil hover:text-ink"
              >
                {link.label}
              </Link>
            </span>
          ))}
        </nav>

        <a
          href="https://tethos.ca"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Tethos"
          data-cursor="hover"
          className="flex flex-none items-center gap-[10px] no-underline"
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
          <span className="meta">A Tethos initiative</span>
        </a>
      </div>

      <div className="flex flex-wrap justify-between gap-[14px]">
        <span className="meta">&copy; {year} Western Sales Club</span>
        <nav className="flex items-center gap-[2px]" aria-label="Legal">
          {LEGAL_LINKS.map((link, i) => (
            <span key={link.href} className="flex items-center">
              {i > 0 && (
                <span className="mx-1 select-none meta" aria-hidden="true">
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
