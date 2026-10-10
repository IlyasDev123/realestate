'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, MapPin, ArrowRight, Home, Building2, Waves, Building,
  LandPlot, Shield, Star, Headphones, BadgeCheck, ChevronLeft,
  ChevronRight, TrendingUp, Users, Handshake, Globe,
} from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import SectionHeader from '@/components/ui/SectionHeader';
import StatCard from '@/components/ui/StatCard';
import AgentCard from '@/components/ui/AgentCard';
import CTABanner from '@/components/ui/CTABanner';
import PropertyTypeCard from '@/components/ui/PropertyTypeCard';
import { PropertyCardSkeleton, AgentCardSkeleton } from '@/components/ui/Skeleton';
import { propertiesApi, agentsApi, statsApi } from '@/lib/api';
import { ApiProperty, ApiAgent, ApiStats } from '@/lib/api-types';

function fmtVol(raw: string): string {
  const n = parseFloat(raw);
  if (!n) return '$2.8B+';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B+`;
  if (n >= 1_000_000)     return `$${Math.round(n / 1_000_000)}M+`;
  return `$${Math.round(n / 1_000)}K+`;
}

/* ── Static config data ── */
const PROPERTY_TYPES = [
  { icon: Home,      label: 'Residential', count: '1,420 Masterpieces',  href: '/properties?type=residential' },
  { icon: Building2, label: 'Commercial',  count: '380 Prime Assets',    href: '/properties?type=commercial'  },
  { icon: Waves,     label: 'Waterfront',  count: '215 Coastal Estates', href: '/properties?type=residential' },
  { icon: Building,  label: 'Penthouses',  count: '160 Sky Residences',  href: '/properties?type=residential' },
  { icon: LandPlot,  label: 'Plots & Acreage', count: '94 Prime Parcels', href: '/properties?type=plot'      },
];

const STAT_CONFIG = [
  {
    icon: TrendingUp,
    badge: 'Audited',
    label: 'Transacted Volume',
    description: 'Lifetime cumulative transaction liquidity across premier metros.',
    fallback: '$2.8B+',
  },
  {
    icon: BadgeCheck,
    badge: 'Exclusive',
    label: 'Vetted Luxury Estates',
    description: 'Stringent multi-stage structural & legal deed certification.',
    fallback: '1,850+',
  },
  {
    icon: Handshake,
    badge: 'Top Tier',
    label: 'Client Satisfaction',
    description: 'High-net-worth principal retention and repeat acquisition rate.',
    fallback: '99.4%',
  },
  {
    icon: Globe,
    badge: 'Global',
    label: 'Prime Metros',
    description: 'Bespoke advisory presences in North America, Europe, and the UAE.',
    fallback: '18',
  },
];

const PILLARS = [
  {
    icon: Shield,
    title: '100% Verified Portfolios',
    desc: 'Every listing completes a strict proprietary due diligence process: title validation, structural engineering audits, and documented architectural provenance before public or off-market offering.',
    cta: 'Read Audit Methodology',
  },
  {
    icon: Star,
    title: 'Private Advisory & Top 1%',
    desc: 'Direct personal representation by credentialed senior partners. Enjoy exclusive, confidential access to unlisted trophy properties, legacy pocket listings, and pre-market architectural commissions globally.',
    cta: 'Explore Private Office',
  },
  {
    icon: Headphones,
    title: 'Seamless Escrow & Concierge',
    desc: 'Institutional-grade encrypted closing protocols and a dedicated relocation concierge that orchestrates art transit, interior curation, and aircraft transfers.',
    cta: 'View Concierge Services',
  },
];

const CITY_FILTERS = ['All', 'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'];

export default function HomePage() {
  const router = useRouter();

  /* Search state */
  const [purpose, setPurpose] = useState<'sale' | 'rent'>('sale');
  const [searchCity, setSearchCity] = useState('');
  const [searchType, setSearchType] = useState('');

  /* Data state */
  const [featured,       setFeatured]       = useState<ApiProperty[]>([]);
  const [latest,         setLatest]         = useState<ApiProperty[]>([]);
  const [agents,         setAgents]         = useState<ApiAgent[]>([]);
  const [stats,          setStats]          = useState<ApiStats | null>(null);
  const [propertyTotal,  setPropertyTotal]  = useState(0);
  const [activeCity,     setActiveCity]     = useState('All');

  /* Loading states */
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingLatest,   setLoadingLatest]   = useState(true);
  const [loadingAgents,   setLoadingAgents]   = useState(true);

  /* Featured carousel page (desktop 3-up) */
  const [featuredPage, setFeaturedPage] = useState(0);
  const PER_PAGE = 3;

  useEffect(() => {
    propertiesApi.list({ is_featured: 1, per_page: 6 })
      .then(r => setFeatured(r.data))
      .catch(() => {})
      .finally(() => setLoadingFeatured(false));

    propertiesApi.list({ per_page: 6 })
      .then(r => { setLatest(r.data); setPropertyTotal(r.meta.total); })
      .catch(() => {})
      .finally(() => setLoadingLatest(false));

    agentsApi.list({ per_page: 4, approval_status: 'approved' })
      .then(r => setAgents(r.data))
      .catch(() => {})
      .finally(() => setLoadingAgents(false));

    statsApi.get()
      .then(r => setStats(r.data))
      .catch(() => {});
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (searchCity) p.set('location', searchCity);
    if (searchType) p.set('type', searchType);
    p.set('purpose', purpose);
    router.push(`/properties?${p}`);
  }

  /* Carousel helpers */
  const totalPages  = Math.ceil(featured.length / PER_PAGE);
  const visibleCards = featured.slice(featuredPage * PER_PAGE, featuredPage * PER_PAGE + PER_PAGE);

  function prevPage() { setFeaturedPage(p => Math.max(0, p - 1)); }
  function nextPage() { setFeaturedPage(p => Math.min(totalPages - 1, p + 1)); }

  /* Latest filtered by city */
  const displayedLatest = activeCity === 'All'
    ? latest
    : latest.filter(p => p.city.toLowerCase().includes(activeCity.toLowerCase()));

  return (
    <div className="bg-background">

      {/* ═══════════════════════════════════════
          1. HERO SECTION
      ═══════════════════════════════════════ */}
      <section className="relative w-full -mt-20 overflow-visible">

        {/* Background image + gradient */}
        <div
          className="relative w-full h-[640px] lg:h-[700px] bg-cover bg-center flex items-start justify-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=85')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary-container/80 via-primary-container/50 to-background" />

          {/* Hero text */}
          <div className="relative z-10 max-w-[1360px] w-full mx-auto px-6 lg:px-8 pt-40 pb-32 flex flex-col items-center text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-lowest/15 backdrop-blur-md border border-on-primary/15 mb-6">
              <BadgeCheck size={14} className="text-secondary-fixed" />
              <span className="text-xs text-secondary-fixed tracking-widest uppercase font-semibold">
                Premier Global Real Estate
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-on-primary max-w-4xl tracking-tight leading-[1.06] drop-shadow-sm mb-5">
              Find Your Perfect Property
            </h1>

            <p className="text-on-primary/80 text-lg leading-relaxed max-w-2xl font-light">
              Curated luxury residences, penthouses, and private estates across premier global destinations.
            </p>
          </div>
        </div>

        {/* ── Floating Search Card ── */}
        <div className="max-w-[1240px] w-full mx-auto px-6 lg:px-8 -mt-24 relative z-20">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl p-6 flex flex-col gap-5">

            {/* Purpose tabs + count */}
            <div className="flex items-center justify-between">
              <div className="inline-flex p-1 bg-surface-container-low rounded-xl">
                {(['sale', 'rent'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPurpose(p)}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                      purpose === p
                        ? 'bg-primary-container text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {p === 'sale' ? 'Buy' : 'Rent'}
                  </button>
                ))}
              </div>
              <div className="hidden md:flex items-center gap-2 text-on-surface-variant text-xs font-medium">
                <Search size={14} className="text-secondary shrink-0" />
                <span>{propertyTotal > 0 ? `${propertyTotal.toLocaleString()}+` : '340+'} Verified Exclusive Properties Active</span>
              </div>
            </div>

            {/* Form row */}
            <form
              onSubmit={handleSearch}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-center"
            >
              {/* Destination */}
              <div className="lg:col-span-5 flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                <MapPin size={20} className="text-secondary shrink-0" />
                <div className="flex flex-col text-left flex-1 min-w-0">
                  <label
                    htmlFor="hero-city"
                    className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold"
                  >
                    Destination
                  </label>
                  <input
                    id="hero-city"
                    type="text"
                    placeholder="City, ZIP or Area"
                    value={searchCity}
                    onChange={e => setSearchCity(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-on-surface outline-none placeholder:text-outline truncate"
                  />
                </div>
              </div>

              {/* Property Type */}
              <div className="lg:col-span-4 flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                <Building2 size={20} className="text-secondary shrink-0" />
                <div className="flex flex-col text-left flex-1 min-w-0">
                  <label
                    htmlFor="hero-type"
                    className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold"
                  >
                    Property Type
                  </label>
                  <select
                    id="hero-type"
                    value={searchType}
                    onChange={e => setSearchType(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-on-surface outline-none cursor-pointer truncate"
                  >
                    <option value="">Any Type</option>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="plot">Plot / Land</option>
                  </select>
                </div>
              </div>

              {/* Search CTA */}
              <div className="lg:col-span-3">
                <button
                  type="submit"
                  className="w-full h-14 rounded-xl bg-secondary-container hover:bg-secondary text-on-secondary-container hover:text-on-secondary flex items-center justify-center gap-2 font-semibold text-sm shadow-lg transition-all duration-200 active:scale-95"
                >
                  <Search size={18} />
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          2. PROPERTY CATEGORIES
      ═══════════════════════════════════════ */}
      <section className="w-full max-w-[1360px] mx-auto px-6 lg:px-8 pt-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-3">
          <SectionHeader
            eyebrow="Curated Portfolios"
            title="Explore Architectural Typologies"
          />
          <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed">
            Discreet asset classification engineered for private collectors and structural purists.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {PROPERTY_TYPES.map(type => (
            <PropertyTypeCard key={type.label} {...type} />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          3. FEATURED TROPHY LISTINGS
      ═══════════════════════════════════════ */}
      <section className="w-full max-w-[1360px] mx-auto px-6 lg:px-8 pt-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-secondary text-xs font-semibold uppercase tracking-widest">
              <Star size={13} className="fill-secondary" />
              <span>Curated Selection</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-on-surface font-display tracking-tight mt-1">
              Featured Trophy Listings
            </h2>
          </div>

          {/* Carousel controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevPage}
              disabled={featuredPage === 0}
              aria-label="Previous"
              className="w-11 h-11 rounded-full bg-surface-container-lowest shadow-sm hover:shadow-md flex items-center justify-center text-on-surface transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextPage}
              disabled={featuredPage >= totalPages - 1}
              aria-label="Next"
              className="w-11 h-11 rounded-full bg-surface-container-lowest shadow-sm hover:shadow-md flex items-center justify-center text-on-surface transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
            <Link
              href="/properties?is_featured=1"
              className="ml-4 text-secondary text-sm font-semibold hover:underline hidden sm:flex items-center gap-1"
            >
              See All ({featured.length}) <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {loadingFeatured ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleCards.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        ) : (
          <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-outline-variant/10">
            <p className="text-on-surface-variant text-sm mb-4">
              No featured properties at the moment.
            </p>
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-6 py-2.5 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
            >
              Browse All Properties <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════
          4. TRUST / STATS BENCHMARK
      ═══════════════════════════════════════ */}
      <section className="w-full max-w-[1360px] mx-auto px-6 lg:px-8 pt-16">
        <div className="w-full bg-surface-container-low rounded-3xl p-8 lg:p-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { ...STAT_CONFIG[0], value: stats?.total_volume ? fmtVol(stats.total_volume) : STAT_CONFIG[0].fallback },
              { ...STAT_CONFIG[1], value: propertyTotal > 0 ? `${propertyTotal.toLocaleString()}+` : STAT_CONFIG[1].fallback },
              { ...STAT_CONFIG[2], value: STAT_CONFIG[2].fallback },
              { ...STAT_CONFIG[3], value: STAT_CONFIG[3].fallback },
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ].map(({ fallback: _, ...stat }) => <StatCard key={stat.label} {...stat} />)}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          5. WHY CHOOSE US
      ═══════════════════════════════════════ */}
      <section className="w-full max-w-[1360px] mx-auto px-6 lg:px-8 pt-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <SectionHeader
            eyebrow="Unrivaled Standard"
            title="Why Discerning Clients Choose EstateLux"
            subtitle="We eliminate operational ambiguity through institutional rigour, private brokerage access, and bespoke concierge execution."
            align="center"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PILLARS.map(({ icon: Icon, title, desc, cta }) => (
            <div
              key={title}
              className="flex flex-col p-8 rounded-2xl bg-surface-container-lowest shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed mb-6">
                <Icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">{title}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6 flex-1">{desc}</p>
              <div className="flex items-center gap-2 text-secondary text-sm font-semibold">
                <span>{cta}</span>
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          6. LATEST ADDITIONS TO MARKET
      ═══════════════════════════════════════ */}
      <section className="w-full max-w-[1360px] mx-auto px-6 lg:px-8 pt-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-4">
          <SectionHeader eyebrow="Fresh Acquisitions" title="Latest Additions to Market" />

          {/* City filter tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-surface-container-low p-1 rounded-xl">
            {CITY_FILTERS.map(city => (
              <button
                key={city}
                onClick={() => setActiveCity(city)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeCity === city
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {loadingLatest ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
          </div>
        ) : displayedLatest.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedLatest.slice(0, 6).map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        ) : (
          <div className="text-center py-16 bg-surface-container-lowest rounded-2xl">
            <p className="text-on-surface-variant text-sm">No properties found for this city.</p>
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Link
            href="/properties"
            className="px-8 py-4 rounded-xl bg-primary-container text-on-primary font-semibold text-sm hover:opacity-90 transition-all shadow-md flex items-center gap-2"
          >
            View All {propertyTotal > 0 ? `${propertyTotal.toLocaleString()}+` : '340+'} Properties
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          7. PRIVATE CLIENT ADVISORY TEAM
      ═══════════════════════════════════════ */}
      <section className="w-full max-w-[1360px] mx-auto px-6 lg:px-8 pt-16 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-3">
          <SectionHeader eyebrow="Senior Leadership" title="Private Client Advisory Team" />
          <p className="text-sm text-on-surface-variant max-w-md leading-relaxed">
            Work with industry-leading specialists in prime global markets who oversee discreet off-market transactions.
          </p>
        </div>

        {loadingAgents ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <AgentCardSkeleton key={i} />)}
          </div>
        ) : agents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {agents.map(agent => <AgentCard key={agent.id} agent={agent} />)}
          </div>
        ) : null}
      </section>

      {/* ═══════════════════════════════════════
          8. CTA BANNER
      ═══════════════════════════════════════ */}
      <CTABanner
        title="Ready to Find Your Architectural Masterpiece?"
        description="Connect with our private client advisory team or request discreet off-market representation for unlisted premier acquisitions."
        primaryLabel="Schedule Private Consultation"
        primaryHref="/contact"
        secondaryLabel="Explore Off-Market Portfolio"
        secondaryHref="/properties"
      />
    </div>
  );
}
