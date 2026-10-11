'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Phone, MessageSquare, Mail, MapPin, Lock, ShieldCheck, Clock,
  CheckCircle2, ChevronRight, ArrowRight, Building2, Camera,
  Globe, MessageCircle, Video, Calendar,
} from 'lucide-react';
import { settingsApi, leadsApi, ApiError } from '@/lib/api';
import { ApiSetting } from '@/lib/api-types';

const MANDATE_TYPES = [
  'Acquisition Mandate',
  'Private Off-Market Disposition',
  'Architectural Advisory & Valuation',
  'Press & Media Relations',
  'General Concierge Inquiry',
];

const REGIONAL_OFFICES = [
  { city: 'New York',     address: 'Madison Ave, Upper East',    phone: '+1 (212) 555-0199' },
  { city: 'Miami Beach',  address: 'Brickell Financial Tower',   phone: '+1 (305) 555-0144' },
  { city: 'London',       address: 'Berkeley Square, Mayfair',   phone: '+44 20 7946 0910'  },
];

const SOCIAL_CHANNELS = [
  { Icon: Building2,    title: 'LinkedIn Advisory Network'   },
  { Icon: Camera,       title: 'Instagram Curated Portfolios'},
  { Icon: Globe,        title: 'X / Twitter Updates'         },
  { Icon: MessageCircle,title: 'WeChat Private Desk'         },
  { Icon: Video,        title: 'YouTube Architectural Cinema'},
];

const INPUT_CLS =
  'h-12 px-4 w-full rounded-lg bg-surface-container-lowest text-on-surface text-sm ' +
  'placeholder:text-on-surface-variant/50 shadow-sm border border-outline-variant/20 ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all';

const LABEL_CLS = 'block text-sm font-semibold text-on-surface mb-1.5';

export default function ContactPage() {
  const [settings, setSettings] = useState<ApiSetting | null>(null);
  const [form, setForm] = useState({
    client_name:     '',
    email:           '',
    phone:           '',
    mandateType:     MANDATE_TYPES[0],
    visitor_message: '',
    ndaAgree:        false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    settingsApi.get().then(res => setSettings(res.data)).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await leadsApi.submit({
        client_name:     form.client_name,
        phone:           form.phone,
        email:           form.email || undefined,
        visitor_message: `[${form.mandateType}] ${form.visitor_message}`.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.errors ? Object.values(err.errors).flat().join('. ') : err.message);
      } else {
        setError('Failed to submit. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const phone   = settings?.phone           ?? '+1 (310) 555-0100';
  const email   = settings?.email           ?? 'concierge@estateluxrealty.com';
  const address = settings?.address         ?? '9600 Wilshire Blvd, Suite 400, Beverly Hills, CA 90212';
  const hours   = settings?.business_hours  ?? 'Mon – Fri: 8:00 AM – 7:00 PM';

  return (
    <div className="bg-background min-h-screen">
      <div className="relative w-full bg-surface-container-lowest pb-10">

        {/* ── Breadcrumb + Status Pill ─────────────────────────────────── */}
        <div className="max-w-[1360px] mx-auto px-6 lg:px-8 pt-6 pb-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <nav className="flex items-center gap-1 text-sm text-on-surface-variant">
              <Link href="/" className="hover:text-on-surface transition-colors">Home</Link>
              <ChevronRight size={14} className="text-outline-variant" />
              <span>Contact</span>
              <ChevronRight size={14} className="text-outline-variant" />
              <span className="text-on-surface font-semibold">Global Concierge &amp; Advisory Offices</span>
            </nav>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container text-on-tertiary-fixed text-xs font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span>Discreet Fiduciary Inquiries • Worldwide Availability</span>
            </div>
          </div>
        </div>

        {/* ── Editorial Header ─────────────────────────────────────────── */}
        <div className="max-w-[1360px] mx-auto px-6 lg:px-8 pt-2 pb-6">
          <div className="max-w-4xl flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-secondary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                GLOBAL CLIENT ADVISORY
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-6xl font-semibold tracking-tight text-primary-container leading-none">
              Get in Touch
            </h1>
            <p className="text-lg text-on-surface-variant leading-relaxed pt-1 max-w-2xl">
              Whether you are looking to acquire a landmark architectural estate, discreetly position a
              trophy property off-market, or schedule a confidential advisory consultation with our
              partners, our concierge team is at your disposal.
            </p>
          </div>

          {/* Quick Contact Ribbon */}
          <div className="mt-6 p-4 rounded-xl bg-surface-container-low shadow-sm flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary-container shadow-sm">
                <Phone size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Direct Line</span>
                <a href={`tel:${phone}`} className="text-base font-semibold text-on-surface hover:text-secondary transition-colors">
                  {phone}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary shadow-sm">
                <MessageSquare size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">WhatsApp Concierge</span>
                <span className="text-base font-semibold text-on-surface">Available 24/7 Desk</span>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary-container shadow-sm">
                <Mail size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Global Inquiries</span>
                <a href={`mailto:${email}`} className="text-base font-semibold text-on-surface hover:text-secondary transition-colors">
                  {email}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main 2-Col Grid ──────────────────────────────────────────── */}
        <div className="max-w-[1360px] mx-auto px-6 lg:px-8 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* LEFT: Contact Form Card */}
            <div className="lg:col-span-7">
              <div className="bg-surface-container-lowest rounded-2xl shadow-xl shadow-primary-container/5 relative overflow-hidden p-6 md:p-8">
                {/* Gold gradient top accent */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-secondary-container via-secondary to-primary-container" />

                {submitted ? (
                  <div className="flex flex-col items-center justify-center min-h-72 text-center py-10">
                    <div className="w-16 h-16 rounded-full bg-secondary-fixed flex items-center justify-center mb-4">
                      <CheckCircle2 size={30} className="text-secondary" />
                    </div>
                    <h3 className="text-xl font-bold text-primary-container font-display mb-2">
                      Inquiry Securely Transmitted
                    </h3>
                    <p className="text-sm text-on-surface-variant max-w-sm">
                      A Senior Managing Director will review your brief under strict confidentiality.
                      Expect a response within 2 business hours.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-5 pb-5 border-b border-outline-variant/10">
                      <div>
                        <h2 className="text-2xl font-semibold text-primary-container tracking-tight">
                          Send a Confidential Inquiry
                        </h2>
                        <p className="text-sm text-on-surface-variant mt-1 leading-relaxed max-w-lg">
                          All transmissions are encrypted and handled under strict fiduciary NDA guidelines.
                          Your identity and mandate remain strictly private.
                        </p>
                      </div>
                      <Lock size={20} className="text-on-surface-variant shrink-0 ml-4 mt-0.5" />
                    </div>

                    {error && (
                      <div className="mb-4 p-3 bg-error-container border border-error/20 rounded-xl text-sm text-on-error-container">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                      {/* Name + Email */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={LABEL_CLS}>
                            Full Name <span className="text-secondary">*</span>
                          </label>
                          <input
                            required
                            type="text"
                            value={form.client_name}
                            onChange={e => setForm({ ...form, client_name: e.target.value })}
                            placeholder="e.g. Eleanor Vance-Sterling"
                            className={INPUT_CLS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLS}>
                            Email Address <span className="text-secondary">*</span>
                          </label>
                          <input
                            required
                            type="email"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            placeholder="name@domain.com"
                            className={INPUT_CLS}
                          />
                        </div>
                      </div>

                      {/* Phone + Mandate */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={LABEL_CLS}>
                            Telephone / Mobile <span className="text-secondary">*</span>
                          </label>
                          <input
                            required
                            type="tel"
                            value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                            className={INPUT_CLS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLS}>
                            Subject / Mandate Type <span className="text-secondary">*</span>
                          </label>
                          <div className="relative">
                            <select
                              required
                              value={form.mandateType}
                              onChange={e => setForm({ ...form, mandateType: e.target.value })}
                              className={`${INPUT_CLS} appearance-none pr-10 cursor-pointer`}
                            >
                              {MANDATE_TYPES.map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                            <ChevronRight
                              size={16}
                              className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none text-on-surface-variant"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Message */}
                      <div>
                        <label className={LABEL_CLS}>
                          Message &amp; Acquisition Parameters <span className="text-secondary">*</span>
                        </label>
                        <textarea
                          required
                          value={form.visitor_message}
                          onChange={e => setForm({ ...form, visitor_message: e.target.value })}
                          rows={5}
                          placeholder="Describe your inquiry, preferred geographical markets, or specific architectural requirements..."
                          className="p-4 w-full rounded-lg bg-surface-container-lowest text-on-surface text-sm placeholder:text-on-surface-variant/50 shadow-sm border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all resize-y"
                        />
                      </div>

                      {/* NDA Checkbox */}
                      <div className="flex items-start gap-3 pt-1 cursor-pointer select-none">
                        <input
                          id="ndaAgree"
                          type="checkbox"
                          required
                          checked={form.ndaAgree}
                          onChange={e => setForm({ ...form, ndaAgree: e.target.checked })}
                          className="mt-1 w-4 h-4 rounded accent-secondary cursor-pointer shrink-0"
                        />
                        <label htmlFor="ndaAgree" className="text-sm text-on-surface-variant cursor-pointer leading-relaxed">
                          I request direct partner outreach and acknowledge confidential NDA handling under
                          EstateLux Private Advisory protocols.
                        </label>
                      </div>

                      {/* Submit + Trust Line */}
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-secondary hover:bg-secondary-container text-on-secondary text-sm font-semibold tracking-wide shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                        >
                          {submitting ? (
                            <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                          ) : (
                            <Lock size={16} />
                          )}
                          <span>{submitting ? 'Encrypting & Sending…' : 'Send Message'}</span>
                          {!submitting && <ArrowRight size={16} />}
                        </button>
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <Clock size={14} className="text-secondary shrink-0" />
                          <span>Average response time: Under 2 business hours.</span>
                        </div>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT: HQ Info + Regional Outposts */}
            <div className="lg:col-span-5 flex flex-col gap-6">

              {/* Flagship HQ Card */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-xl shadow-primary-container/5 p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                      Flagship Residence
                    </span>
                    <h3 className="text-xl font-semibold text-primary-container mt-0.5">Global Headquarters</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-surface-container text-primary-container text-xs font-semibold">
                    Beverly Hills
                  </span>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-low shrink-0 flex items-center justify-center text-primary-container">
                    <MapPin size={16} />
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-on-surface block">EstateLux Premier Realty — Westside HQ</span>
                    <p className="text-on-surface-variant leading-relaxed mt-0.5">{address}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-low shrink-0 flex items-center justify-center text-primary-container">
                    <Phone size={16} />
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-on-surface block">Direct &amp; Toll-Free Inquiries</span>
                    <span className="text-on-surface-variant">{phone} • Private Desk</span>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-low shrink-0 flex items-center justify-center text-primary-container">
                    <Mail size={16} />
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-on-surface block">Electronic Correspondence</span>
                    <a href={`mailto:${email}`} className="text-secondary hover:underline">{email}</a>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-low shrink-0 flex items-center justify-center text-primary-container">
                    <Clock size={16} />
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-on-surface block">Advisory Desk Hours</span>
                    <span className="text-on-surface-variant">{hours}</span>
                    <span className="text-secondary font-medium block mt-0.5">Sunday: Private Client Appointments Only</span>
                  </div>
                </div>

                {/* Map Placeholder */}
                <div className="mt-1 rounded-xl overflow-hidden relative h-56 bg-surface-container-high shadow-sm">
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-container/90 via-primary-container/40 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-container text-on-primary shadow-xl ring-2 ring-secondary animate-bounce">
                      <MapPin size={13} className="text-secondary" />
                      <span className="text-xs font-semibold tracking-wide">EstateLux Westside HQ</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-3 flex items-center justify-between">
                    <span className="text-xs text-on-primary font-medium tracking-wide">Wilshire Blvd &amp; Rodeo Dr</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary text-on-secondary text-xs font-semibold shadow">
                      Get Driving Directions
                    </span>
                  </div>
                </div>

                {/* Social Channels */}
                <div className="pt-1 flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Digital Concierge Channels
                  </span>
                  <div className="flex items-center gap-2">
                    {SOCIAL_CHANNELS.map(({ Icon, title }) => (
                      <a
                        key={title}
                        href="#"
                        title={title}
                        className="w-10 h-10 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary-container flex items-center justify-center transition-colors shadow-sm"
                      >
                        <Icon size={18} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Regional Outposts */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-xl shadow-primary-container/5 p-6 flex flex-col gap-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  Global Regional Outposts
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {REGIONAL_OFFICES.map(office => (
                    <div key={office.city} className="flex flex-col gap-1 p-3 rounded-xl bg-surface-container-low">
                      <span className="text-sm font-semibold text-on-surface">{office.city}</span>
                      <span className="text-xs text-on-surface-variant">{office.address}</span>
                      <span className="text-xs font-medium text-secondary mt-1">{office.phone}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Office Photo Banner ──────────────────────────────────────── */}
        <div className="max-w-[1360px] mx-auto px-6 lg:px-8 pt-10">
          <div className="relative w-full h-80 rounded-2xl overflow-hidden shadow-2xl bg-primary-container">
            <div className="absolute inset-0 bg-gradient-to-br from-tertiary-container via-primary-container to-primary-container/80" />
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-primary-container via-primary-container/80 to-transparent" />
            <div className="relative h-full flex flex-col justify-end md:justify-center max-w-xl p-6 md:p-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-secondary/20 text-secondary-fixed w-max mb-3">
                <Calendar size={13} />
                <span className="text-xs font-semibold uppercase tracking-wider">Private Advisory Salons</span>
              </div>
              <h3 className="text-2xl font-semibold text-on-primary tracking-tight">
                Confidential Consultations by Appointment
              </h3>
              <p className="text-base text-surface-dim mt-2 leading-relaxed">
                Private client salons situated in Beverly Hills, Manhattan, Miami &amp; London.
                Walk-ins strictly accommodated by prior partner schedule confirmation.
              </p>
              <div className="mt-6">
                <a
                  href="#"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface-container-lowest text-primary-container text-sm font-semibold hover:bg-surface-container transition-all"
                >
                  <span>Book Salon Visit</span>
                  <Calendar size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
