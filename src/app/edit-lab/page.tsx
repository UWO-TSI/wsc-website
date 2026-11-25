import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';

/* The import sits behind the build-time NODE_ENV check, so a production
   build drops it and the 404 page ships no edit code. */
const EditLab =
  process.env.NODE_ENV === 'production' ? null : dynamic(() => import('@/edit/lab/edit-lab'));

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
  if (!EditLab) notFound();
  return <EditLab />;
}
