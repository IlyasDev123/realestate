'use client';

import AppearancePanel from '@/components/dashboard/AppearancePanel';

export default function AgentSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span className="font-semibold uppercase tracking-wider">RMS Enterprise</span>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider">Appearance</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-on-surface font-display">Appearance</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Personalise your dashboard colours and layout.</p>
      </div>

      <AppearancePanel />
    </div>
  );
}
