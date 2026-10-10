'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, Building2, Key } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="w-full max-w-[440px] px-4 sm:px-0">
      {/* Security badge */}
      <div className="flex items-center justify-center mb-6">
        <div className="inline-flex items-center gap-2 bg-surface-container-lowest/80 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-[11px] font-semibold text-primary-container tracking-wide uppercase">
            Access Recovery Portal
          </span>
        </div>
      </div>

      <div className="relative bg-surface-container-lowest/95 backdrop-blur-xl rounded-xl p-6 sm:p-10 shadow-xl">
        <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-secondary/70 to-transparent rounded-full" />

        {submitted ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-on-surface font-display mb-2">Check Your Email</h2>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              If an account with <span className="font-medium text-on-surface">{email}</span> exists, we&apos;ve sent password reset instructions.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-secondary to-secondary-container text-on-secondary font-semibold py-2.5 px-6 rounded-lg text-sm transition-all shadow-md"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 rounded-lg bg-surface-container-low shadow-sm flex items-center justify-center mb-4">
                <Building2 size={24} className="text-primary-container" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-on-surface font-display">
                Forgot Access Key?
              </h1>
              <p className="text-sm text-on-surface-variant mt-1 max-w-[320px] leading-relaxed">
                Enter your corporate email and we&apos;ll send password reset instructions.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-on-surface" htmlFor="email">
                  Corporate Email
                </label>
                <div className="relative flex items-center rounded-lg bg-surface-container-low/70 focus-within:bg-surface-container-lowest transition-colors shadow-inner">
                  <div className="absolute left-3.5 text-on-surface-variant pointer-events-none">
                    <Mail size={18} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="advisor@estateluxrealty.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 bg-transparent text-on-surface text-sm placeholder:text-outline/60 focus:outline-none rounded-lg focus:ring-2 focus:ring-primary-container/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-secondary to-secondary-container hover:from-on-secondary-container hover:to-secondary text-on-secondary font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <Key size={16} />
                <span>Send Reset Instructions</span>
              </button>
            </form>

            <div className="mt-6 pt-4 bg-surface-container-low/40 -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 px-6 sm:px-10 pb-4 rounded-b-xl text-center">
              <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors">
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
