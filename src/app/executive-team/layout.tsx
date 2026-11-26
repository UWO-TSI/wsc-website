import { pageMetadata } from '@/lib/page-metadata';

/* The page is a client component, so its metadata is exported here. */
export const metadata = pageMetadata({
  path: '/executive-team',
  title: 'Executive Team',
  description:
    'The students who run Western Sales Club: presidents, vice presidents and assistant vice presidents.',
});

export default function ExecutiveTeamLayout({ children }: { children: React.ReactNode }) {
  return children;
}
