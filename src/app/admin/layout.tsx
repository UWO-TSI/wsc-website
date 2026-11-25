import type { Metadata } from 'next';

/* Sign-in and Settings are never indexed. robots.txt also disallows
   /admin/, but a page linked from elsewhere can still be indexed
   without this. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
