'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Building2, ShieldCheck, Key, ArrowRight } from 'lucide-react';
import { authApi, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      const role = user.role ?? '';
      if (role === 'super_admin' || role === 'manager') router.replace('/admin');
      else if (role === 'agent') router.replace('/agent');
    }
  }, [user, isLoading, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await authApi.login({ email: form.email, password: form.password });
      login(res.token, res.user);
      const role = res.user.role ?? '';
      if (role === 'super_admin' || role === 'manager') router.push('/admin');
      else router.push('/agent');
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[440px] px-4 sm:px-0">
      {/* Security badge pill */}
      <div className="flex items-center justify-center mb-6">
        <div className="inline-flex items-center gap-2 bg-surface-container-lowest/80 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-[11px] font-semibold text-primary-container tracking-wide uppercase">
            RMS Node: 04-East • Encrypted Session
          </span>
        </div>
      </div>

      {/* Login card */}
      <div className="relative bg-surface-container-lowest/95 backdrop-blur-xl rounded-xl p-6 sm:p-10 shadow-xl">
        {/* Luxury accent line */}
        <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-secondary/70 to-transparent rounded-full" />

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-lg bg-surface-container-low shadow-sm flex items-center justify-center">
              <Building2 size={28} className="text-primary-container" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-primary-container text-on-primary rounded-full p-0.5 flex items-center justify-center shadow">
              <ShieldCheck size={12} />
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-primary-fixed-variant text-[10px] uppercase tracking-wider mb-2 font-semibold">
            Internal Fiduciary Access
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface font-display">
            Welcome Back
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-[340px] leading-relaxed">
            Sign in to access private listings, client CRM dossiers, and fiduciary transaction rooms.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-error-container border border-error/20 text-on-error-container text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-on-surface" htmlFor="email">
              Corporate Email
            </label>
            <div className="relative flex items-center rounded-lg bg-surface-container-low/70 focus-within:bg-surface-container-lowest transition-colors shadow-inner">
              <div className="absolute left-3.5 text-on-surface-variant pointer-events-none">
                <Building2 size={18} />
              </div>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="advisor@estateluxrealty.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full h-12 pl-11 pr-4 bg-transparent text-on-surface text-sm placeholder:text-outline/60 focus:outline-none rounded-lg focus:ring-2 focus:ring-primary-container/20 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-on-surface" htmlFor="password">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-secondary hover:underline font-medium">
                Forgot Access Key?
              </Link>
            </div>
            <div className="relative flex items-center rounded-lg bg-surface-container-low/70 focus-within:bg-surface-container-lowest transition-colors shadow-inner">
              <div className="absolute left-3.5 text-on-surface-variant pointer-events-none">
                <Key size={18} />
              </div>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full h-12 pl-11 pr-11 bg-transparent text-on-surface text-sm placeholder:text-outline/60 focus:outline-none rounded-lg focus:ring-2 focus:ring-primary-container/20 tracking-wider transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 text-on-surface-variant hover:text-on-surface transition-colors p-1"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 mt-2 bg-gradient-to-r from-secondary to-secondary-container hover:from-on-secondary-container hover:to-secondary text-on-secondary font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-on-secondary/30 border-t-on-secondary rounded-full animate-spin" />
            ) : (
              <>
                <Key size={16} />
                <span>Sign In to RMS Portal</span>
                <ArrowRight size={16} />
              </>
            )}
            {submitting && <span>Verifying Credentials…</span>}
          </button>
        </form>

        {/* Footer note */}
        <div className="mt-6 pt-4 bg-surface-container-low/40 -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 px-6 sm:px-10 pb-4 rounded-b-xl text-center">
          <p className="text-sm text-on-surface-variant">
            New advisory partner?{' '}
            <Link href="/register" className="font-medium text-primary-container hover:underline inline-flex items-center gap-0.5">
              Apply for Access <ArrowRight size={12} />
            </Link>
          </p>
        </div>
      </div>

      {/* Security metadata */}
      <div className="mt-4 text-center space-y-1">
        <div className="flex items-center justify-center gap-2 text-on-surface-variant text-[11px]">
          <ShieldCheck size={13} className="text-secondary" />
          <span>TLS 1.3 Strict Transport • Audited RMS Node v4.28.1</span>
        </div>
        <p className="text-[11px] text-outline">
          Private real estate intelligence system. Unauthorized entry monitored.
        </p>
      </div>
    </div>
  );
}
