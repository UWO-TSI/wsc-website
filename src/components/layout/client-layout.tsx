'use client';

import { usePathname } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { PreloaderProvider, usePreloader } from '@/providers/preloader-provider';
import { CursorProvider } from '@/providers/cursor-provider';
import { LenisProvider } from '@/providers/lenis-provider';
import { SiteContentProvider } from '@/providers/site-content-provider';
import { CustomCursor } from '@/components/cursor/custom-cursor';
import Preloader from '@/components/layout/preloader';
import Nav from '@/components/layout/nav';
import Footer from '@/components/layout/footer';

function Shell({ children }: { children: React.ReactNode }) {
  const { complete, markComplete } = usePreloader();

  return (
    <SiteContentProvider>
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
    </SiteContentProvider>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') || pathname?.startsWith('/auth');

  /* The preloader is for the public site only, so /admin gets the default
     `complete: true`. */
  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <PreloaderProvider>
      <Shell>{children}</Shell>
    </PreloaderProvider>
  );
}
