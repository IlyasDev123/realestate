'use client';

import { useState } from 'react';
import { User, Phone, Lock, Eye, EyeOff, Save, UserCircle, Check, AlertCircle } from 'lucide-react';
import { profileApi, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

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
  'Your email address cannot be changed after registration.',
  'Leave password fields blank to keep your current password.',
  'Changes take effect immediately after saving.',
];

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const roleLabel = user?.role === 'super_admin'
    ? 'Super Admin'
    : user?.role === 'manager'
    ? 'Manager'
    : 'Advisory Agent';

  const initials = user?.full_name
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'U';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword && !currentPassword) {
      setError('Current password is required to set a new password.');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, string> = { full_name: fullName };
      if (phone) payload.phone = phone;
      if (newPassword) {
        payload.current_password = currentPassword;
        payload.password = newPassword;
        payload.password_confirmation = confirmPassword;
      }

      const res = await profileApi.update(payload);
      const token = typeof window !== 'undefined' ? localStorage.getItem('haven_token') ?? '' : '';
      login(token, res.data);
      setSuccess('Profile updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.errors ? Object.values(err.errors).flat().join('. ') : err.message);
      } else {
        setError('An unexpected error occurred.');
      }
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
        <span className="font-semibold text-secondary uppercase tracking-wider">Account Settings</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-on-surface font-display">Account Settings</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Update your profile and change your password.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-error-container/60 border border-error/20 rounded-xl text-sm text-on-error-container">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />{error}
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <Check size={16} className="shrink-0 mt-0.5" />{success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-7">
        {/* Left panel */}
        <div className="lg:col-span-2 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 p-7 flex flex-col shadow-sm">
          <div className="flex-1">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-on-secondary text-2xl font-bold shadow-md mb-5">
              {initials}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-1">Account Settings</p>
            <h2 className="text-xl font-bold text-on-surface mb-0.5 tracking-tight">{user?.full_name}</h2>
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">{roleLabel}</p>
            <p className="text-sm text-on-surface-variant/60 text-xs">{user?.email}</p>
            <p className="text-sm text-on-surface-variant/70 leading-relaxed mt-4">
              Keep your profile information accurate and your account secured with a strong password.
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
            <Section title="Profile Information" icon={User}>
              <div>
                <label className={LabelCls}>Full Name <span className="text-error">*</span></label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name" className={InputCls} />
              </div>
              <div>
                <label className={LabelCls}><Phone size={11} className="inline mr-1" />Phone</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 0000000" className={InputCls} />
              </div>
              <div>
                <label className={LabelCls}>Email Address</label>
                <input type="email" value={user?.email ?? ''} disabled
                  className={`${InputCls} opacity-50 cursor-not-allowed`} />
                <p className="text-xs text-on-surface-variant/50 mt-1">Email cannot be changed.</p>
              </div>
            </Section>

            <Section title="Change Password" icon={Lock}>
              <p className="text-xs text-on-surface-variant/60">Leave blank to keep your current password.</p>
              <div>
                <label className={LabelCls}>Current Password</label>
                <div className="relative">
                  <input type={showCurrent ? 'text' : 'password'} value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••" className={`${InputCls} pr-11`} />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors">
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className={LabelCls}>New Password</label>
                <div className="relative">
                  <input type={showNew ? 'text' : 'password'} value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••" className={`${InputCls} pr-11`} />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors">
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className={LabelCls}>Confirm New Password</label>
                <input type="password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" className={InputCls} />
              </div>
            </Section>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-7 py-2.5 bg-secondary text-on-secondary text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-md">
                {saving
                  ? <><span className="w-4 h-4 border-2 border-on-secondary/30 border-t-on-secondary rounded-full animate-spin" /> Saving…</>
                  : <><Save size={14} /> Save Changes</>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
