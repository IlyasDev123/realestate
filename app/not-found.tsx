'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Building2, Users, ArrowRight,
  Compass, Heart, Bed, Bath, Maximize2, BadgeCheck,
  ArrowLeftRight, Lock, Anchor, Phone,
} from 'lucide-react';
import { propertiesApi } from '@/lib/api';
import { ApiProperty } from '@/lib/api-types';
import { formatPrice } from '@/components/PropertyCard';
import { favoritesStore } from '@/lib/favorites';

// ── Inline featured card matching design ──────────────────────────────────────
function FeaturedCard({ property }: { property: ApiProperty }) {
  const [liked, setLiked] = useState(false);
  const images = property.images ?? [];
  const badge  = property.purpose === 'sale' ? 'Exclusive Mandate' : 'Available Tenancy';

  useEffect(() => {
    setLiked(favoritesStore.has(property.id));
  }, [property.id]);

  return (
    <div className="group rounded-2xl bg-surface-container-lowest overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-container-highest">
        {images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[0].url}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 size={32} className="text-on-surface-variant/20" />
          </div>
        )}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-primary-container/85 backdrop-blur-md text-on-primary text-xs font-semibold">
          {badge}
        </div>
        <button
          onClick={e => { e.preventDefault(); setLiked(favoritesStore.toggle(property.id)); }}
          aria-label={liked ? 'Remove from saved' : 'Save listing'}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center shadow-sm transition-colors ${
            liked ? 'text-error' : 'text-on-surface hover:text-error'
          }`}
        >
          <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-lg font-bold text-on-surface">{formatPrice(property.price, property.purpose)}</span>
          <span className="text-xs font-semibold text-secondary">{property.city}</span>
        </div>
        <p className="text-base font-semibold text-on-surface line-clamp-1 leading-snug">{property.title}</p>
        <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-2 flex-wrap">
          {property.bedrooms   && <span className="flex items-center gap-1"><Bed     size={12} /> {property.bedrooms} Beds</span>}
          {property.bathrooms  && <span className="flex items-center gap-1"><Bath    size={12} /> {property.bathrooms} Baths</span>}
          {property.area_size  && <span className="flex items-center gap-1"><Maximize2 size={12} /> {Number(property.area_size).toLocaleString()} {property.area_unit}</span>}
        </p>
        <div className="mt-4 pt-3 border-t border-outline-variant/10 flex items-center justify-between">
          <span className="text-xs text-outline">ID #{property.id.slice(0, 8).toUpperCase()}</span>
          <Link
            href={`/properties/${property.id}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-on-surface group-hover:text-secondary transition-colors"
          >
            View Dossier <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Quick links data ──────────────────────────────────────────────────────────
const QUICK_LINKS = [
  { href: '/properties?type=residential', Icon: Building2,      label: 'Bel-Air & Beverly Hills Estates'    },
  { href: '/properties?purpose=sale',     Icon: Anchor,         label: 'Waterfront Compounds'               },
  { href: '/agents',                      Icon: BadgeCheck,     label: 'Managing Partners & Advisors'       },
  { href: '/compare',                     Icon: ArrowLeftRight, label: 'Compare Shortlisted Residences'     },
  { href: '/contact',                     Icon: Lock,           label: 'Confidential Off-Market Registry'   },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NotFound() {
  const [featured, setFeatured] = useState<ApiProperty[]>([]);

  useEffect(() => {
    propertiesApi.list({ is_featured: 1, per_page: 3 }).then(r => setFeatured(r.data)).catch(() => {});
  }, []);

  return (
    <div className="bg-background min-h-screen pt-20">

      {/* ── 404 Hero Stage ───────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden py-10 lg:py-20 flex flex-col items-center justify-center">

        {/* Background: radial sheen + blueprint grid + isometric villa */}
        <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center -z-10">
          <div className="absolute w-[680px] h-[680px] rounded-full bg-gradient-to-tr from-secondary-fixed/40 via-surface-container-high/60 to-transparent blur-3xl opacity-70 -translate-y-8" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.045] stroke-current text-primary-container" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="arch-blueprint-grid" width="64" height="64" patternUnits="userSpaceOnUse">
                <path d="M 64 0 L 0 0 0 64" fill="none" strokeWidth="1" />
                <circle cx="0"  cy="0"  r="1.5" fill="currentColor" />
                <circle cx="64" cy="0"  r="1.5" fill="currentColor" />
                <circle cx="0"  cy="64" r="1.5" fill="currentColor" />
                <circle cx="64" cy="64" r="1.5" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#arch-blueprint-grid)" />
          </svg>
          <svg className="absolute w-[820px] h-[820px] opacity-[0.035] text-primary-container" fill="none" stroke="currentColor" strokeWidth="0.8" viewBox="0 0 400 400">
            <path d="M200 40 L340 120 L200 200 L60 120 Z" />
            <path d="M60 120 L60 260 L200 340 L200 200 Z" />
            <path d="M340 120 L340 260 L200 340 Z" />
            <path d="M200 120 L270 160 L200 200 L130 160 Z" />
            <line x1="130" y1="160" x2="130" y2="230" />
            <line x1="270" y1="160" x2="270" y2="230" />
            <line x1="100" y1="200" x2="160" y2="235" />
            <line x1="240" y1="235" x2="300" y2="200" />
          </svg>
        </div>

        <div className="w-full max-w-[1080px] mx-auto px-6 flex flex-col items-center text-center relative z-10">

          {/* Architectural Status Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-highest/80 backdrop-blur-md shadow-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-xs font-semibold tracking-widest text-on-surface uppercase">
              ERR_OFF_MARKET_OR_RELOCATED • 404 STATUS
            </span>
            <span className="text-xs text-outline">• PRIVATE INDEX</span>
          </div>

          {/* Monumental 404 with Compass Overlay */}
          <div className="relative flex items-center justify-center my-2 select-none">
            <span className="font-display text-[7.5rem] md:text-[11rem] leading-none tracking-tighter font-bold bg-gradient-to-b from-primary-container via-primary-container to-secondary text-transparent bg-clip-text drop-shadow-sm">
              404
            </span>
            <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-surface-container-lowest shadow-md text-secondary">
              <Compass size={22} />
            </div>
          </div>

          {/* Editorial Heading */}
          <h1 className="text-2xl md:text-[2.5rem] md:leading-[3rem] font-semibold text-on-surface tracking-tight max-w-2xl -mt-2">
            This Architectural Landmark Has Moved Off-Market
          </h1>
          <p className="text-base md:text-lg text-on-surface-variant max-w-2xl mt-4 leading-relaxed">
            The estate portfolio dossier, parcel blueprint, or listing record you requested may have
            been privately acquired, repositioned under client discretion, or temporarily archived.
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
            <Link
              href="/properties"
              className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-secondary hover:opacity-90 text-on-secondary text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <ArrowLeft size={17} className="transition-transform duration-300 group-hover:-translate-x-1" />
              Return to Premier Portfolio
            </Link>
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-surface-container text-on-surface text-sm font-semibold hover:bg-surface-container-high transition-all duration-200"
            >
              <Building2 size={17} className="text-secondary" />
              Explore Active MLS Registry
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-surface-container-lowest text-on-surface-variant text-sm font-medium shadow-sm hover:text-on-surface hover:shadow transition-all duration-200"
            >
              <Users size={16} />
              Private Client Desk
            </Link>
          </div>

          {/* Floating Search & Property Discovery Capsule */}
          <div className="w-full max-w-3xl mt-10 p-2 rounded-2xl bg-surface-container-lowest shadow-[0_12px_36px_-6px_rgba(13,28,50,0.08)]">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-low focus-within:bg-surface-container-lowest transition-colors">
                <Search size={18} className="text-outline shrink-0" />
                <input
                  type="text"
                  className="w-full bg-transparent text-sm text-on-surface placeholder:text-outline focus:outline-none"
                  placeholder="Search by enclave, address (Bel-Air, Malibu) or MLS ID..."
                />
              </div>
              <div className="flex items-center px-4 py-2.5 rounded-xl bg-surface-container-low min-w-[190px]">
                <Building2 size={16} className="text-outline mr-2 shrink-0" />
                <select className="w-full bg-transparent text-sm text-on-surface focus:outline-none cursor-pointer">
                  <option value="all">All Asset Classes</option>
                  <option value="residential">Villas &amp; Estates</option>
                  <option value="commercial">Commercial Compounds</option>
                  <option value="plot">Land &amp; Parcels</option>
                </select>
              </div>
              <Link
                href="/properties"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-secondary text-on-secondary text-sm font-semibold hover:opacity-90 transition-colors shadow-sm"
              >
                Discover <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* "Perhaps you were seeking" Quick Links */}
          <div className="w-full max-w-3xl mt-10 flex flex-col items-center">
            <div className="flex items-center gap-3 w-full justify-center mb-4">
              <div className="h-px flex-1 max-w-[80px] bg-outline-variant/60" />
              <span className="text-xs font-semibold text-outline tracking-wider uppercase">Perhaps you were seeking</span>
              <div className="h-px flex-1 max-w-[80px] bg-outline-variant/60" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {QUICK_LINKS.map(({ href, Icon, label }) => (
                <Link
                  key={label}
                  href={href}
                  className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high transition-all text-sm font-medium text-on-surface"
                >
                  <Icon size={14} className="text-secondary group-hover:scale-110 transition-transform" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Premier Acquisitions ────────────────────────────── */}
      <section className="w-full bg-surface-container-low py-16">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary">Immediate Availability</span>
              <h2 className="text-2xl font-semibold text-on-surface tracking-tight mt-1">Featured Premier Acquisitions</h2>
            </div>
            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-secondary/80 transition-colors"
            >
              View Complete Collection <ArrowRight size={16} />
            </Link>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map(p => <FeaturedCard key={p.id} property={p} />)}
            </div>
          ) : (
            /* Skeleton while loading */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl bg-surface-container-lowest overflow-hidden shadow-sm">
                  <div className="aspect-[16/10] bg-surface-container animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-surface-container rounded animate-pulse w-2/3" />
                    <div className="h-4 bg-surface-container rounded animate-pulse w-full" />
                    <div className="h-3 bg-surface-container rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Concierge & Private Placement Bar ────────────────────────── */}
      <section className="w-full bg-surface py-10">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-8">
          <div className="rounded-2xl p-6 bg-primary-container text-on-primary flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl">
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-secondary-container/10 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-4 text-center lg:text-left relative z-10">
              <div className="w-12 h-12 rounded-full bg-surface-container-lowest/10 text-on-primary flex items-center justify-center shrink-0 border border-on-primary/10">
                <Users size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <span className="text-base font-semibold text-on-primary">EstateLux Concierge &amp; Private Placement</span>
                  <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
                </div>
                <p className="text-sm text-on-primary-container mt-0.5">
                  Seeking an unlisted mandate or off-market acquisition? Our advisory team operates 24/7.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 relative z-10 shrink-0">
              <Link
                href="tel:+15551234567"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 text-on-primary text-sm font-medium transition-colors border border-on-primary/10"
              >
                <Phone size={15} /> +1 (555) 123-4567
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-on-secondary text-sm font-semibold hover:opacity-90 transition-opacity shadow-md"
              >
                Initiate Private Inquiry <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
