'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/providers/admin-auth-provider';
import { CONTENT_CONFIG } from '@/lib/admin-config';
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
    <div className="min-h-screen bg-[var(--color-bg-base)] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-56 bg-[var(--color-bg-elevated)] border-r border-[var(--color-border)] z-30 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="px-5 py-6 border-b border-[var(--color-border)]">
          <p className="font-mono text-[var(--color-gold)] text-xs tracking-[0.3em] uppercase mb-1">
            WSC Admin
          </p>
          <p className="text-[var(--color-text-subtle)] font-mono text-xs">
            Content Manager
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSidebarOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 font-mono text-xs tracking-[0.12em] uppercase transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-[var(--color-gold-dim)] text-[var(--color-gold)] border-l-2 border-[var(--color-gold)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] border-l-2 border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="px-3 py-4 border-t border-[var(--color-border)] space-y-1">
          <a
            href="/"
            className="flex items-center px-3 py-2.5 font-mono text-xs tracking-[0.12em] uppercase text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
          >
            ← Back to site
          </a>
          <button
            onClick={signOut}
            className="w-full text-left px-3 py-2.5 font-mono text-xs tracking-[0.12em] uppercase text-[var(--color-text-muted)] hover:text-red-400 hover:bg-[var(--color-bg-subtle)] transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-[var(--color-border)] flex items-center justify-between px-5 bg-[var(--color-bg-elevated)] shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              className="lg:hidden text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <span className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--color-text-muted)]">
              {config.displayName}
            </span>
          </div>
          <span className="font-mono text-xs text-[var(--color-text-subtle)] hidden sm:block">
            westernsalesclub.ca
          </span>
        </header>

        {/* Section content */}
        <main className="flex-1 p-5 sm:p-8 overflow-auto">
          <AdminSection key={activeTab} configKey={activeTab} config={config} />
        </main>
      </div>
    </div>
  );
}
