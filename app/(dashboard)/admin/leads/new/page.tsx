'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, GitBranch, UserPlus, Phone, Mail, CalendarClock, StickyNote, Check, AlertCircle } from 'lucide-react';
import { leadsApi, agentsApi } from '@/lib/api';
import { ApiAgent, CreateLeadPayload } from '@/lib/api-types';
import { ApiError } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const Inp = 'w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary focus:ring-2 focus:ring-secondary/10 outline-none transition-all';
const Lbl = 'block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5';
const Err = (msg?: string) => msg ? <p className="mt-1 text-xs text-error font-medium">{msg}</p> : null;

const SOURCES = [
  { value: 'walk_in',      label: 'Walk-In' },
  { value: 'referral',     label: 'Referral' },
  { value: 'call',         label: 'Phone Call' },
  { value: 'website',      label: 'Website' },
  { value: 'contact_form', label: 'Contact Form' },
];
const STATUSES = [
  { value: 'new',         label: 'New' },
  { value: 'contacted',   label: 'Contacted' },
  { value: 'site_visit',  label: 'Site Visit' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed_won',  label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' },
];

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
  "Always capture a valid phone number — it's the primary contact channel.",
  'Select the correct source for accurate pipeline attribution reports.',
  'Set a follow-up date to keep the lead from going cold.',
];

export default function AdminNewLeadPage() {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [agents, setAgents] = useState<ApiAgent[]>([]);

  const [form, setForm] = useState({
    client_name: '',
    phone: '',
    email: '',
    source: 'walk_in' as CreateLeadPayload['source'],
    status: 'new' as NonNullable<CreateLeadPayload['status']>,
    assigned_agent_id: '',
    notes: '',
    next_followup_at: '',
  });

  useEffect(() => {
    agentsApi.list({ per_page: 100 })
      .then((res) => setAgents(res.data.filter((a) => a.approval_status === 'approved')))
      .catch(() => {});
  }, []);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.client_name.trim())
      e.client_name = 'Full name is required.';
    else if (form.client_name.trim().length < 2)
      e.client_name = 'Name must be at least 2 characters.';
    if (!form.phone.trim())
      e.phone = 'Phone number is required.';
    else if (form.phone.trim().replace(/\D/g, '').length < 7)
      e.phone = 'Enter a valid phone number (min 7 digits).';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = 'Enter a valid email address.';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setSaving(true);
    try {
      await leadsApi.create({
        client_name: form.client_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        source: form.source,
        status: form.status,
        assigned_agent_id: form.assigned_agent_id || undefined,
        notes: form.notes.trim() || undefined,
        next_followup_at: form.next_followup_at || undefined,
      });
      toast('Lead created successfully');
      router.push('/admin/leads');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.errors) {
          const flat: Record<string, string> = {};
          Object.entries(err.errors).forEach(([k, v]) => { flat[k] = v[0]; });
          setFieldErrors(flat);
        }
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span className="font-semibold uppercase tracking-wider">RMS Enterprise</span>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider">Leads</span>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider">New Lead</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-on-surface font-display">Add New Lead</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Register a walk-in client or manually create a new lead.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-error-container/60 border border-error/20 rounded-xl text-sm text-on-error-container">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />{error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-7">
        {/* Left panel */}
        <div className="lg:col-span-2 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 p-7 flex flex-col shadow-sm">
          <div className="flex-1">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center mb-5">
              <GitBranch size={22} className="text-secondary" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-1">Lead Management</p>
            <h2 className="text-xl font-bold text-on-surface mb-2 tracking-tight">Capture a New Lead</h2>
            <p className="text-sm text-on-surface-variant/70 leading-relaxed">
              Record every enquiry the moment it arrives. Leads in the pipeline convert at 3× the rate of cold contacts.
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
              Fields marked <span className="text-secondary font-bold">*</span> are required. All other fields can be updated from the lead detail view.
            </p>
          </div>
        </div>

        {/* Right form */}
        <div className="lg:col-span-3 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Section title="Client Information" icon={UserPlus}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={Lbl}>Full Name <span className="text-error">*</span></label>
                  <input type="text" value={form.client_name} onChange={(e) => set('client_name', e.target.value)}
                    placeholder="Client full name"
                    className={fieldErrors.client_name ? `${Inp} border-error focus:ring-error/10` : Inp} />
                  {Err(fieldErrors.client_name)}
                </div>
                <div>
                  <label className={Lbl}>Phone <span className="text-error">*</span></label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
                    <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
                      placeholder="+92 300 0000000"
                      className={`${fieldErrors.phone ? `${Inp} border-error focus:ring-error/10` : Inp} pl-10`} />
                  </div>
                  {Err(fieldErrors.phone)}
                </div>
              </div>
              <div>
                <label className={Lbl}>Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
                  <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                    placeholder="client@example.com"
                    className={`${fieldErrors.email ? `${Inp} border-error focus:ring-error/10` : Inp} pl-10`} />
                </div>
                {Err(fieldErrors.email)}
              </div>
            </Section>

            <Section title="Lead Configuration" icon={GitBranch}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={Lbl}>Source <span className="text-error">*</span></label>
                  <select value={form.source} onChange={(e) => set('source', e.target.value)} className={Inp}>
                    {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={Lbl}>Initial Status</label>
                  <select value={form.status} onChange={(e) => set('status', e.target.value)} className={Inp}>
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={Lbl}>Assign to Agent</label>
                  <select value={form.assigned_agent_id} onChange={(e) => set('assigned_agent_id', e.target.value)} className={Inp}>
                    <option value="">— Unassigned —</option>
                    {agents.map((a) => <option key={a.id} value={a.id}>{a.user?.full_name ?? a.id}</option>)}
                  </select>
                </div>
                <div>
                  <label className={Lbl}>Next Follow-up</label>
                  <div className="relative">
                    <CalendarClock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
                    <input type="datetime-local" value={form.next_followup_at} onChange={(e) => set('next_followup_at', e.target.value)}
                      className={`${Inp} pl-10`} />
                  </div>
                </div>
              </div>
              <div>
                <label className={Lbl}>Notes</label>
                <div className="relative">
                  <StickyNote size={14} className="absolute left-3.5 top-3.5 text-on-surface-variant/50 pointer-events-none" />
                  <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
                    rows={3} placeholder="Any additional details about the lead…" className={`${Inp} resize-none pl-10`} />
                </div>
              </div>
            </Section>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-7 py-2.5 bg-secondary text-on-secondary text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-md">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : 'Create Lead'}
              </button>
              <button type="button" onClick={() => router.back()} disabled={saving}
                className="px-5 py-2.5 border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline disabled:opacity-40 rounded-xl text-sm font-medium transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
