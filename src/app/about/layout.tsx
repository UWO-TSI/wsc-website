import { pageMetadata } from '@/lib/page-metadata';

/* The page is a client component, so its metadata is exported here. */
export const metadata = pageMetadata({
  path: '/about',
  title: 'About',
  description:
    'What Western Sales Club does: workshops and events through the year, a student executive team, industry partners, and membership through the USC store.',
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
