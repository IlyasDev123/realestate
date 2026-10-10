'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, DollarSign, Building2, Users, UserCog,
  Percent, CreditCard, Calendar, StickyNote, Check, AlertCircle,
} from 'lucide-react';
import { dealsApi, propertiesApi, clientsApi, agentsApi, ApiError } from '@/lib/api';
import { ApiProperty, ApiClient, ApiAgent } from '@/lib/api-types';
import { useToast } from '@/components/ui/Toast';

const Inp = 'w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary focus:ring-2 focus:ring-secondary/10 outline-none transition-all';
const InpErr = 'w-full px-4 py-2.5 bg-surface-container-low border border-error rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-error focus:ring-2 focus:ring-error/10 outline-none transition-all';
const Lbl = 'block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5';
const Err = (msg?: string) => msg ? <p className="mt-1 text-xs text-error font-medium flex items-center gap-1"><AlertCircle size={11} />{msg}</p> : null;

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
  'Select the property and client before setting financial terms.',
  'Deal type is auto-set from the property purpose but can be overridden.',
  'Set payment status to Pending if payment has not yet been received.',
];

const PROP_STATUS_LABEL: Record<string, string> = {
  available: '✓ Available',
  reserved:  '⏳ Reserved',
  draft:     '— Draft',
  sold:      '✗ Sold',
  rented:    '✗ Rented',
};

export default function AdminNewDealPage() {
  const router = useRouter();
  const toast = useToast();
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [clients,    setClients]    = useState<ApiClient[]>([]);
  const [agents,     setAgents]     = useState<ApiAgent[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    property_id:    '',
    client_id:      '',
    agent_id:       '',
    deal_type:      'sale' as 'sale' | 'rent',
    amount:         '',
    commission_pct: '',
    payment_status: 'pending' as 'pending' | 'partial' | 'paid',
    payment_date:   '',
    deal_status:    'pending' as 'pending' | 'confirmed' | 'completed',
    notes:          '',
  });

  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      propertiesApi.list({ per_page: 100 }),
      clientsApi.list({ per_page: 100 }),
      agentsApi.list({ per_page: 100 }),
    ])
      .then(([propsRes, clientsRes, agentsRes]) => {
        setProperties(propsRes.data);
        setClients(clientsRes.data);
        setAgents(agentsRes.data.filter((a) => a.approval_status === 'approved'));
      })
      .catch(() => setError('Failed to load form data.'))
      .finally(() => setLoadingData(false));
  }, []);

  function upd(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  // When property changes, auto-derive deal_type from its purpose
  function handlePropertyChange(propertyId: string) {
    const prop = properties.find((p) => p.id === propertyId);
    setForm((f) => ({
      ...f,
      property_id: propertyId,
      deal_type: prop ? prop.purpose : f.deal_type,
    }));
    setFieldErrors((e) => { const n = { ...e }; delete n.property_id; return n; });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.property_id)
      e.property_id = 'Select a property.';
    if (!form.client_id)
      e.client_id = 'Select a client.';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = 'Enter a valid amount greater than 0.';
    if (form.commission_pct === '' || isNaN(Number(form.commission_pct)))
      e.commission_pct = 'Enter a valid commission percentage.';
    else if (Number(form.commission_pct) < 0)
      e.commission_pct = 'Commission cannot be negative.';
    else if (Number(form.commission_pct) > 100)
      e.commission_pct = 'Commission cannot exceed 100%.';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await dealsApi.create({
        property_id:    form.property_id,
        client_id:      form.client_id,
        agent_id:       form.agent_id || undefined,
        deal_type:      form.deal_type,
        amount:         Number(form.amount),
        commission_pct: Number(form.commission_pct),
        payment_status: form.payment_status,
        payment_date:   form.payment_date || null,
        deal_status:    form.deal_status,
        notes:          form.notes || undefined,
      });
      toast('Deal created successfully');
      router.push(`/admin/deals/${res.data.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.errors) {
          setFieldErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]])));
        }
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setSaving(false);
    }
  }

  // Separate active vs inactive properties for better UX in the dropdown
  const activeProps    = properties.filter((p) => p.status === 'available' || p.status === 'reserved');
  const inactiveProps  = properties.filter((p) => p.status !== 'available' && p.status !== 'reserved');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span className="font-semibold uppercase tracking-wider">RMS Enterprise</span>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider">Deals</span>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider">New Deal</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-on-surface font-display">Create New Deal</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Record a new sale or rental transaction.</p>
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
              <DollarSign size={22} className="text-secondary" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-1">Deal Management</p>
            <h2 className="text-xl font-bold text-on-surface mb-2 tracking-tight">Record a New Deal</h2>
            <p className="text-sm text-on-surface-variant/70 leading-relaxed">
              Every closed sale or rental should be recorded immediately. Deals drive commission tracking and revenue reports.
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
              Fields marked <span className="text-secondary font-bold">*</span> are required.
            </p>
          </div>
        </div>

        {/* Right form */}
        <div className="lg:col-span-3 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">

            <Section title="Parties" icon={Building2}>
              <div>
                <label className={Lbl}>Property <span className="text-error">*</span></label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
                  <select
                    value={form.property_id}
                    onChange={(e) => handlePropertyChange(e.target.value)}
                    className={`${fieldErrors.property_id ? InpErr : Inp} pl-10`}
                    disabled={loadingData}
                  >
                    <option value="">{loadingData ? 'Loading properties…' : 'Select a property…'}</option>
                    {activeProps.length > 0 && (
                      <optgroup label="Active">
                        {activeProps.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} — {p.city} · {PROP_STATUS_LABEL[p.status] ?? p.status}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {inactiveProps.length > 0 && (
                      <optgroup label="Unavailable">
                        {inactiveProps.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} — {p.city} · {PROP_STATUS_LABEL[p.status] ?? p.status}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
                {Err(fieldErrors.property_id)}
              </div>
              <div>
                <label className={Lbl}>Client <span className="text-error">*</span></label>
                <div className="relative">
                  <Users size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
                  <select
                    value={form.client_id}
                    onChange={(e) => upd('client_id', e.target.value)}
                    className={`${fieldErrors.client_id ? InpErr : Inp} pl-10`}
                    disabled={loadingData}
                  >
                    <option value="">{loadingData ? 'Loading clients…' : clients.length === 0 ? 'No clients yet' : 'Select a client…'}</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                    ))}
                  </select>
                </div>
                {Err(fieldErrors.client_id)}
                {!loadingData && clients.length === 0 && (
                  <p className="mt-1 text-xs text-on-surface-variant">
                    <a href="/admin/clients/new" className="text-secondary hover:underline">Add a client first →</a>
                  </p>
                )}
              </div>
              <div>
                <label className={Lbl}>Assign Agent</label>
                <div className="relative">
                  <UserCog size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
                  <select value={form.agent_id} onChange={(e) => upd('agent_id', e.target.value)}
                    className={`${Inp} pl-10`} disabled={loadingData}>
                    <option value="">{loadingData ? 'Loading agents…' : '— No agent assigned —'}</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>{a.user?.full_name ?? a.id}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Section>

            <Section title="Transaction Details" icon={DollarSign}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={Lbl}>Deal Type <span className="text-error">*</span></label>
                  <select value={form.deal_type} onChange={(e) => upd('deal_type', e.target.value)} className={Inp}>
                    <option value="sale">Sale</option>
                    <option value="rent">Rent</option>
                  </select>
                  {form.property_id && (
                    <p className="mt-1 text-xs text-on-surface-variant/50">Auto-set from property purpose. Override if needed.</p>
                  )}
                </div>
                <div>
                  <label className={Lbl}>Deal Status</label>
                  <select value={form.deal_status} onChange={(e) => upd('deal_status', e.target.value)} className={Inp}>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={Lbl}>Amount (PKR) <span className="text-error">*</span></label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
                    <input type="number" min="0" step="0.01" value={form.amount}
                      onChange={(e) => upd('amount', e.target.value)}
                      placeholder="0.00" className={`${fieldErrors.amount ? InpErr : Inp} pl-10`} />
                  </div>
                  {Err(fieldErrors.amount)}
                </div>
                <div>
                  <label className={Lbl}>Commission % <span className="text-error">*</span></label>
                  <div className="relative">
                    <Percent size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
                    <input type="number" min="0" max="100" step="0.01" value={form.commission_pct}
                      onChange={(e) => upd('commission_pct', e.target.value)}
                      placeholder="2.50" className={`${fieldErrors.commission_pct ? InpErr : Inp} pl-10`} />
                  </div>
                  {Err(fieldErrors.commission_pct)}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={Lbl}>Payment Status</label>
                  <div className="relative">
                    <CreditCard size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
                    <select value={form.payment_status} onChange={(e) => upd('payment_status', e.target.value)} className={`${Inp} pl-10`}>
                      <option value="pending">Pending</option>
                      <option value="partial">Partial</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={Lbl}>Payment Date</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
                    <input type="date" value={form.payment_date}
                      onChange={(e) => upd('payment_date', e.target.value)}
                      className={`${Inp} pl-10`} />
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Notes" icon={StickyNote}>
              <div className="relative">
                <StickyNote size={14} className="absolute left-3.5 top-3.5 text-on-surface-variant/50 pointer-events-none" />
                <textarea value={form.notes} onChange={(e) => upd('notes', e.target.value)}
                  rows={4} placeholder="Any additional notes about this deal…" className={`${Inp} resize-none pl-10`} />
              </div>
            </Section>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-7 py-2.5 bg-secondary text-on-secondary text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-md">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : 'Create Deal'}
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
