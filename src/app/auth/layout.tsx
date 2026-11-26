import { UNLISTED_METADATA } from '@/lib/page-metadata';

/* The sign-in callback is never indexed and has no canonical URL. */
export const metadata = UNLISTED_METADATA;

/* ClientLayout renders no site shell on /auth, so the main landmark is here. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main id="main-content">{children}</main>;
}
