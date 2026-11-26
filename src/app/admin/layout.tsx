import type { Metadata } from 'next';
import { UNLISTED_METADATA } from '@/lib/page-metadata';

/* Sign-in and Settings are never indexed. robots.txt also disallows
   /admin/, but a page linked from elsewhere can still be indexed
   without this. They carry no canonical URL either. */
export const metadata: Metadata = {
  ...UNLISTED_METADATA,
  title: 'Admin',
};

/* ClientLayout renders no site shell on /admin, so the main landmark is
   here: every admin screen (sign-in, the code step, Settings) is inside it. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <main id="main-content">{children}</main>;
}
