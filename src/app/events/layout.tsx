import { pageMetadata } from '@/lib/page-metadata';

/* The page is a client component, so its metadata is exported here. */
export const metadata = pageMetadata({
  path: '/events',
  title: 'Events',
  description:
    'The workshops and events Western Sales Club runs through the year, with dates and registration links.',
});

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
