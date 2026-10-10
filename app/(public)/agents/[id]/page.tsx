'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Phone, Mail, Star, Share2, Bookmark,
  CheckCircle2, Loader2, MapPin, Calendar, Building2,
  BadgeCheck, ChevronRight, Users, MessageSquare, Lock,
  ShieldCheck, Key, BookOpen, Scale, Award, Download, Printer,
} from 'lucide-react';
import { agentsApi, propertiesApi, leadsApi, ApiError } from '@/lib/api';
import { ApiAgent, ApiProperty } from '@/lib/api-types';
import PropertyCard from '@/components/PropertyCard';

type Tab = 'listings' | 'sales' | 'bio' | 'endorsements';

const PRICE_BRACKETS = ['$1M – $5M', '$5M – $15M', '$15M+'];

const INQUIRY_TYPES = [
  'Acquiring Luxury Real Estate',
  'Listing & Valuation Mandate',
  'Off-Market Private Portfolio Access',
  'Institutional / Family Office Advisory',
];

const BIO_PILLARS = [
  {
    Icon: Scale,
    title: 'Advisory Philosophy',
    desc: 'Complete fiduciary independence. Real-time pricing sensitivity analytics, off-market comparable metrics, and uncompromised privacy.',
  },
  {
    Icon: Key,
    title: 'Discreet Off-Market',
    desc: 'A significant portion of transactions occur quietly off public registers via private bilateral negotiations between verified principals.',
  },
  {
    Icon: BookOpen,
    title: 'Media Commentary',
    desc: 'Regularly featured authority on prime residential market dynamics across leading architectural and financial publications.',
  },
];

const PLACEHOLDER_REVIEWS = [
  {
    initials: 'RH',
    name: 'R. Harrison',
    role: 'Verified Buyer',
    date: 'Closed October 2024',
    quote: 'The advisor represented our trust in securing a legacy estate entirely off-market. Their poise, total command of zoning covenants, and non-disclosure discretion protected our anonymity at every phase.',
  },
  {
    initials: 'DK',
    name: 'David K.',
    role: 'Tech Founder & General Partner',
    date: 'Closed June 2024',
    quote: 'In 20 years investing in real assets, this advisor stands out for having the sharpest commercial instincts. They negotiated an exceptional purchase price while navigating complex requirements seamlessly.',
  },
  {
    initials: 'ML',
    name: 'Marc-Antoine L.',
    role: 'European Family Office Trustee',
    date: 'Closed January 2024',
    quote: 'Our family office needed a partner who understands multi-jurisdiction entity purchases. White-glove communication, coordinating effortlessly with our legal and tax counsel throughout.',
  },
];

function formatVolume(raw: string | null | undefined): string {
  if (!raw) return '—';
  const n = parseFloat(raw);
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B+`;
  if (n >= 1_000_000)     return `$${Math.round(n / 1_000_000)}M+`;
  if (n >= 1_000)         return `$${Math.round(n / 1_000)}K+`;
  return `$${Math.round(n)}`;
}

export default function AgentProfilePage() {
  const params = useParams();
  const id     = typeof params.id === 'string' ? params.id : (params.id?.[0] ?? '');

  const [agent,       setAgent]       = useState<ApiAgent | null>(null);
  const [listings,    setListings]    = useState<ApiProperty[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [notFound,    setNotFound]    = useState(false);
  const [tab,         setTab]         = useState<Tab>('listings');
  const [copied,      setCopied]      = useState(false);

  const [form,        setForm]        = useState({
    name: '', email: '', phone: '', inquiryType: INQUIRY_TYPES[0], bracket: 0, message: '', nda: true,
  });
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [formError,   setFormError]   = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    agentsApi.get(id)
      .then(async res => {
        setAgent(res.data);
        try {
          const listingsRes = await propertiesApi.list({ agent_id: id, per_page: 6 });
          setListings(listingsRes.data);
        } catch {
          // listings are non-critical
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agent) return;
    setFormError('');
    setSubmitting(true);
    try {
      await leadsApi.submit({
        client_name:     form.name,
        phone:           form.phone,
        email:           form.email || undefined,
        visitor_message: `[Agent Inquiry: ${agent.user?.full_name}] ${form.inquiryType} | ${PRICE_BRACKETS[form.bracket]} | NDA: ${form.nda}. ${form.message}`,
      });
      setSubmitted(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to submit.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: agent?.user?.full_name, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-secondary" />
          <p className="text-sm text-on-surface-variant">Loading advisor profile…</p>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (notFound || !agent) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-lowest shadow-sm flex items-center justify-center mx-auto mb-5">
            <Users size={28} className="text-on-surface-variant" />
          </div>
          <h2 className="text-2xl font-bold text-on-surface font-display mb-2">Advisor Not Found</h2>
          <p className="text-on-surface-variant text-sm mb-7">This advisor profile may have been removed.</p>
          <Link href="/agents" className="inline-flex items-center gap-2 bg-primary-container text-on-primary px-6 py-3 rounded-xl text-sm font-semibold">
            <ArrowLeft size={15} /> All Advisors
          </Link>
        </div>
      </div>
    );
  }

  /* ── Derived values ── */
  const name       = agent.user?.full_name ?? 'Agent';
  const email      = agent.user?.email;
  const phone      = agent.user?.phone;
  const avatarUrl  = agent.user?.avatar_url;
  const initial    = name.charAt(0).toUpperCase();
  const propCount  = agent.properties_count ?? listings.length;
  const closed     = agent.closed_deals_count ?? 0;
  const volume     = formatVolume(agent.total_volume);
  const joinYear   = agent.joining_date ? new Date(agent.joining_date).getFullYear() : null;
  const experience = joinYear ? new Date().getFullYear() - joinYear : null;
  const specialization = agent.specialization ?? 'Real Estate Advisor';

  const TABS: { key: Tab; label: string }[] = [
    { key: 'listings',     label: `Active Listings (${propCount})` },
    { key: 'sales',        label: `Recent Sales (${closed})` },
    { key: 'bio',          label: 'Biography & Pedigree' },
    { key: 'endorsements', label: `Endorsements (${PLACEHOLDER_REVIEWS.length})` },
  ];

  const HERO_STATS = [
    { value: experience ? `${experience}+` : '5+', label: 'Years Experience' },
    { value: volume,    label: `${closed} Properties Sold` },
    { value: String(propCount), label: `${propCount} Active Mandates` },
    { value: '4.98',    label: '42 Verified Reviews', star: true },
  ];

  /* ── Page ── */
  return (
    <div className="bg-background min-h-screen">

      {/* ── Breadcrumb + credential bar ── */}
      <section className="w-full bg-surface-container-low py-2.5">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-2 text-sm">
          <div className="flex flex-wrap items-center gap-1.5 text-on-surface-variant">
            <Link href="/" className="hover:text-on-surface transition-colors">Home</Link>
            <span className="text-outline-variant text-xs">/</span>
            <Link href="/agents" className="hover:text-on-surface transition-colors">Advisory</Link>
            <span className="text-outline-variant text-xs">/</span>
            <Link href="/agents" className="hover:text-on-surface transition-colors">Agents</Link>
            <span className="text-outline-variant text-xs">/</span>
            <span className="text-on-surface font-semibold">{name}</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface text-xs ml-1">
              <BadgeCheck size={12} className="text-secondary-container fill-secondary-container" />
              {agent.cnic ? `${agent.cnic} • ` : ''}{specialization}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-lowest text-on-surface text-xs shadow-sm">
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
              {specialization} Private Office
            </span>
          </div>
        </div>
      </section>

      {/* ── Hero profile card ── */}
      <section className="w-full py-10">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-8">
          <div className="bg-surface-container-lowest rounded-xl shadow-md p-8 relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-surface-container-high/40 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start gap-8">

              {/* Portrait */}
              <div className="flex flex-col items-center shrink-0 mx-auto lg:mx-0">
                <div className="relative w-44 h-44 rounded-2xl p-1 bg-surface-container shadow-md">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-primary-container flex items-center justify-center text-on-primary text-5xl font-bold font-display">
                      {initial}
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-primary-container p-1.5 rounded-full shadow-md flex items-center justify-center">
                    <Award size={14} className="text-secondary-container" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-on-surface text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Available for Consultations
                </div>
                <span className="text-on-surface-variant text-xs mt-1.5">Avg Response: &lt; 2 hrs</span>
              </div>

              {/* Bio & credentials */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h1 className="text-3xl font-semibold text-on-surface font-display tracking-tight">{name}</h1>
                      <p className="text-base text-secondary-container font-semibold mt-0.5">
                        {specialization}{joinYear ? `, Est. ${joinYear}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-sm">
                        <Award size={15} className="text-secondary-container" />
                        Top 0.1% Globally
                      </span>
                      <button
                        onClick={handleShare}
                        className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors"
                        title={copied ? 'Copied!' : 'Share'}
                      >
                        <Share2 size={16} />
                      </button>
                      <button className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors">
                        <Bookmark size={16} />
                      </button>
                    </div>
                  </div>

                  {agent.bio && (
                    <p className="text-on-surface-variant leading-relaxed mt-2 max-w-3xl text-base">
                      {agent.bio}
                    </p>
                  )}
                  {!agent.bio && (
                    <p className="text-on-surface-variant leading-relaxed mt-2 max-w-3xl text-base">
                      Specializing in iconic architectural estates and discreet off-market transactions.
                      Guiding UHNW clients and family offices with utmost fiduciary discretion.
                    </p>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-2">
                  {specialization.split(',').map(s => (
                    <span key={s.trim()} className="px-3 py-1 rounded-md bg-surface-container text-on-surface text-xs font-medium">
                      {s.trim()}
                    </span>
                  ))}
                  <span className="text-outline-variant text-xs px-1">•</span>
                  <span className="inline-flex items-center gap-1 text-on-surface-variant text-xs">
                    <MapPin size={12} />
                    Global Coverage
                  </span>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {HERO_STATS.map(s => (
                    <div key={s.label} className="p-4 rounded-xl bg-surface-container-low flex flex-col">
                      {s.star ? (
                        <div className="flex items-center gap-1">
                          <span className="text-2xl font-semibold text-on-surface tracking-tight">{s.value}</span>
                          <Star size={18} className="text-secondary-container fill-secondary-container" />
                        </div>
                      ) : (
                        <span className="text-2xl font-semibold text-on-surface tracking-tight">{s.value}</span>
                      )}
                      <span className="text-xs text-on-surface-variant uppercase tracking-wider mt-0.5">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* CTA row */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <a
                    href="#consultation-card"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-secondary-container text-on-primary text-sm font-semibold hover:opacity-95 active:scale-[0.98] transition-all shadow-sm"
                  >
                    <Calendar size={15} />
                    Schedule Private Consultation
                  </a>
                  {phone ? (
                    <a
                      href={`tel:${phone}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors"
                    >
                      <Phone size={15} />
                      {phone}
                    </a>
                  ) : (
                    <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors">
                      <Phone size={15} />
                      Direct Line
                    </button>
                  )}
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors"
                  >
                    <MessageSquare size={15} />
                    WhatsApp Concierge
                  </Link>
                  {email && (
                    <a
                      href={`mailto:${email}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors"
                    >
                      <Mail size={15} />
                      Direct Email
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Two-column content hub ── */}
      <section className="w-full pb-16">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT: 8 cols */}
          <div className="lg:col-span-8 flex flex-col gap-8">

            {/* Tab bar */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-1.5 flex items-center gap-1 overflow-x-auto">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    tab === t.key
                      ? 'bg-primary-container text-on-primary shadow-sm font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Listings tab ── */}
            {tab === 'listings' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-on-surface">Exclusive Active Mandates</h2>
                    <p className="text-sm text-on-surface-variant mt-0.5">
                      Active listings managed by {name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-on-surface-variant">Sort by:</span>
                    <select className="bg-surface-container-low text-on-surface rounded-lg px-2.5 py-1.5 text-xs outline-none cursor-pointer">
                      <option>Price: High to Low</option>
                      <option>Price: Low to High</option>
                      <option>Recently Listed</option>
                    </select>
                  </div>
                </div>

                {listings.length === 0 ? (
                  <div className="text-center py-16 bg-surface-container-lowest rounded-xl">
                    <Building2 size={32} className="text-on-surface-variant mx-auto mb-3" />
                    <p className="text-on-surface-variant text-sm">No active listings found.</p>
                    <Link href="/properties" className="mt-4 inline-flex items-center gap-1.5 text-sm text-secondary font-semibold hover:underline">
                      Browse all properties <ChevronRight size={14} />
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {listings.map(p => <PropertyCard key={p.id} property={p} />)}
                  </div>
                )}

                {listings.length > 0 && (
                  <div className="flex justify-center">
                    <Link
                      href={`/properties?agent_id=${id}`}
                      className="inline-flex items-center gap-2 px-8 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container text-sm font-semibold transition-all shadow-sm"
                    >
                      Load More Mandates
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ── Recent Sales tab ── */}
            {tab === 'sales' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-xl font-semibold text-on-surface">Recent Sales &amp; Completed Transactions</h2>
                  <p className="text-sm text-on-surface-variant mt-0.5">Completed mandates by {name}</p>
                </div>
                <div className="text-center py-16 bg-surface-container-lowest rounded-xl">
                  <ShieldCheck size={32} className="text-on-surface-variant mx-auto mb-3" />
                  <p className="text-base font-semibold text-on-surface mb-1">Transactions are Confidential</p>
                  <p className="text-sm text-on-surface-variant max-w-xs mx-auto">
                    Sale history is available upon execution of a non-disclosure agreement. Request via the consultation form.
                  </p>
                </div>
              </div>
            )}

            {/* ── Bio tab ── */}
            {tab === 'bio' && (
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-8 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-secondary-container rounded-full" />
                  <h2 className="text-xl font-semibold text-on-surface">Professional Pedigree &amp; Advisory Scope</h2>
                </div>

                <div className="flex flex-col gap-4 text-on-surface-variant leading-relaxed">
                  {agent.bio ? (
                    <p>{agent.bio}</p>
                  ) : (
                    <>
                      <p>
                        {name} is a licensed real estate advisor specializing in {specialization}.
                        With a client-first approach and deep market expertise, they guide buyers, sellers, and investors
                        through complex luxury transactions with discretion and precision.
                      </p>
                      <p>
                        Committed to financial integrity and bespoke market intelligence, {name.split(' ')[0]} delivers
                        uncompromising advisory services with a track record of successful transactions across prime locations.
                      </p>
                    </>
                  )}
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: MapPin,     label: 'Service Area',   value: 'Global Coverage' },
                    { icon: BadgeCheck, label: 'License Status', value: agent.approval_status === 'approved' ? 'Verified & Active' : 'Pending Verification' },
                    { icon: Calendar,   label: 'Member Since',   value: joinYear ? String(joinYear) : 'N/A' },
                    { icon: Building2,  label: 'Active Mandates', value: `${propCount} properties` },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-low">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-highest text-secondary-container flex items-center justify-center shrink-0">
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-semibold text-on-surface mt-0.5">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3-col pillars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {BIO_PILLARS.map(({ Icon, title, desc }) => (
                    <div key={title} className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
                        <Icon size={18} className="text-secondary-container" />
                      </div>
                      <h4 className="text-base font-semibold text-on-surface">{title}</h4>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Endorsements tab ── */}
            {tab === 'endorsements' && (
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-8 flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-6 bg-secondary-container rounded-full" />
                      <h2 className="text-xl font-semibold text-on-surface">Client Endorsements &amp; Performance</h2>
                    </div>
                    <p className="text-sm text-on-surface-variant mt-1 ml-5">Verified evaluations from high-net-worth acquisitions and sales</p>
                  </div>

                  {/* Rating summary */}
                  <div className="p-4 px-5 rounded-xl bg-surface-container-low flex items-center gap-5 self-start shrink-0">
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-semibold text-on-surface">4.98</span>
                      <div className="flex text-secondary-container mt-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={12} className="fill-secondary-container text-secondary-container" />
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 text-xs border-l pl-5 text-on-surface-variant border-surface-container-high">
                      {[
                        ['Responsiveness', '5.0'],
                        ['Discretion',     '5.0'],
                        ['Negotiation',    '4.9'],
                      ].map(([k, v]) => (
                        <span key={k} className="flex justify-between gap-6">
                          {k} <strong className="text-on-surface">{v}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Review cards */}
                <div className="flex flex-col gap-4">
                  {PLACEHOLDER_REVIEWS.map((r, i) => (
                    <div key={i} className="p-6 rounded-xl bg-surface-container-low flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex text-secondary-container">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star key={j} size={14} className="fill-secondary-container text-secondary-container" />
                          ))}
                        </div>
                        <span className="text-xs text-on-surface-variant">{r.date}</span>
                      </div>
                      <p className="text-on-surface italic leading-relaxed">
                        &ldquo;{r.quote}&rdquo;
                      </p>
                      <div className="flex items-center gap-3 pt-1">
                        <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface font-semibold text-xs">
                          {r.initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{r.name}</p>
                          <p className="text-xs text-secondary-container">{r.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: 4 cols — sticky */}
          <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24">

            {/* ── Consultation form ── */}
            <div
              id="consultation-card"
              className="bg-surface-container-lowest rounded-xl shadow-md p-6 flex flex-col gap-4 border-t-4 border-secondary-container"
            >
              {submitted ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-secondary-fixed flex items-center justify-center mb-4">
                    <CheckCircle2 size={26} className="text-secondary" />
                  </div>
                  <h3 className="text-lg font-bold text-on-surface font-display mb-2">Request Sent!</h3>
                  <p className="text-sm text-on-surface-variant">
                    {name} will reach out within 2 hours.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-secondary-container uppercase tracking-wider">Priority Concierge</span>
                    <h3 className="text-lg font-semibold text-on-surface">Direct Consultation</h3>
                    <p className="text-sm text-on-surface-variant">
                      Confidential communication directly with {name.split(' ')[0]}. Guaranteed response within two hours.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    {formError && (
                      <div className="p-3 bg-error-container border border-error/20 rounded-xl text-xs text-on-error-container">
                        {formError}
                      </div>
                    )}

                    {/* Full Name */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-on-surface">Your Full Name</label>
                      <input
                        required
                        type="text"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Lorde Sterling"
                        className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm placeholder:text-outline-variant outline-none focus:ring-2 focus:ring-secondary-container transition-all"
                      />
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-on-surface">Direct Email</label>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="name@domain.com"
                        className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm placeholder:text-outline-variant outline-none focus:ring-2 focus:ring-secondary-container transition-all"
                      />
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-on-surface">Phone / WhatsApp</label>
                      <input
                        required
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="+92 300 000 0000"
                        className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm placeholder:text-outline-variant outline-none focus:ring-2 focus:ring-secondary-container transition-all"
                      />
                    </div>

                    {/* Inquiry type */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-on-surface">Inquiry Nature</label>
                      <select
                        value={form.inquiryType}
                        onChange={e => setForm({ ...form, inquiryType: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm outline-none cursor-pointer focus:ring-2 focus:ring-secondary-container"
                      >
                        {INQUIRY_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>

                    {/* Price bracket */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-on-surface">Anticipated Price Bracket</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {PRICE_BRACKETS.map((b, i) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setForm({ ...form, bracket: i })}
                            className={`p-2 rounded-lg text-xs font-medium text-center transition-all ${
                              form.bracket === i
                                ? 'bg-primary-container text-on-primary'
                                : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-on-surface">Confidential Message</label>
                      <textarea
                        value={form.message}
                        onChange={e => setForm({ ...form, message: e.target.value })}
                        rows={3}
                        placeholder="Specify preferred locations, requirements, or private mandate timing…"
                        className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm placeholder:text-outline-variant outline-none focus:ring-2 focus:ring-secondary-container transition-all resize-none"
                      />
                    </div>

                    {/* NDA checkbox */}
                    <label className="flex items-start gap-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.nda}
                        onChange={e => setForm({ ...form, nda: e.target.checked })}
                        className="mt-0.5 rounded accent-secondary-container"
                      />
                      <span className="text-xs text-on-surface-variant">
                        Require strict NDA execution prior to property disclosure
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full mt-1 py-3 rounded-lg bg-secondary-container text-on-primary text-sm font-semibold hover:opacity-95 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? (
                        <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      ) : (
                        <Lock size={14} />
                      )}
                      {submitting ? 'Sending…' : 'Send Confidential Request'}
                    </button>
                  </form>

                  <div className="flex items-center justify-center gap-2 text-on-surface-variant text-xs border-t border-surface-container-high/50 pt-3">
                    <ShieldCheck size={13} className="text-secondary-container" />
                    <span>256-Bit Encrypted Communication • Zero Spam</span>
                  </div>
                </>
              )}
            </div>

            {/* ── Office location card ── */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-on-surface">Private Office Location</h4>
                <span className="inline-flex items-center gap-1 text-xs text-secondary-container">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-container" />
                  By Appointment Only
                </span>
              </div>

              {/* Map placeholder */}
              <div className="w-full h-36 rounded-lg bg-surface-container relative overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-primary-container/10 flex items-center justify-center">
                  <div className="px-3 py-1.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm text-on-surface text-xs font-semibold shadow-md flex items-center gap-1">
                    <MapPin size={12} className="text-secondary-container" />
                    EstateLux Private Suite
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="flex flex-col gap-1 text-sm">
                <p className="font-semibold text-on-surface">EstateLux Premier Realty</p>
                <p className="text-on-surface-variant leading-relaxed">
                  {email ? email.split('@')[1] ?? 'Pakistan' : 'Pakistan'} — Premier Advisory Office
                </p>
              </div>

              {/* Team roster */}
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1.5 text-xs">
                {[
                  ['Executive Coordinator', 'Available'],
                  ['Support Specialist', 'On-site'],
                ].map(([role, status]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="text-on-surface-variant">{role}</span>
                    <span className="font-semibold text-on-surface">{status}</span>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2">
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-semibold transition-colors"
                  >
                    <Download size={14} />
                    Contact via Email
                  </a>
                )}
                <button className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg text-on-surface-variant hover:text-on-surface text-xs transition-colors">
                  <Printer size={13} />
                  Print Complete Profile Dossier
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
