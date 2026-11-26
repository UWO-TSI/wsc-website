import { pageMetadata } from '@/lib/page-metadata';

/* The page is a client component, so its metadata is exported here. */
export const metadata = pageMetadata({
  path: '/contact-us',
  title: 'Contact',
  description:
    'Contact Western Sales Club about membership, events or partnerships, through the form or by email.',
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
