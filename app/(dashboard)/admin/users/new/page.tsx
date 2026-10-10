'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Shield, Users, UserCog, Lock, Briefcase,
  Phone, Mail, Check, AlertCircle, CreditCard, Calendar, FileText,
} from 'lucide-react';
import { adminApi, ApiError } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const Inp = 'w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary focus:ring-2 focus:ring-secondary/10 outline-none transition-all';
const Lbl = 'block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5';
const Err = (msg?: string) => msg ? <p className="mt-1 text-xs text-error font-medium">{msg}</p> : null;

type RoleType = 'agent' | 'manager';

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
  'Agent accounts are auto-approved and immediately active in the system.',
  'Manager accounts can view all data but cannot create or close deals.',
  'Use a strong password — accounts are tied to real transaction records.',
];

export default function AdminNewUserPage() {
  const router = useRouter();
  const toast = useToast();
  const [role, setRole] = useState<RoleType>('agent');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    cnic: '',
    specialization: '',
    bio: '',
    commission_default_pct: '',
    joining_date: '',
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (form.password !== form.password_confirmation) {
      setFieldErrors({ password_confirmation: 'Passwords do not match.' });
      return;
    }

    setSaving(true);
    try {
      await adminApi.createUser({
        role,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
        phone: form.phone.trim() || undefined,
        ...(role === 'agent' && {
          cnic: form.cnic.trim() || undefined,
          specialization: form.specialization.trim() || undefined,
          bio: form.bio.trim() || undefined,
          commission_default_pct: form.commission_default_pct
            ? parseFloat(form.commission_default_pct)
            : undefined,
          joining_date: form.joining_date || undefined,
        }),
      });
      toast('User account created successfully');
      router.push('/admin/users');
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
        <span className="font-semibold text-secondary uppercase tracking-wider">Users</span>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider">Add User</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-on-surface font-display">Add New User</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Create an agent or manager account directly.</p>
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
              <Shield size={22} className="text-secondary" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-1">User Management</p>
            <h2 className="text-xl font-bold text-on-surface mb-2 tracking-tight">Create a User Account</h2>
            <p className="text-sm text-on-surface-variant/70 leading-relaxed">
              Grant team members access to the RMS platform. All activity is logged and attributed to the account holder.
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
              Fields marked <span className="text-secondary font-bold">*</span> are required. Agent profile details can be updated later.
            </p>
          </div>
        </div>

        {/* Right form */}
        <div className="lg:col-span-3 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">

            <Section title="Account Type" icon={Users}>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'agent',   label: 'Agent',   desc: 'Auto-approved, manages properties & deals', Icon: Users },
                  { value: 'manager', label: 'Manager', desc: 'Office manager, read-only on all data',      Icon: UserCog },
                ] as const).map(({ value, label, desc, Icon }) => (
                  <button key={value} type="button" onClick={() => setRole(value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      role === value
                        ? 'border-secondary bg-secondary/8 shadow-sm'
                        : 'border-outline-variant bg-surface-container-low hover:border-outline'
                    }`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${role === value ? 'bg-secondary/15' : 'bg-surface-container-highest'}`}>
                        <Icon size={13} className={role === value ? 'text-secondary' : 'text-on-surface-variant'} />
                      </div>
                      <span className={`text-sm font-semibold ${role === value ? 'text-on-surface' : 'text-on-surface-variant'}`}>{label}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-snug">{desc}</p>
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Account Details" icon={Lock}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={Lbl}>Full Name <span className="text-error">*</span></label>
                  <input type="text" value={form.full_name} onChange={(e) => set('full_name', e.target.value)}
                    placeholder="Enter full name" required className={Inp} />
                  {Err(fieldErrors.full_name)}
                </div>
                <div>
                  <label className={Lbl}>Phone Number</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
                    <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
                      placeholder="+92 300 0000000" className={`${Inp} pl-10`} />
                  </div>
                </div>
              </div>
              <div>
                <label className={Lbl}>Email Address <span className="text-error">*</span></label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
                  <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                    placeholder="user@example.com" required className={`${Inp} pl-10`} />
                </div>
                {Err(fieldErrors.email)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={Lbl}>Password <span className="text-error">*</span></label>
                  <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)}
                    placeholder="Min. 8 characters" required className={Inp} />
                  {Err(fieldErrors.password)}
                </div>
                <div>
                  <label className={Lbl}>Confirm Password <span className="text-error">*</span></label>
                  <input type="password" value={form.password_confirmation} onChange={(e) => set('password_confirmation', e.target.value)}
                    placeholder="Repeat password" required className={Inp} />
                  {Err(fieldErrors.password_confirmation)}
                </div>
              </div>
            </Section>

            {role === 'agent' && (
              <Section title="Agent Profile" icon={Briefcase}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={Lbl}>CNIC</label>
                    <div className="relative">
                      <CreditCard size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
                      <input type="text" value={form.cnic} onChange={(e) => set('cnic', e.target.value)}
                        placeholder="00000-0000000-0" className={`${Inp} pl-10`} />
                    </div>
                    {Err(fieldErrors.cnic)}
                  </div>
                  <div>
                    <label className={Lbl}>Specialization</label>
                    <input type="text" value={form.specialization} onChange={(e) => set('specialization', e.target.value)}
                      placeholder="e.g. Residential Sales" className={Inp} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={Lbl}>Commission Rate (%)</label>
                    <input type="number" min="0" max="100" step="0.1" value={form.commission_default_pct}
                      onChange={(e) => set('commission_default_pct', e.target.value)}
                      placeholder="e.g. 7.5" className={Inp} />
                  </div>
                  <div>
                    <label className={Lbl}>Joining Date</label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
                      <input type="date" value={form.joining_date} onChange={(e) => set('joining_date', e.target.value)}
                        className={`${Inp} pl-10`} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={Lbl}>Bio</label>
                  <div className="relative">
                    <FileText size={14} className="absolute left-3.5 top-3.5 text-on-surface-variant/50 pointer-events-none" />
                    <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)}
                      rows={3} placeholder="Agent biography or professional notes…" className={`${Inp} resize-none pl-10`} />
                  </div>
                </div>
              </Section>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-7 py-2.5 bg-secondary text-on-secondary text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-md">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : `Create ${role === 'agent' ? 'Agent' : 'Manager'} Account`}
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
