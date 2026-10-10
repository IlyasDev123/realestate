'use client';

import { useEffect, useState } from 'react';
import { Building2, Phone, Mail, MapPin, Clock, Percent, Save, Settings, Check, AlertCircle } from 'lucide-react';
import { settingsApi, ApiError } from '@/lib/api';
import { ApiSetting } from '@/lib/api-types';

const InputCls = 'w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all';
const LabelCls = 'block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5';

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 border-b border-outline-variant/10 flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
          <Icon size={13} className="text-secondary" />
        </div>
        <h3 className="text-sm font-semibold text-on-surface">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

const TIPS = [
  'Agency name appears on all client-facing documents and reports.',
  'Default commission rate is pre-filled when creating new deals.',
  'Business hours are displayed on the public listing portal.',
];

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Partial<ApiSetting>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    settingsApi.get()
      .then((res) => setForm(res.data))
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(key: keyof ApiSetting, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await settingsApi.update(form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error saving settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span className="font-semibold uppercase tracking-wider">RMS Enterprise</span>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider">Settings</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-on-surface font-display">Agency Settings</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Configure your agency profile and commission defaults.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-error-container/60 border border-error/20 rounded-xl text-sm text-on-error-container">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />{error}
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <Check size={16} className="shrink-0 mt-0.5" />Settings saved successfully.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-7">
        {/* Left panel */}
        <div className="lg:col-span-2 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 p-7 flex flex-col shadow-sm">
          <div className="flex-1">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center mb-5">
              <Settings size={22} className="text-secondary" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-1">System Configuration</p>
            <h2 className="text-xl font-bold text-on-surface mb-2 tracking-tight">Agency Configuration</h2>
            <p className="text-sm text-on-surface-variant/70 leading-relaxed">
              Set your agency&apos;s public profile, contact details, and default commission rates used across all deals and documents.
            </p>
            <div className="mt-6 space-y-3">
              {TIPS.map((tip) => (
                <div key={tip} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={10} className="text-secondary" />
                  </div>
                  <p className="text-xs text-on-surface-variant/60 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-outline-variant/20">
            <p className="text-[11px] text-on-surface-variant/50 leading-relaxed">
              All details can be updated at any time.
            </p>
          </div>
        </div>

        {/* Right form */}
        <div className="lg:col-span-3 space-y-4">
          <form onSubmit={handleSave} className={`space-y-4 transition-opacity ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
            <Section title="Agency Profile" icon={Building2}>
              <div>
                <label className={LabelCls}>Agency Name</label>
                <input type="text" value={form.agency_name ?? ''}
                  onChange={(e) => handleChange('agency_name', e.target.value)}
                  placeholder="EstateLux Real Estate" className={InputCls} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LabelCls}><Phone size={11} className="inline mr-1" />Phone</label>
                  <input type="text" value={form.phone ?? ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+92 300 0000000" className={InputCls} />
                </div>
                <div>
                  <label className={LabelCls}><Mail size={11} className="inline mr-1" />Email</label>
                  <input type="email" value={form.email ?? ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="info@agency.com" className={InputCls} />
                </div>
              </div>
              <div>
                <label className={LabelCls}><MapPin size={11} className="inline mr-1" />Address</label>
                <input type="text" value={form.address ?? ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Office address" className={InputCls} />
              </div>
              <div>
                <label className={LabelCls}><Clock size={11} className="inline mr-1" />Business Hours</label>
                <input type="text" value={form.business_hours ?? ''}
                  onChange={(e) => handleChange('business_hours', e.target.value)}
                  placeholder="Mon–Sat, 9 AM – 6 PM" className={InputCls} />
              </div>
            </Section>

            <Section title="Commission Defaults" icon={Percent}>
              <div>
                <label className={LabelCls}>Default Commission %</label>
                <input type="number" step="0.01" min="0" max="100"
                  value={form.default_commission_pct ?? ''}
                  onChange={(e) => handleChange('default_commission_pct', e.target.value)}
                  placeholder="2.50" className={InputCls} />
                <p className="text-xs text-on-surface-variant/50 mt-1.5">Applied as the starting value when creating new deals.</p>
              </div>
            </Section>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-7 py-2.5 bg-secondary text-on-secondary text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-md">
                {saving
                  ? <><span className="w-4 h-4 border-2 border-on-secondary/30 border-t-on-secondary rounded-full animate-spin" /> Saving…</>
                  : <><Save size={14} /> Save Settings</>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
