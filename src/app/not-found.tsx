import type { Metadata } from 'next';
import Button from '@/components/ui/button';
import { UNLISTED_METADATA } from '@/lib/page-metadata';

export const metadata: Metadata = {
  ...UNLISTED_METADATA,
  title: 'Page not found',
  description: 'That page does not exist on the Western Sales Club website.',
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-[var(--gut)] text-center">
      <h1 className="title-hero">404</h1>
      <p className="body measure">That page does not exist.</p>
      <Button href="/" arrow>
        Back home
      </Button>
    </div>
  );
}
