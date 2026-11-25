import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EditLab from '@/edit/lab/edit-lab';

/*
  Development-only check page for edit mode: every edit-mode component in
  edit mode, without signing in. A production build answers 404. Deleted
  with the admin dashboard in phase 3.
*/

export const metadata: Metadata = {
  title: 'Edit lab',
  robots: { index: false, follow: false },
};

export default function EditLabPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <EditLab />;
}
