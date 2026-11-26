import type { Metadata } from 'next';
import { UNLISTED_METADATA } from '@/lib/page-metadata';

/* Sign-in and Settings are never indexed. robots.txt also disallows
   /admin/, but a page linked from elsewhere can still be indexed
   without this. They carry no canonical URL either. */
export const metadata: Metadata = {
  ...UNLISTED_METADATA,
  title: 'Admin',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
