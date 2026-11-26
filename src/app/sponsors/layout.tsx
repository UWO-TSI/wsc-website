import { pageMetadata } from '@/lib/page-metadata';

/* The page is a client component, so its metadata is exported here. */
export const metadata = pageMetadata({
  path: '/sponsors',
  title: 'Partners',
  description:
    'The businesses that support Western Sales Club, and how a business can become a partner.',
});

export default function SponsorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
