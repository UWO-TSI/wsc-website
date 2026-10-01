import type { Metadata } from "next";
import { Archivo, Instrument_Sans, Geist_Mono } from "next/font/google";
import ClientLayout from "@/components/layout/client-layout";
import { THEME_STORAGE_KEY } from "@/lib/theme";
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

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

/*
  Read the stored theme and stamp it on <html> before the first paint.
  Without this the page flashes Showroom on every load for an Afterhours
  viewer. It runs blocking in <head>, so it stays small and throws nothing:
  a private window with blocked storage falls through to the OS preference.
*/
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('${THEME_STORAGE_KEY}');
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
      return;
    }
  } catch (e) {}
  var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL("https://westernsalesclub.ca"),
  title: {
    default: "Western Sales Club",
    template: "%s | Western Sales Club",
  },
  description:
    "Western University's student-run sales organization. Workshops, competitions and industry mentorship for students who want to sell.",
  /*
    No explicit `images` here. The share image is src/app/opengraph-image.png,
    which is a Next file convention: it is served, sized and injected into both
    the OpenGraph and Twitter tags automatically, with its alt text taken from
    opengraph-image.alt.txt.

    It used to be named og-image.png and pointed at by hand as "/og-image.png".
    That is not a convention filename and the file was not in public/, so the
    URL 404d and every social preview of the site came up blank.
  */
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: "https://westernsalesclub.ca",
    siteName: "Western Sales Club",
  },
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
      suppressHydrationWarning
      className={`${archivo.variable} ${instrumentSans.variable} ${geistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
