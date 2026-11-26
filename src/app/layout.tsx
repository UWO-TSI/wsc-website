import type { Metadata } from "next";
import { Archivo, Instrument_Sans } from "next/font/google";
import ClientLayout from "@/components/layout/client-layout";
import { SHARED_OPEN_GRAPH } from "@/lib/page-metadata";
import "./globals.css";

/* Three families, each with one job. Mixing the jobs is how this stops
   looking like WSC Floor and starts looking like every other site. */

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://westernsalesclub.ca"),
  title: {
    default: "Western Sales Club",
    template: "%s | Western Sales Club",
  },
  /*
    The description, canonical and og:url here are the home page's: the home
    page is a client component and cannot export metadata, so it takes the
    root's. Every other route sets its own through pageMetadata or
    UNLISTED_METADATA (src/lib/page-metadata.ts).

    The share image is src/app/opengraph-image.png, a Next file convention:
    Next serves it at /opengraph-image.png. SHARED_OPEN_GRAPH names that
    route explicitly, because a route that sets its own openGraph replaces
    this one whole and would otherwise drop the image.
  */
  description:
    "Western University's student-run sales organization. Workshops, competitions and industry mentorship for students who want to sell.",
  alternates: { canonical: "/" },
  openGraph: { ...SHARED_OPEN_GRAPH, url: "/" },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${archivo.variable} ${instrumentSans.variable}`}
    >
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
