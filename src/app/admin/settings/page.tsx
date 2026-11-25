import type { Metadata } from 'next';
import SettingsGate from './settings-gate';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return <SettingsGate />;
}
