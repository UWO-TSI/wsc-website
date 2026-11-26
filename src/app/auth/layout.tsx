import { UNLISTED_METADATA } from '@/lib/page-metadata';

/* The sign-in callback is never indexed and has no canonical URL. */
export const metadata = UNLISTED_METADATA;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
