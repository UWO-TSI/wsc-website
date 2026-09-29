'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/providers/admin-auth-provider';
import { CONTENT_CONFIG } from '@/lib/admin-config';
import Button from '@/components/ui/button';
import ThemeToggle from '@/components/ui/theme-toggle';
import AdminSection from './components/admin-section';

const TABS = [
  { key: 'events',        label: 'Events' },
  { key: 'sponsors',      label: 'Sponsors' },
  { key: 'executives',    label: 'Executives' },
  { key: 'gallery_photos', label: 'Gallery' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function AdminDashboard() {
  const { signOut } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('events');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const config = CONTENT_CONFIG[activeTab];

  return (
    <div className="min-h-screen bg-page flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-[rgba(0,0,0,0.6)] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-56 bg-raised shadow-2 z-30 flex flex-col transition-transform duration-[var(--d-move)] ease-move lg:translate-x-0 lg:static lg:z-auto lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="px-5 py-6">
          <p className="label text-accent-ink mb-1">WSC Admin</p>
          <p className="meta text-ink-muted">Content manager</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSidebarOpen(false);
              }}
              className={`label w-full text-left rounded-md px-3 py-2.5 transition-colors duration-[var(--d-hover)] ease-enter cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-accent-veil text-accent-ink'
                  : 'text-ink-muted hover:text-ink hover:bg-sunken'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="px-3 py-4 flex flex-col gap-1">
          <Button variant="tertiary" href="/" className="!justify-start !px-3 !py-2.5 w-full">
            Back to site
          </Button>
          <Button variant="tertiary" onClick={signOut} className="!justify-start !px-3 !py-2.5 w-full">
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-5 bg-raised shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              className="lg:hidden text-ink-muted hover:text-ink transition-colors duration-[var(--d-hover)] ease-enter cursor-pointer"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <span className="label text-ink-muted">{config.displayName}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="meta text-ink-faint hidden sm:block">westernsalesclub.ca</span>
            <ThemeToggle />
          </div>
        </header>

        {/* Section content */}
        <main className="flex-1 p-5 sm:p-8 overflow-auto">
          <AdminSection key={activeTab} configKey={activeTab} config={config} />
        </main>
      </div>
    </div>
  );
}
