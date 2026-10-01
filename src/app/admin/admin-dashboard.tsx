'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/providers/admin-auth-provider';
import { CONTENT_CONFIG } from '@/lib/admin-config';
import Button from '@/components/ui/button';
import ThemeToggle from '@/components/ui/theme-toggle';
import AdminSection from './components/admin-section';
import AdminSiteContent from './components/admin-site-content';
import AdminImages from './components/admin-images';
import AdminUsers from './components/admin-users';

/**
 * Tabs are grouped so the sidebar reads as three jobs rather than one
 * long list: the things the club adds and removes, the words and photos
 * of the site itself, and who is allowed in.
 *
 * `kind: 'content'` tabs are driven entirely by CONTENT_CONFIG and
 * FORM_FIELDS, so adding another one is configuration, not a component.
 *
 * Gallery is not listed. No page renders gallery_photos any more, so an
 * editor for it would change nothing the club can see. The table and its
 * bucket stay, and the tab comes back with one line if a page uses it.
 */
interface Tab {
  key: string;
  label: string;
  kind: 'content' | 'site_content' | 'images' | 'admins';
}

const TAB_GROUPS: { heading: string; tabs: Tab[] }[] = [
  {
    heading: 'Content',
    tabs: [
      { key: 'events', label: 'Events', kind: 'content' },
      { key: 'executives', label: 'Executives', kind: 'content' },
      { key: 'exec_groups', label: 'Roles', kind: 'content' },
      { key: 'sponsors', label: 'Sponsors', kind: 'content' },
    ],
  },
  {
    heading: 'Site',
    tabs: [
      { key: 'site_content', label: 'Site text', kind: 'site_content' },
      { key: 'site_images', label: 'Images', kind: 'images' },
      { key: 'site_stats', label: 'Statistics', kind: 'content' },
    ],
  },
  {
    heading: 'Access',
    tabs: [{ key: 'admins', label: 'Admins', kind: 'admins' }],
  },
];

const ALL_TABS: Tab[] = TAB_GROUPS.flatMap((g) => g.tabs);

export default function AdminDashboard() {
  const { signOut } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<string>('events');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tab = ALL_TABS.find((t) => t.key === activeTab) ?? ALL_TABS[0];

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
        <nav className="flex-1 px-3 py-4 flex flex-col gap-5 overflow-y-auto">
          {TAB_GROUPS.map((group) => (
            <div key={group.heading} className="flex flex-col gap-1">
              <p className="meta text-ink-faint px-3 mb-1">{group.heading}</p>
              {group.tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setActiveTab(t.key);
                    setSidebarOpen(false);
                  }}
                  className={`label w-full text-left rounded-md px-3 py-2.5 transition-colors duration-[var(--d-hover)] ease-enter cursor-pointer ${
                    activeTab === t.key
                      ? 'bg-accent-veil text-accent-ink'
                      : 'text-ink-muted hover:text-ink hover:bg-sunken'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
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
                <path
                  d="M2 4h14M2 9h14M2 14h14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <span className="label text-ink-muted">{tab.label}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="meta text-ink-faint hidden sm:block">westernsalesclub.ca</span>
            <ThemeToggle />
          </div>
        </header>

        {/* Section content */}
        <main className="flex-1 p-5 sm:p-8 overflow-auto">
          {tab.kind === 'site_content' && <AdminSiteContent key={tab.key} />}
          {tab.kind === 'images' && <AdminImages key={tab.key} />}
          {tab.kind === 'admins' && <AdminUsers key={tab.key} />}
          {tab.kind === 'content' && (
            <AdminSection
              key={tab.key}
              configKey={tab.key}
              config={CONTENT_CONFIG[tab.key]}
            />
          )}
        </main>
      </div>
    </div>
  );
}
