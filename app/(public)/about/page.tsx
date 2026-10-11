'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck, Star, TrendingUp, Globe, Users, Lock,
  ArrowRight, Mail, Phone, ShieldCheck, Landmark, BarChart3,
} from 'lucide-react';
import { statsApi } from '@/lib/api';
import { ApiStats } from '@/lib/api-types';

/* ── helpers ─────────────────────────────────────────────────────────────── */

function fmtVol(raw: string): string {
  const n = parseFloat(raw);
  if (!n) return '$2.8B+';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B+`;
  if (n >= 1_000_000)     return `$${Math.round(n / 1_000_000)}M+`;
  return `$${Math.round(n / 1_000)}K+`;
}

/* ── static content ───────────────────────────────────────────────────────── */

const CORE_VALUES = [
  {
    Icon: ShieldCheck,
    title: 'Absolute Trust & Discretion',
    desc: 'Strict institutional NDA protocols govern all interactions. Over 42% of our sales conclude entirely off-market, protecting the sovereign privacy of family offices and public figures.',
    footer: 'Institutional Standard',
  },
  {
    Icon: Landmark,
    title: 'Architectural Stewardship',
    desc: 'Rigorous provenance verification, volumetric 3D analysis, structural integrity audits, and deep relationships with mid-century estates and modern design masters.',
    footer: 'Design Due Diligence',
  },
  {
    Icon: BarChart3,
    title: 'Radical Analytical Rigor',
    desc: 'Unbiased fiduciary guidance, precise comparative asset analytics, real-time capital liquidity modeling, and zero concealed conflict of interest across any transaction.',
    footer: 'Quantitative Advisory',
  },
];

const PRESS = [
  { name: 'Architectural Digest',      style: 'font-serif tracking-tight' },
  { name: 'THE WALL STREET JOURNAL.',  style: 'font-serif tracking-wider' },
  { name: 'Robb Report',               style: 'font-serif italic' },
  { name: 'FINANCIAL TIMES',           style: 'font-serif uppercase tracking-widest' },
  { name: 'Bloomberg Pursuits',        style: 'font-semibold tracking-tight' },
];

const TIMELINE = [
  { year: '2008', title: 'Founded',                desc: 'EstateLux established as a private syndicate of bespoke brokers and design purists seeking an alternative to transactional brokerages.' },
  { year: '2012', title: 'First $100M Transacted', desc: 'Reached a landmark milestone with trophy estate transactions across Beverly Hills and Manhattan.' },
  { year: '2017', title: 'International Expansion', desc: 'Opened private advisory desks in London, Dubai, and the Côte d\'Azur.' },
  { year: '2024', title: '$2.8B+ Career Volume',   desc: 'Achieved a historic cumulative transaction volume milestone across 18 prime global metros.' },
];

/* ── page ─────────────────────────────────────────────────────────────────── */

export default function AboutPage() {
  const [stats,   setStats]   = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsApi.get()
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* derived / fallback values */
  const agentsCount  = stats?.agents_count  ?? 64;
  const propsCount   = stats?.properties_count ?? 280;
  const volumeLabel  = stats?.total_volume ? fmtVol(stats.total_volume) : '$2.8B+';
  const leaders      = stats?.featured_agents ?? [];

  return (
    <div className="bg-background min-h-screen">
      <div className="flex flex-col w-full">

        {/* ── Breadcrumb ── */}
        <section className="max-w-[1360px] w-full mx-auto px-6 lg:px-8 pt-6 pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <nav className="flex items-center gap-1.5 text-sm text-on-surface-variant">
              <Link href="/" className="hover:text-on-surface transition-colors">Home</Link>
              <span className="text-outline-variant">/</span>
              <Link href="/about" className="hover:text-on-surface transition-colors">About</Link>
              <span className="text-outline-variant">/</span>
              <span className="text-on-surface font-semibold">Our Story &amp; Provenance</span>
            </nav>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface text-xs w-fit">
              <span className="w-2 h-2 rounded-full bg-secondary-container" />
              Institutional Heritage • Founded 2008 • Beverly Hills &amp; Global Metros
            </div>
          </div>
        </section>

        {/* ── Editorial Hero Banner ── */}
        <section className="max-w-[1360px] w-full mx-auto px-6 lg:px-8 pb-10">
          <div className="relative rounded-xl overflow-hidden shadow-xl bg-primary-container text-on-primary">
            {/* bg gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-container via-primary-container/85 to-transparent z-10" />

            {/* content */}
            <div className="relative z-20 px-5 sm:px-8 lg:px-14 py-8 sm:py-14 md:py-20 max-w-3xl flex flex-col gap-5">
              <div className="inline-flex items-center gap-2 text-secondary-fixed text-xs uppercase tracking-wider">
                <BadgeCheck size={15} className="fill-secondary-fixed text-primary-container" />
                Private Advisory &amp; Fiduciary Firm
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-on-primary tracking-tight leading-[1.08] font-display">
                Architectural Distinction. <br className="hidden sm:inline" />
                <span className="text-secondary-fixed">Uncompromising</span> Discretion.
              </h1>

              <p className="text-base text-on-primary-container leading-relaxed max-w-2xl">
                Curating the world&apos;s most extraordinary residences, landmark estates, and architecturally singular
                compounds for discerning family offices and global connoisseurs.
              </p>

              {/* metric pills */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                {[
                  { Icon: TrendingUp, value: volumeLabel,    label: 'Career Volume'       },
                  { Icon: Star,        value: 'Top 1%',      label: 'Global Advisory'     },
                  { Icon: Lock,        value: 'Off-Market',  label: 'Verified Mandates'   },
                ].map(({ Icon, value, label }) => (
                  <div key={label} className="flex items-center gap-3 bg-surface-container-lowest/10 backdrop-blur-md px-4 py-2.5 rounded-lg text-on-primary">
                    <Icon size={20} className="text-secondary-fixed shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-lg font-semibold leading-none">{value}</span>
                      <span className="text-xs text-on-primary-container mt-0.5">{label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Provenance Metrics Row ── */}
        <section className="max-w-[1360px] w-full mx-auto px-6 lg:px-8 pb-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { badge: 'Heritage',   Icon: Globe,     value: '16+',           desc: 'Years of Advisory (Est. 2008)' },
              { badge: 'Transacted', Icon: TrendingUp, value: volumeLabel,    desc: 'Trophy Real Estate Volume' },
              {
                badge: 'Clientele',  Icon: Users,
                value: loading ? '—' : `${(agentsCount * 28).toLocaleString()}+`,
                desc: 'Discreet Principals Advised',
              },
              { badge: 'Footprint',  Icon: Globe,     value: '18',            desc: 'Prime Metros Across 4 Continents' },
            ].map(({ badge, Icon, value, desc }) => (
              <div key={badge} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between h-44 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-secondary uppercase tracking-widest">{badge}</span>
                  <Icon size={18} className="text-outline" />
                </div>
                <div>
                  <div className="text-4xl lg:text-5xl font-semibold text-on-surface leading-none tracking-tight font-display">{value}</div>
                  <p className="text-sm text-on-surface-variant pt-2">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Two-Column Story ── */}
        <section className="max-w-[1360px] w-full mx-auto px-6 lg:px-8 pb-14 lg:pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

            {/* Left: image + floating card */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-xl overflow-hidden shadow-lg h-[480px] bg-surface-container">
                {/* gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary-container/70 via-transparent to-transparent z-10" />
                <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,#1a2f4a_0%,#0d1c32_100%)] flex items-center justify-center">
                  <div className="text-center text-on-primary/20">
                    <Landmark size={80} />
                  </div>
                </div>
              </div>

              {/* Floating glassmorphism card */}
              <div className="absolute -bottom-6 right-4 left-4 sm:left-auto sm:right-8 sm:max-w-xs bg-surface-container-lowest/95 backdrop-blur-md p-4 rounded-xl shadow-xl z-20">
                <div className="flex items-center gap-3 pb-2">
                  <Landmark size={22} className="text-secondary shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-on-surface">Fiduciary Standard</span>
                </div>
                <p className="text-sm text-on-surface-variant leading-snug">
                  Built collaboratively by licensed architects, senior wealth fiduciaries, and discreet private negotiators.
                </p>
              </div>
            </div>

            {/* Right: narrative */}
            <div className="lg:col-span-6 flex flex-col gap-5 pt-8 lg:pt-0">
              <div className="inline-flex items-center gap-1.5 text-sm text-secondary">
                <Star size={14} className="fill-secondary text-secondary" />
                The EstateLux Provenance
              </div>
              <h2 className="text-2xl lg:text-3xl font-semibold text-on-surface tracking-tight font-display">
                A New Standard for Prime Global Real Estate
              </h2>
              <p className="text-on-surface-variant leading-relaxed">
                Founded in 2008 in Beverly Hills, EstateLux began as a private syndicate of bespoke brokers and design
                purists seeking an alternative to transactional brokerages. Over sixteen years, we have organically
                expanded into an international powerhouse representing iconic residences throughout Los Angeles, Manhattan,
                South Florida, Aspen, London, and the Côte d&apos;Azur.
              </p>
              <p className="text-on-surface-variant leading-relaxed">
                We treat each estate not merely as square footage, but as irreplaceable architectural heritage. Our
                fiduciaries navigate generational asset transitions, cross-border estate acquisitions, and confidential
                private sales with meticulous legal care.
              </p>

              {/* Mission quote */}
              <div className="bg-surface-container p-5 rounded-xl flex gap-4 mt-1">
                <div className="w-1.5 bg-secondary rounded-full shrink-0" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Our Core Mandate</span>
                  <p className="text-base text-on-surface italic font-medium leading-relaxed">
                    &ldquo;Our mission is not merely to facilitate transactions, but to act as unyielding guardians for
                    irreplaceable architectural patrimony and client privacy.&rdquo;
                  </p>
                </div>
              </div>

              {/* Founders */}
              <div className="flex items-center gap-6 pt-1">
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-on-surface">Elena Vance</span>
                  <span className="text-xs text-on-surface-variant">Founder &amp; Principal Broker</span>
                </div>
                <div className="h-8 w-px bg-surface-container-highest" />
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-on-surface">David Holbrooke</span>
                  <span className="text-xs text-on-surface-variant">Partner &amp; Chief Architectural Counsel</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Core Values ── */}
        <section className="max-w-[1360px] w-full mx-auto px-6 lg:px-8 pb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Foundational Pillars</span>
              <h2 className="text-2xl lg:text-3xl font-semibold text-on-surface tracking-tight font-display">
                The Principles That Guide Us
              </h2>
            </div>
            <p className="text-sm text-on-surface-variant max-w-md">
              Every negotiation, audit, and client partnership is executed according to institutional protocols
              established over sixteen years of flawless track record.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CORE_VALUES.map(({ Icon, title, desc, footer }) => (
              <div
                key={title}
                className="bg-surface-container-lowest p-8 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary-container mb-5 group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-semibold text-on-surface mb-2">{title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{desc}</p>
                </div>
                <div className="pt-6 flex items-center gap-1.5 text-secondary text-sm">
                  <span>{footer}</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Leadership (live from backend) ── */}
        <section className="max-w-[1360px] w-full mx-auto px-6 lg:px-8 pb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Global Executive Team</span>
              <h2 className="text-2xl lg:text-3xl font-semibold text-on-surface tracking-tight font-display">
                Our Leadership &amp; Advisory Board
              </h2>
            </div>
            <Link
              href="/agents"
              className="inline-flex items-center gap-1.5 text-sm text-on-surface hover:text-secondary transition-colors font-medium"
            >
              View all {agentsCount} Senior Advisors <ArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-surface-container-lowest shadow-sm p-4">
                  <div className="w-full aspect-[4/5] rounded-lg skeleton mb-4" />
                  <div className="h-4 w-3/4 skeleton rounded mb-2" />
                  <div className="h-3 w-1/2 skeleton rounded" />
                </div>
              ))}
            </div>
          ) : leaders.length === 0 ? (
            /* fallback static cards when no agents exist */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Elena Vance',        title: 'Director of Luxury Estates',   city: 'Beverly Hills & Westside LA', vol: '$940M Career Vol.',  role: 'Managing Partner' },
                { name: 'Julian Montgomery',  title: 'Senior Vice President',        city: 'Tribeca, Manhattan & Hamptons', vol: '$780M Career Vol.', role: 'Flagship Leader'  },
                { name: 'Sophia Al-Mansoor',  title: 'Director of Coastal Estates',  city: 'Miami Beach & Palm Beach',     vol: '$620M Career Vol.', role: 'Director'         },
                { name: 'Marcus Sterling',    title: 'Alpine & Equestrian Partner',  city: 'Aspen, Vail & Lake Tahoe',     vol: '$510M Career Vol.', role: 'Partner'          },
              ].map(m => (
                <div key={m.name} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden mb-4 bg-primary-container/10 flex items-center justify-center">
                      <span className="text-5xl font-bold text-primary-container font-display">{m.name.charAt(0)}</span>
                      <div className="absolute top-3 right-3 bg-surface-container-lowest/90 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <BadgeCheck size={12} className="text-secondary fill-secondary" />
                        <span className="text-[10px] uppercase font-bold text-on-surface">{m.role}</span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-base font-semibold text-on-surface">{m.name}</h4>
                      <span className="text-sm text-secondary">{m.title}</span>
                      <span className="text-xs text-on-surface-variant pt-1">{m.city}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between border-t border-outline-variant/10">
                    <span className="text-xs font-semibold text-on-surface">{m.vol}</span>
                    <div className="flex items-center gap-1">
                      <button className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-secondary hover:text-on-secondary transition-colors">
                        <Mail size={13} />
                      </button>
                      <button className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-secondary hover:text-on-secondary transition-colors">
                        <Phone size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {leaders.map(agent => {
                const aName   = agent.user?.full_name ?? 'Agent';
                const aVol    = agent.total_volume ? fmtVol(agent.total_volume) + ' Career Vol.' : `${agent.properties_count ?? 0} Active`;
                const aRole   = agent.specialization?.split(',')[0]?.trim() ?? 'Advisor';
                const aInitial = aName.charAt(0).toUpperCase();
                return (
                  <div key={agent.id} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden mb-4 bg-surface-container">
                        {agent.user?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={agent.user.avatar_url} alt={aName} className="w-full h-full object-cover object-top" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-primary-container font-display bg-primary-container/10">
                            {aInitial}
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-surface-container-lowest/90 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <BadgeCheck size={12} className="text-secondary fill-secondary" />
                          <span className="text-[10px] uppercase font-bold text-on-surface truncate max-w-[80px]">{aRole}</span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <h4 className="text-base font-semibold text-on-surface">{aName}</h4>
                        <span className="text-sm text-secondary">{agent.specialization ?? 'Real Estate Advisor'}</span>
                        <span className="text-xs text-on-surface-variant pt-1">{agent.user?.email?.split('@')[1] ?? 'Global'}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 flex items-center justify-between border-t border-outline-variant/10">
                      <span className="text-xs font-semibold text-on-surface">{aVol}</span>
                      <div className="flex items-center gap-1">
                        {agent.user?.email && (
                          <a href={`mailto:${agent.user.email}`} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-secondary hover:text-on-secondary transition-colors">
                            <Mail size={13} />
                          </a>
                        )}
                        {agent.user?.phone && (
                          <a href={`tel:${agent.user.phone}`} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-secondary hover:text-on-secondary transition-colors">
                            <Phone size={13} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Timeline ── */}
        <section className="max-w-[1360px] w-full mx-auto px-6 lg:px-8 pb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Corporate History</span>
              <h2 className="text-2xl lg:text-3xl font-semibold text-on-surface tracking-tight font-display">
                A Legacy in the Making
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIMELINE.map(({ year, title, desc }) => (
              <div key={year} className="p-6 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-3">
                <span className="text-xs font-semibold text-secondary uppercase tracking-widest">{year}</span>
                <h4 className="text-lg font-semibold text-on-surface">{title}</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Press Recognition ── */}
        <section className="max-w-[1360px] w-full mx-auto px-6 lg:px-8 pb-10">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
            <div className="text-center mb-5">
              <span className="text-xs uppercase tracking-widest text-on-surface-variant">
                Recognized &amp; Quoted By Global Financial &amp; Architectural Authorities
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 items-center justify-items-center opacity-70">
              {PRESS.map(({ name, style }) => (
                <div
                  key={name}
                  className={`text-lg text-on-surface hover:opacity-100 transition-opacity cursor-pointer text-center ${style}`}
                >
                  {name.includes('Bloomberg') ? (
                    <>Bloomberg <span className="font-normal text-secondary">Pursuits</span></>
                  ) : name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="max-w-[1360px] w-full mx-auto px-6 lg:px-8 pb-12">
          <div className="relative bg-primary-container text-on-primary rounded-2xl overflow-hidden p-6 sm:p-10 lg:p-16 shadow-2xl">
            {/* ambient glows */}
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl flex flex-col gap-5">
              <div className="inline-flex items-center gap-2 text-secondary-fixed text-xs uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
                Private Client Advisory
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-on-primary tracking-tight font-display">
                Partner with the World&apos;s Foremost Architectural Authority
              </h2>
              <p className="text-sm text-on-primary-container leading-relaxed">
                Whether commissioning a discreet off-market acquisition or orchestrating the global disposition of a
                landmark residence, our managing partners provide unparalleled fiduciary stewardship.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <Link
                  href="/contact"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-secondary text-on-secondary text-sm font-semibold hover:bg-secondary-container hover:text-on-secondary-container transition-all shadow-md"
                >
                  Schedule Private Consultation
                </Link>
                <Link
                  href="/properties"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-lg bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 text-on-primary text-sm font-medium backdrop-blur-md transition-all"
                >
                  Explore Active Portfolios
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
