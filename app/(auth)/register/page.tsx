'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus, CheckCircle2, Building2, ShieldCheck, ArrowRight } from 'lucide-react';
import { authApi, ApiError } from '@/lib/api';

interface FormState {
  full_name: string; email: string; password: string; password_confirmation: string;
  phone: string; cnic: string; specialization: string; bio: string;
}

const initial: FormState = {
  full_name: '', email: '', password: '', password_confirmation: '',
  phone: '', cnic: '', specialization: '', bio: '',
};

const InputCls = 'w-full h-12 px-4 bg-surface-container-low/70 text-on-surface text-sm placeholder:text-outline/60 focus:outline-none rounded-lg focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/20 transition-all';
const LabelCls = 'block text-sm font-medium text-on-surface mb-1.5';

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>(initial);
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError('');

    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: 'Passwords do not match' });
      return;
    }

    setSubmitting(true);
    try {
      await authApi.register({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        phone: form.phone || undefined,
        cnic: form.cnic || undefined,
        specialization: form.specialization || undefined,
        bio: form.bio || undefined,
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
        if (err.errors) {
          const mapped: Partial<Record<keyof FormState, string>> = {};
          for (const [k, v] of Object.entries(err.errors)) {
            mapped[k as keyof FormState] = v[0];
          }
          setErrors(mapped);
        }
      } else {
        setApiError('An unexpected error occurred.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-[440px] px-4 sm:px-0">
        <div className="relative bg-surface-container-lowest/95 backdrop-blur-xl rounded-xl p-10 shadow-xl text-center">
          <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-secondary/70 to-transparent rounded-full" />
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-on-surface font-display mb-2">Application Submitted!</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
            Your agent account registration has been received. An administrator will review and approve your account. You will be able to log in once approved.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-secondary to-secondary-container text-on-secondary font-semibold py-2.5 px-6 rounded-lg text-sm transition-all shadow-md hover:shadow-lg"
          >
            Back to Login <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg px-4 sm:px-0">
      {/* Security badge */}
      <div className="flex items-center justify-center mb-6">
        <div className="inline-flex items-center gap-2 bg-surface-container-lowest/80 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-[11px] font-semibold text-primary-container tracking-wide uppercase">
            Agent Partner Application
          </span>
        </div>
      </div>

      <div className="relative bg-surface-container-lowest/95 backdrop-blur-xl rounded-xl p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-secondary/70 to-transparent rounded-full" />

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="relative mb-4">
            <div className="w-14 h-14 rounded-lg bg-surface-container-low shadow-sm flex items-center justify-center">
              <Building2 size={24} className="text-primary-container" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-primary-container text-on-primary rounded-full p-0.5 flex items-center justify-center shadow">
              <ShieldCheck size={11} />
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface font-display">Agent Registration</h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-sm">
            Create your advisory partner account. Pending admin approval before login.
          </p>
        </div>

        {apiError && (
          <div className="mb-5 p-3 rounded-lg bg-error-container border border-error/20 text-on-error-container text-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={LabelCls}>Full Name <span className="text-error">*</span></label>
              <input type="text" required placeholder="Jane Smith" value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
                className={`${InputCls} ${errors.full_name ? 'ring-2 ring-error/30' : ''}`} />
              {errors.full_name && <p className="mt-1 text-xs text-error">{errors.full_name}</p>}
            </div>
            <div className="col-span-2">
              <label className={LabelCls}>Email <span className="text-error">*</span></label>
              <input type="email" required placeholder="advisor@estateluxrealty.com" value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className={`${InputCls} ${errors.email ? 'ring-2 ring-error/30' : ''}`} />
              {errors.email && <p className="mt-1 text-xs text-error">{errors.email}</p>}
            </div>
            <div>
              <label className={LabelCls}>Password <span className="text-error">*</span></label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required minLength={8}
                  placeholder="Min. 8 characters" value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  className={`${InputCls} pr-10 ${errors.password ? 'ring-2 ring-error/30' : ''}`} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-error">{errors.password}</p>}
            </div>
            <div>
              <label className={LabelCls}>Confirm Password <span className="text-error">*</span></label>
              <input type="password" required placeholder="••••••••" value={form.password_confirmation}
                onChange={(e) => set('password_confirmation', e.target.value)}
                className={`${InputCls} ${errors.password_confirmation ? 'ring-2 ring-error/30' : ''}`} />
              {errors.password_confirmation && <p className="mt-1 text-xs text-error">{errors.password_confirmation}</p>}
            </div>
            <div>
              <label className={LabelCls}>Phone</label>
              <input type="text" placeholder="+92 300 1234567" value={form.phone}
                onChange={(e) => set('phone', e.target.value)} className={InputCls} />
            </div>
            <div>
              <label className={LabelCls}>CNIC</label>
              <input type="text" placeholder="35201-1234567-1" value={form.cnic}
                onChange={(e) => set('cnic', e.target.value)} className={InputCls} />
            </div>
            <div className="col-span-2">
              <label className={LabelCls}>Specialization</label>
              <input type="text" placeholder="e.g. Residential, Commercial" value={form.specialization}
                onChange={(e) => set('specialization', e.target.value)} className={InputCls} />
            </div>
            <div className="col-span-2">
              <label className={LabelCls}>Bio</label>
              <textarea rows={3} placeholder="Brief professional bio..."
                value={form.bio} onChange={(e) => set('bio', e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-low/70 text-on-surface text-sm placeholder:text-outline/60 focus:outline-none rounded-lg focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/20 transition-all resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 mt-2 bg-gradient-to-r from-secondary to-secondary-container hover:from-on-secondary-container hover:to-secondary text-on-secondary font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-on-secondary/30 border-t-on-secondary rounded-full animate-spin" />
            ) : (
              <UserPlus size={16} />
            )}
            {submitting ? 'Submitting…' : 'Submit Application'}
          </button>
        </form>

        <div className="mt-6 pt-4 bg-surface-container-low/40 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 px-6 sm:px-8 pb-4 rounded-b-xl text-center">
          <p className="text-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary-container hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
