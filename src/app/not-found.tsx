import Button from '@/components/ui/button';

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
