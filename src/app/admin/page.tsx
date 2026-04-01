'use client';

import AdminAuthProvider from '@/providers/admin-auth-provider';
import AdminDashboard from './admin-dashboard';

export default function AdminPage() {
  return (
    <AdminAuthProvider>
      <AdminDashboard />
    </AdminAuthProvider>
  );
}
