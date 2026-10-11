'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, SlidersHorizontal, Phone, Mail, MessageSquare,
  BadgeCheck, Star, ChevronLeft, ChevronRight, ArrowRight,
  ShieldCheck, Landmark, Key,
} from 'lucide-react';
import { agentsApi, statsApi } from '@/lib/api';
import { ApiAgent, ApiStats } from '@/lib/api-types';

/* ── Static data ─────────────────────────────────────────────────────────── */


const FILTER_PILLS = [
  { label: 'All Advisors',               value: '' },
  { label: 'Managing Partners',          value: 'Managing Partner' },
  { label: 'Waterfront Specialists',     value: 'Waterfront' },
  { label: 'Off-Market Advisory',        value: 'Off-Market' },
  { label: 'Commercial & Development',   value: 'Commercial' },
];

const ADVISORY_ITEMS = [
  {
    Icon: ShieldCheck,
    bg: 'bg-primary-container',
    title: 'Vetted Fiduciary Trust',
    desc: 'Our partners operate under strict NDA protocols and fiduciary obligations, safeguarding the privacy of public figures, founders, and global families.',
  },
  {
    Icon: Landmark,
    bg: 'bg-secondary-container',
    title: 'Family Office & Institutional Grade',
    desc: 'In-depth cross-border tax valuation, zoning analysis, capital growth projections, and architectural integrity audits for legacy generational wealth.',
  },
  {
    Icon: Key,
    bg: 'bg-primary-container',
    title: 'Exclusive Off-Market Reach',
    desc: 'Over 40% of our ultra-prime transactions transact completely off-market via our private internal network prior to any public MLS registry.',
  },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function formatVolume(raw: string | null | undefined): string {
  if (!raw) return '—';
  const n = parseFloat(raw);
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B+`;
  if (n >= 1_000_000)     return `$${Math.round(n / 1_000_000)}M+`;
  if (n >= 1_000)         return `$${Math.round(n / 1_000)}K+`;
  return `$${Math.round(n)}`;
}

/* ── Agent Card ──────────────────────────────────────────────────────────── */

function AgentCard({ agent }: { agent: ApiAgent }) {
  const name    = agent.user?.full_name ?? 'Agent';
  const initial = name.charAt(0).toUpperCase();
  const role    = agent.specialization ?? 'Real Estate Advisor';
  const active  = agent.properties_count ?? 0;
  const closed  = agent.closed_deals_count ?? 0;
  const volume  = formatVolume(agent.total_volume);

  const specialtyTags = agent.specialization
    ? agent.specialization.split(',').map(s => s.trim()).slice(0, 2)
    : ['Real Estate', 'Residential'];

  return (
    <article className="flex flex-col rounded-2xl bg-surface-container-lowest shadow-md hover:shadow-xl transition-all duration-300 group overflow-hidden">
      {/* Portrait */}
      <div className="relative w-full aspect-[4/5] bg-surface-container overflow-hidden">
        {agent.user?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={agent.user.avatar_url}
            alt={name}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-on-primary bg-primary-container/20 group-hover:scale-105 transition-transform duration-500 font-display">
            {initial}
          </div>
        )}

        {/* Role badge — top left */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-md bg-primary-container/85 backdrop-blur-md text-on-primary text-xs font-semibold tracking-wide">
            {role.length > 22 ? role.slice(0, 22) + '…' : role}
          </span>
        </div>

        {/* Verified badge — top right */}
        <div className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-secondary shadow-sm">
          <BadgeCheck size={16} className="fill-secondary text-surface-container-lowest" />
        </div>

        {/* Rating pill — bottom */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface-container-lowest/80 backdrop-blur-md text-xs text-on-surface">
          <span className="flex items-center gap-1 font-semibold text-secondary-container">
            <Star size={12} className="fill-secondary-container text-secondary-container" />
            4.9
            <span className="text-on-surface-variant font-normal">(verified)</span>
          </span>
          <span className="text-on-surface-variant">
            {agent.joining_date
              ? new Date(agent.joining_date).getFullYear() + ' onward'
              : 'Elite Advisor'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3 justify-between">
        {/* Name + city */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-on-surface group-hover:text-secondary transition-colors leading-tight">
              {name}
            </h2>
            <span className="text-xs text-on-surface-variant shrink-0">
              {agent.user?.email?.split('@')[1]?.split('.')[0] ?? 'Global'}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant truncate">
            {agent.bio
              ? agent.bio.slice(0, 48) + (agent.bio.length > 48 ? '…' : '')
              : 'Private Luxury Advisor'}
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-surface-container-low text-center">
          <div>
            <span className="block text-sm font-bold text-on-surface">{active}</span>
            <span className="block text-[10px] text-on-surface-variant">Active</span>
          </div>
          <div>
            <span className="block text-sm font-bold text-on-surface">{closed}</span>
            <span className="block text-[10px] text-on-surface-variant">Closed</span>
          </div>
          <div>
            <span className="block text-sm font-bold text-secondary">{volume}</span>
            <span className="block text-[10px] text-on-surface-variant">Volume</span>
          </div>
        </div>

        {/* Specialty badges */}
        <div className="flex flex-wrap gap-1.5">
          {specialtyTags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-surface-container text-xs text-on-surface-variant"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1">
            {agent.user?.phone ? (
              <a
                href={`tel:${agent.user.phone}`}
                className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface hover:bg-primary-container hover:text-on-primary transition-colors"
              >
                <Phone size={13} />
              </a>
            ) : (
              <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant/40">
                <Phone size={13} />
              </span>
            )}
            {agent.user?.email ? (
              <a
                href={`mailto:${agent.user.email}`}
                className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface hover:bg-primary-container hover:text-on-primary transition-colors"
              >
                <Mail size={13} />
              </a>
            ) : (
              <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant/40">
                <Mail size={13} />
              </span>
            )}
            <Link
              href="/contact"
              className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface hover:bg-primary-container hover:text-on-primary transition-colors"
            >
              <MessageSquare size={13} />
            </Link>
          </div>
          <Link
            href={`/agents/${agent.id}`}
            className="flex-1 py-2 px-3 rounded-lg bg-primary-container text-on-primary hover:bg-secondary-container hover:text-on-secondary-container transition-all text-xs font-medium text-center"
          >
            View Profile
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ── Skeleton ────────────────────────────────────────────────────────────── */

function AgentCardSkeleton() {
  return (
    <div className="rounded-2xl bg-surface-container-lowest shadow-md overflow-hidden">
      <div className="w-full aspect-[4/5] skeleton" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 w-3/4 skeleton rounded" />
        <div className="h-3 w-1/2 skeleton rounded" />
        <div className="h-12 skeleton rounded-lg" />
        <div className="flex gap-2">
          <div className="h-5 w-20 skeleton rounded-md" />
          <div className="h-5 w-16 skeleton rounded-md" />
        </div>
        <div className="h-8 skeleton rounded-lg" />
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function AgentsPage() {
  const [agents,       setAgents]       = useState<ApiAgent[]>([]);
  const [total,        setTotal]        = useState(0);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [lastPage,     setLastPage]     = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [stats,        setStats]        = useState<ApiStats | null>(null);

  const [search,          setSearch]          = useState('');
  const [specialization,  setSpecialization]  = useState('');
  const [sort,            setSort]            = useState('newest');
  const [activePill,      setActivePill]      = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await agentsApi.list({
        approval_status: 'approved',
        search:         search || undefined,
        specialization: specialization || undefined,
        sort:           sort !== 'newest' ? sort : undefined,
        per_page:       8,
        page,
      });
      setAgents(res.data);
      setTotal(res.meta.total);
      setCurrentPage(res.meta.current_page);
      setLastPage(res.meta.last_page);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, specialization, sort]);

  useEffect(() => {
    load(1);
    statsApi.get().then(r => setStats(r.data)).catch(() => {});
  }, [load]);

  function handlePill(value: string) {
    setActivePill(value);
    setSpecialization(value);
  }

  function handleReset() {
    setSearch('');
    setSpecialization('');
    setSort('newest');
    setActivePill('');
  }

  const totalPages = lastPage;
  const pageNumbers: (number | '…')[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    if (currentPage > 3)           pageNumbers.push('…');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pageNumbers.push(i);
    }
    if (currentPage < totalPages - 2) pageNumbers.push('…');
    pageNumbers.push(totalPages);
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="relative w-full overflow-hidden">
        {/* ambient blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-surface-container-high rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute top-80 right-0 w-[30rem] h-[30rem] bg-secondary-fixed rounded-full blur-3xl opacity-20 pointer-events-none" />

        <div className="max-w-[1360px] mx-auto px-6 lg:px-8 pt-4 pb-16 flex flex-col gap-8">

          {/* ── Breadcrumb + status pill ── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav className="flex items-center gap-1.5 text-sm text-on-surface-variant">
              <Link href="/" className="hover:text-on-surface transition-colors">Home</Link>
              <span className="text-outline">/</span>
              <Link href="/agents" className="hover:text-on-surface transition-colors">Advisory</Link>
              <span className="text-outline">/</span>
              <span className="text-on-surface font-semibold">Our Private Brokers &amp; Advisors</span>
            </nav>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs">
              <span className="w-2 h-2 rounded-full bg-secondary-container" />
              Global Private Office • Invitation &amp; Referral Only
            </div>
          </div>

          {/* ── Hero ── */}
          <section className="relative rounded-2xl bg-gradient-to-br from-primary-container via-primary-container to-tertiary-container text-on-primary p-6 sm:p-10 overflow-hidden shadow-xl">
            {/* dot-grid overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

            <div className="relative z-10 flex flex-col gap-6 max-w-4xl">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-secondary-container uppercase tracking-widest">
                  Distinguished Representation
                </span>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-on-primary leading-none font-display">
                  Meet Our Expert Agents <span className="text-secondary-fixed">&amp;</span> Private Advisors
                </h1>
              </div>
              <p className="text-base text-primary-fixed-dim leading-relaxed max-w-3xl">
                Partner with industry-defining specialists who discreetly broker the world&apos;s most coveted private estates,
                penthouses, and architectural landmarks across prime global enclaves.
              </p>

              {/* Stats ribbon */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                {[
                  { value: stats ? String(stats.agents_count) : '64',                          label: 'Global Advisors' },
                  { value: stats?.total_volume ? formatVolume(stats.total_volume) : '$2.8B+',  label: 'Career Sales Volume' },
                  { value: '18',                                                                label: 'Prime Global Metros' },
                  { value: '99.4%',                                                             label: 'Client Recommendation' },
                ].map(({ value, label }) => (
                  <div key={label} className="flex flex-col p-4 rounded-xl bg-surface-container-lowest/10 backdrop-blur-md">
                    <span className="text-2xl font-bold text-on-primary tracking-tight font-display">{value}</span>
                    <span className="text-xs text-primary-fixed-dim uppercase tracking-wider mt-0.5">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Search console ── */}
          <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-md flex flex-col gap-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* Search */}
              <div className="lg:col-span-5 relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
                />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search advisor by name, language, or prime district…"
                  className="w-full h-12 pl-12 pr-4 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container transition-all"
                />
              </div>

              {/* Dropdowns */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Specialization */}
                <div className="relative">
                  <select
                    value={specialization}
                    onChange={e => { setSpecialization(e.target.value); setActivePill(e.target.value); }}
                    className="w-full h-12 px-4 pr-8 appearance-none bg-surface-container-low text-on-surface text-sm rounded-xl focus:outline-none focus:bg-surface-container cursor-pointer transition-all"
                  >
                    <option value="">All Specializations</option>
                    <option value="Waterfront">Waterfront &amp; Island Mansions</option>
                    <option value="Penthouse">Ultra-Luxury Penthouses</option>
                    <option value="Architectural">Modern Architectural Estates</option>
                    <option value="Alpine">Alpine &amp; Equestrian Ranches</option>
                    <option value="Historic">Historic Townhomes</option>
                    <option value="Off-Market">Private Treaty / Off-Market</option>
                  </select>
                  <SlidersHorizontal
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant"
                  />
                </div>

                {/* Metro — client-side filter label only */}
                <div className="relative">
                  <select
                    className="w-full h-12 px-4 pr-8 appearance-none bg-surface-container-low text-on-surface text-sm rounded-xl focus:outline-none focus:bg-surface-container cursor-pointer transition-all"
                    onChange={() => {}}
                  >
                    <option>All Metros (Global)</option>
                    <option>Beverly Hills &amp; Bel-Air, CA</option>
                    <option>Manhattan &amp; Tribeca, NY</option>
                    <option>Miami Beach &amp; Palm Beach, FL</option>
                    <option>Silicon Valley, CA</option>
                    <option>London &amp; Paris Affiliates</option>
                  </select>
                  <SlidersHorizontal
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant"
                  />
                </div>

                {/* Sort */}
                <div className="relative">
                  <select
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                    className="w-full h-12 px-4 pr-8 appearance-none bg-surface-container-low text-on-surface text-sm rounded-xl focus:outline-none focus:bg-surface-container cursor-pointer transition-all"
                  >
                    <option value="newest">Sort: Top Producing</option>
                    <option value="properties">Most Active Listings</option>
                    <option value="name">Alphabetical (A–Z)</option>
                  </select>
                  <SlidersHorizontal
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant"
                  />
                </div>
              </div>
            </div>

            {/* Quick filter pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-on-surface-variant uppercase tracking-wider mr-1 font-semibold">
                Featured Segments:
              </span>
              {FILTER_PILLS.map(pill => (
                <button
                  key={pill.value}
                  onClick={() => handlePill(pill.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 ${
                    activePill === pill.value
                      ? 'bg-primary-container text-on-primary shadow-sm'
                      : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
                  }`}
                >
                  {pill.label}{pill.value === '' && total > 0 ? ` (${total})` : ''}
                </button>
              ))}
              <button
                onClick={handleReset}
                className="ml-auto text-secondary text-sm font-medium hover:underline flex items-center gap-1"
              >
                <SlidersHorizontal size={13} />
                Reset Filters
              </button>
            </div>
          </div>

          {/* ── Agent grid ── */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => <AgentCardSkeleton key={i} />)}
            </div>
          ) : agents.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-on-surface-variant" />
              </div>
              <h3 className="text-xl font-bold text-on-surface font-display mb-2">No advisors found</h3>
              <p className="text-sm text-on-surface-variant">
                {search || specialization ? 'Try adjusting your filters.' : 'No advisors available at the moment.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {agents.map(agent => <AgentCard key={agent.id} agent={agent} />)}
            </div>
          )}

          {/* ── Pagination strip ── */}
          {!loading && agents.length > 0 && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-surface-container-lowest rounded-xl shadow-sm">
              <span className="text-sm text-on-surface-variant">
                Showing{' '}
                <span className="font-semibold text-on-surface">
                  {(currentPage - 1) * 8 + 1}–{Math.min(currentPage * 8, total)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-on-surface">{total}</span>{' '}
                Elite Advisors
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => load(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>
                {pageNumbers.map((p, i) =>
                  p === '…' ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-outline">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => load(p as number)}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                        currentPage === p
                          ? 'bg-primary-container text-on-primary'
                          : 'hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => load(currentPage + 1)}
                  disabled={currentPage === lastPage}
                  className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── Advisory section ── */}
          <section className="rounded-2xl bg-surface-container p-6 sm:p-10 flex flex-col gap-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex flex-col gap-2 max-w-2xl">
                <span className="text-xs font-semibold text-secondary uppercase tracking-widest">
                  The EstateLux Advantage
                </span>
                <h2 className="text-2xl font-semibold text-on-surface tracking-tight font-display">
                  The Art of Confidential Advisory
                </h2>
                <p className="text-sm text-on-surface-variant">
                  Every client engagement is safeguarded with the highest standards of financial discretion,
                  legal vigilance, and bespoke market intelligence.
                </p>
              </div>
              <button className="inline-flex items-center gap-2 text-on-surface text-sm font-medium hover:text-secondary transition-colors shrink-0">
                Read Governance Charter
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {ADVISORY_ITEMS.map(({ Icon, bg, title, desc }) => (
                <div key={title} className="flex flex-col gap-3 p-6 rounded-xl bg-surface-container-lowest shadow-sm">
                  <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon size={22} className="text-on-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-on-surface">{title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Elite Producer CTA ── */}
          <section className="rounded-2xl bg-gradient-to-r from-primary-container via-primary-container to-secondary-container text-on-primary p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl">
            <div className="flex flex-col gap-2 max-w-2xl">
              <span className="text-xs font-semibold text-secondary-fixed uppercase tracking-wider">
                Career Expansion
              </span>
              <h2 className="text-2xl font-semibold text-on-primary tracking-tight font-display">
                Are You an Elite Luxury Producer?
              </h2>
              <p className="text-sm text-primary-fixed-dim leading-relaxed">
                EstateLux invites top 1% brokers with demonstrated volume above $50M annually to submit
                confidential inquiries for regional partnership and capital backing.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <Link
                href="/contact"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all text-sm font-semibold shadow-md text-center"
              >
                Inquire for Representation
              </Link>
              <button className="w-full sm:w-auto px-5 py-3 rounded-xl bg-surface-container-lowest/15 backdrop-blur-md text-on-primary hover:bg-surface-container-lowest/25 transition-all text-sm font-medium text-center">
                Advisory Standards
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
