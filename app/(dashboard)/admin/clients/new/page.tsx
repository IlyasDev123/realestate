'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Users, Phone, Mail, MapPin,
  StickyNote, Check, AlertCircle, CreditCard, UserCheck,
} from 'lucide-react';
import { clientsApi, ApiError } from '@/lib/api';
import { ApiClient } from '@/lib/api-types';
import { useToast } from '@/components/ui/Toast';

const Inp = 'w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary focus:ring-2 focus:ring-secondary/10 outline-none transition-all';
const Lbl = 'block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5';
const Err = (msg?: string) => msg ? <p className="mt-1 text-xs text-error font-medium">{msg}</p> : null;

const TYPE_CFG: Record<ApiClient['type'], { label: string; desc: string; activeBorder: string; activeBg: string; dotBg: string }> = {
  buyer:    { label: 'Buyer',    desc: 'Looking to purchase',    activeBorder: 'border-secondary', activeBg: 'bg-secondary/8', dotBg: 'bg-secondary' },
  seller:   { label: 'Seller',   desc: 'Listing for sale',       activeBorder: 'border-secondary', activeBg: 'bg-secondary/8', dotBg: 'bg-secondary' },
  tenant:   { label: 'Tenant',   desc: 'Looking to rent',        activeBorder: 'border-secondary', activeBg: 'bg-secondary/8', dotBg: 'bg-secondary' },
  landlord: { label: 'Landlord', desc: 'Renting out a property', activeBorder: 'border-secondary', activeBg: 'bg-secondary/8', dotBg: 'bg-secondary' },
};

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
  'Choose the correct client type — it drives pipeline tracking and reporting.',
  'A phone number is required for all client records.',
  'CNIC is optional but helpful for identity verification on deals.',
];

export default function AdminNewClientPage() {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    cnic: '',
    type: 'buyer' as ApiClient['type'],
    address: '',
    notes: '',
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim())
      e.name = 'Full name is required.';
    else if (form.name.trim().length < 2)
      e.name = 'Name must be at least 2 characters.';
    if (!form.phone.trim())
      e.phone = 'Phone number is required.';
    else if (form.phone.trim().replace(/\D/g, '').length < 7)
      e.phone = 'Enter a valid phone number (min 7 digits).';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = 'Enter a valid email address.';
    if (form.cnic.trim() && !/^\d{5}-\d{7}-\d$/.test(form.cnic.trim()))
      e.cnic = 'CNIC format: 00000-0000000-0';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setSaving(true);
    try {
      await clientsApi.create({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        cnic: form.cnic.trim() || undefined,
        type: form.type,
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      toast('Client created successfully');
      router.push('/admin/clients');
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
        <span className="font-semibold text-secondary uppercase tracking-wider">Clients</span>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider">New Client</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-on-surface font-display">Add New Client</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Register a buyer, seller, tenant or landlord.</p>
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
              <Users size={22} className="text-secondary" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-1">Client Management</p>
            <h2 className="text-xl font-bold text-on-surface mb-2 tracking-tight">Register a Client</h2>
            <p className="text-sm text-on-surface-variant/70 leading-relaxed">
              Every buyer, seller, tenant, or landlord you work with should have a record in the system for full deal traceability.
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
              Fields marked <span className="text-secondary font-bold">*</span> are required. All details can be edited later.
            </p>
          </div>
        </div>

        {/* Right form */}
        <div className="lg:col-span-3 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">

            <Section title="Client Type" icon={UserCheck}>
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(TYPE_CFG) as [ApiClient['type'], typeof TYPE_CFG[ApiClient['type']]][]).map(([type, cfg]) => (
                  <button key={type} type="button" onClick={() => set('type', type)}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                      form.type === type
                        ? `${cfg.activeBorder} ${cfg.activeBg} shadow-sm`
                        : 'border-outline-variant bg-surface-container-low hover:border-outline'
                    }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${form.type === type ? cfg.dotBg : 'bg-outline-variant'}`} />
                      <span className={`text-sm font-semibold ${form.type === type ? 'text-on-surface' : 'text-on-surface-variant'}`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-snug pl-4">{cfg.desc}</p>
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Contact Information" icon={Users}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={Lbl}>Full Name <span className="text-error">*</span></label>
                  <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
                    placeholder="Client full name"
                    className={fieldErrors.name ? `${Inp} border-error focus:ring-error/10` : Inp} />
                  {Err(fieldErrors.name)}
                </div>
                <div>
                  <label className={Lbl}>Phone Number <span className="text-error">*</span></label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
                    <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
                      placeholder="+92 300 0000000"
                      className={`${fieldErrors.phone ? `${Inp} border-error focus:ring-error/10` : Inp} pl-10`} />
                  </div>
                  {Err(fieldErrors.phone)}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={Lbl}>Email Address</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
                    <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                      placeholder="client@example.com"
                      className={`${fieldErrors.email ? `${Inp} border-error focus:ring-error/10` : Inp} pl-10`} />
                  </div>
                  {Err(fieldErrors.email)}
                </div>
                <div>
                  <label className={Lbl}>CNIC</label>
                  <div className="relative">
                    <CreditCard size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
                    <input type="text" value={form.cnic} onChange={(e) => set('cnic', e.target.value)}
                      placeholder="00000-0000000-0"
                      className={`${fieldErrors.cnic ? `${Inp} border-error focus:ring-error/10` : Inp} pl-10`} />
                  </div>
                  {Err(fieldErrors.cnic)}
                </div>
              </div>
            </Section>

            <Section title="Additional Details" icon={StickyNote}>
              <div>
                <label className={Lbl}>Address</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
                  <input type="text" value={form.address} onChange={(e) => set('address', e.target.value)}
                    placeholder="Enter address" className={`${Inp} pl-10`} />
                </div>
              </div>
              <div>
                <label className={Lbl}>Notes</label>
                <div className="relative">
                  <StickyNote size={14} className="absolute left-3.5 top-3.5 text-on-surface-variant/50 pointer-events-none" />
                  <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
                    rows={3} placeholder="Any additional notes about this client…" className={`${Inp} resize-none pl-10`} />
                </div>
              </div>
            </Section>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-7 py-2.5 bg-secondary text-on-secondary text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-md">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Add Client'}
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
