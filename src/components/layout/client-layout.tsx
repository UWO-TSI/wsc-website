'use client';

import { usePathname } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from '@/providers/theme-provider';
import { PreloaderProvider, usePreloader } from '@/providers/preloader-provider';
import { CursorProvider } from '@/providers/cursor-provider';
import { LenisProvider } from '@/providers/lenis-provider';
import { CustomCursor } from '@/components/cursor/custom-cursor';
import Preloader from '@/components/layout/preloader';
import Nav from '@/components/layout/nav';
import Footer from '@/components/layout/footer';

function Shell({ children }: { children: React.ReactNode }) {
  const { complete, markComplete } = usePreloader();

  return (
    <CursorProvider>
      <LenisProvider>
        <CustomCursor />

        <AnimatePresence mode="wait">
          {!complete && <Preloader key="preloader" onLoadComplete={markComplete} />}
        </AnimatePresence>

        <a href="#main-content" className="skip">
          Skip to content
        </a>

        <Nav />
        <main id="main-content">{children}</main>
        <Footer />
      </LenisProvider>
    </CursorProvider>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') || pathname?.startsWith('/auth');

  /* The theme sits outside the admin branch: /admin ships in both themes too,
     and the toggle in the dashboard header needs the same context. The
     preloader does not, so /admin gets the default `complete: true`. */
  if (isAdmin) {
    return <ThemeProvider>{children}</ThemeProvider>;
  }

  return (
    <ThemeProvider>
      <PreloaderProvider>
        <Shell>{children}</Shell>
      </PreloaderProvider>
    </ThemeProvider>
  );
}
