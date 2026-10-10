'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Heart, Bed, Bath, Square, Car,
  MapPin, Phone, Mail, CheckCircle2, ChevronLeft, ChevronRight,
  Share2, Loader2, ZoomIn, Calendar, User, Building2,
} from 'lucide-react';
import { propertiesApi, leadsApi, ApiError } from '@/lib/api';
import { ApiProperty } from '@/lib/api-types';
import { favoritesStore } from '@/lib/favorites';
import PropertyCard from '@/components/PropertyCard';
import { formatPrice } from '@/components/PropertyCard';

const typeLabels: Record<string, string> = {
  residential: 'Residential',
  commercial:  'Commercial',
  plot:        'Plot / Land',
};

const statusColors: Record<string, string> = {
  available: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  reserved:  'bg-amber-50  text-amber-700  border border-amber-200',
  sold:      'bg-red-50    text-red-700    border border-red-200',
  rented:    'bg-blue-50   text-blue-700   border border-blue-200',
  draft:     'bg-surface-container text-on-surface-variant border border-outline-variant/20',
};

const THUMB_LABELS = ['Exterior', 'Living', 'Poolside', 'Master', 'Kitchen', 'More'];

export default function PropertyDetailPage() {
  const params  = useParams();
  const id      = typeof params.id === 'string' ? params.id : (params.id?.[0] ?? '');

  const [property,    setProperty]    = useState<ApiProperty | null>(null);
  const [related,     setRelated]     = useState<ApiProperty[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [notFound,    setNotFound]    = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [liked,       setLiked]       = useState(false);

  useEffect(() => {
    if (id) setLiked(favoritesStore.has(id));
  }, [id]);
  const [copied,      setCopied]      = useState(false);
  const [showAll,     setShowAll]     = useState(false);

  const [form,       setForm]       = useState({ name: '', phone: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [formError,  setFormError]  = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    propertiesApi.get(id)
      .then(async res => {
        setProperty(res.data);
        try {
          const relatedRes = await propertiesApi.list({ type: res.data.type, per_page: 5 });
          setRelated(relatedRes.data.filter(p => p.id !== id).slice(0, 3));
        } catch {
          // related properties are non-critical
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!property) return;
    setFormError('');
    setSubmitting(true);
    try {
      await leadsApi.submit({
        client_name:            form.name,
        phone:                  form.phone,
        email:                  form.email    || undefined,
        interested_property_id: property.id,
        visitor_message:        form.message  || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: property?.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-secondary" />
          <p className="text-sm text-on-surface-variant">Loading property…</p>
        </div>
      </div>
    );
  }

  if (notFound || !property) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-lowest shadow-sm flex items-center justify-center mx-auto mb-5">
            <Building2 size={28} className="text-on-surface-variant" />
          </div>
          <h2 className="text-2xl font-bold text-on-surface font-display mb-2">Property Not Found</h2>
          <p className="text-on-surface-variant text-sm mb-7">This listing may have been removed or is no longer available.</p>
          <Link href="/properties" className="inline-flex items-center gap-2 bg-primary-container text-on-primary px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            <ArrowLeft size={15} /> Browse All Listings
          </Link>
        </div>
      </div>
    );
  }

  const images = property.images ?? [];
  const formattedPrice = formatPrice(property.price, property.purpose);

  return (
    <div className="bg-background min-h-screen">

      {/* ── Breadcrumb & Action Bar ── */}
      <div className="w-full bg-surface-container-lowest/80 backdrop-blur-md sticky top-20 z-40 shadow-sm">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Link href="/" className="hover:text-on-surface transition-colors flex items-center gap-1">
              Home
            </Link>
            <span className="text-outline-variant">/</span>
            <Link href="/properties" className="hover:text-on-surface transition-colors">Properties</Link>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface font-semibold truncate max-w-[200px] md:max-w-xs">{property.title}</span>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-sm font-medium transition-all shadow-sm"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
            </button>
            <button
              onClick={() => setLiked(favoritesStore.toggle(id))}
              aria-label={liked ? 'Remove from saved' : 'Save property'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                liked
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
              }`}
            >
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
              <span className="hidden sm:inline">{liked ? 'Saved' : 'Save'}</span>
            </button>
            <Link
              href={`/compare?add=${property.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-container text-on-primary text-sm font-medium hover:bg-opacity-90 transition-all shadow-sm"
            >
              <Building2 size={14} />
              <span className="hidden sm:inline">Compare</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Hero Gallery ── */}
      <section className="max-w-[1360px] mx-auto px-6 lg:px-8 pt-5 w-full">
        <div className="flex flex-col gap-3">
          {/* Main image */}
          <div className="relative w-full h-[420px] lg:h-[560px] rounded-2xl overflow-hidden shadow-xl group select-none bg-surface-container">
            {images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[activeImage]?.url}
                alt={property.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.01]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 size={48} className="text-on-surface-variant/30" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-primary-container/75 via-transparent to-primary-container/30 pointer-events-none" />

            {/* Top badges */}
            <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto">
                <span className="px-3.5 py-1.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold tracking-wider uppercase shadow-md flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-surface animate-ping" />
                  {property.purpose === 'sale' ? 'Exclusive For Sale' : 'For Rent'}
                </span>
                {property.is_featured && (
                  <span className="px-3.5 py-1.5 rounded-full bg-surface/90 text-on-surface text-xs font-semibold backdrop-blur-md shadow-md">
                    Featured
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 pointer-events-auto">
                {images.length > 1 && (
                  <div className="px-3 py-1.5 rounded-full bg-primary-container/80 backdrop-blur-md text-on-primary text-xs font-medium shadow-md">
                    {activeImage + 1} / {images.length} Photos
                  </div>
                )}
              </div>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-4 pointer-events-none">
              <div className="text-on-primary">
                <h2 className="text-xl lg:text-2xl font-semibold text-on-primary font-display drop-shadow-sm tracking-tight">
                  {property.title}
                </h2>
                <p className="flex items-center gap-1 text-sm text-on-primary/80 mt-1">
                  <MapPin size={13} className="text-secondary-fixed" />
                  {property.address ? `${property.address}, ` : ''}{property.city}
                </p>
              </div>
              <div className="flex items-center gap-2 pointer-events-auto">
                {images.length > 1 && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface/90 text-on-surface text-sm font-semibold backdrop-blur-md hover:bg-surface shadow-lg transition-all"
                  >
                    <ZoomIn size={14} className="text-secondary" />
                    All Photos ({images.length})
                  </button>
                )}
              </div>
            </div>

            {/* Prev/Next arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setActiveImage(i => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {images.slice(0, 5).map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`relative h-20 sm:h-24 rounded-xl overflow-hidden transition-all focus:outline-none ${
                    i === activeImage ? 'ring-2 ring-secondary opacity-100' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-primary-container/80 text-[10px] text-on-primary font-medium">
                    {THUMB_LABELS[i] ?? `Photo ${i + 1}`}
                  </span>
                </button>
              ))}
              {images.length > 5 && (
                <button
                  onClick={() => setShowAll(true)}
                  className="relative h-20 sm:h-24 rounded-xl overflow-hidden group/more focus:outline-none shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={images[5].url} alt="More" className="w-full h-full object-cover transition-transform group-hover/more:scale-105" />
                  <div className="absolute inset-0 bg-primary-container/75 backdrop-blur-[2px] flex flex-col items-center justify-center text-on-primary">
                    <span className="text-xl font-bold text-secondary-fixed">+{images.length - 5}</span>
                    <span className="text-xs font-medium">More</span>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Two-column content ── */}
      <main className="max-w-[1360px] mx-auto px-6 lg:px-8 py-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* LEFT: 8 cols */}
          <article className="lg:col-span-8 flex flex-col gap-8">

            {/* Header & pricing */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold tracking-wide uppercase">
                  {property.purpose === 'sale' ? 'FOR SALE' : 'FOR RENT'}
                </span>
                <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-semibold tracking-wide uppercase">
                  {typeLabels[property.type] ?? property.type}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[property.status] ?? statusColors.draft}`}>
                  {property.status}
                </span>
              </div>

              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-on-surface font-display tracking-tight leading-tight">
                  {property.title}
                </h1>
                <div className="flex items-center gap-2 text-on-surface-variant text-sm mt-2">
                  <MapPin size={15} className="text-secondary shrink-0" />
                  <span>{property.address ? `${property.address}, ` : ''}{property.city}</span>
                  <span className="text-outline-variant">•</span>
                  <Link href="#location" className="text-secondary text-sm font-semibold hover:underline flex items-center gap-0.5">
                    View on Map
                  </Link>
                </div>
              </div>

              {/* Price capsule */}
              <div className="p-6 rounded-2xl bg-surface-container-low shadow-sm flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block mb-1">
                    {property.purpose === 'sale' ? 'Asking Price' : 'Monthly Rent'}
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-on-surface font-display tracking-tight">{formattedPrice}</span>
                    {property.area_size && (
                      <span className="text-sm text-on-surface-variant font-medium">
                        per {property.area_unit}
                      </span>
                    )}
                  </div>
                </div>
                {property.is_featured && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest shadow-sm text-on-surface text-xs font-semibold">
                    ⭐ Featured Property
                  </div>
                )}
              </div>
            </div>

            {/* Specs strip */}
            {(property.bedrooms || property.bathrooms || property.area_size || property.parking_spaces > 0) && (
              <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {property.bedrooms != null && property.bedrooms > 0 && (
                  <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col items-center text-center gap-1 hover:shadow-md transition-shadow">
                    <Bed size={22} className="text-secondary" />
                    <span className="text-xl font-bold text-on-surface">{property.bedrooms}</span>
                    <span className="text-xs text-on-surface-variant uppercase tracking-wider">Bedrooms</span>
                  </div>
                )}
                {property.bathrooms != null && (
                  <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col items-center text-center gap-1 hover:shadow-md transition-shadow">
                    <Bath size={22} className="text-secondary" />
                    <span className="text-xl font-bold text-on-surface">{property.bathrooms}</span>
                    <span className="text-xs text-on-surface-variant uppercase tracking-wider">Bathrooms</span>
                  </div>
                )}
                {property.area_size && (
                  <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col items-center text-center gap-1 hover:shadow-md transition-shadow">
                    <Square size={22} className="text-secondary" />
                    <span className="text-xl font-bold text-on-surface">{Number(property.area_size).toLocaleString()}</span>
                    <span className="text-xs text-on-surface-variant uppercase tracking-wider">{property.area_unit}</span>
                  </div>
                )}
                {property.parking_spaces > 0 && (
                  <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col items-center text-center gap-1 hover:shadow-md transition-shadow">
                    <Car size={22} className="text-secondary" />
                    <span className="text-xl font-bold text-on-surface">{property.parking_spaces}</span>
                    <span className="text-xs text-on-surface-variant uppercase tracking-wider">Parking</span>
                  </div>
                )}
                {property.floor != null && (
                  <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col items-center text-center gap-1 hover:shadow-md transition-shadow">
                    <Building2 size={22} className="text-secondary" />
                    <span className="text-xl font-bold text-on-surface">F{property.floor}</span>
                    <span className="text-xs text-on-surface-variant uppercase tracking-wider">Floor</span>
                  </div>
                )}
                {property.type && (
                  <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col items-center text-center gap-1 hover:shadow-md transition-shadow">
                    <Building2 size={22} className="text-secondary" />
                    <span className="text-sm font-bold text-on-surface capitalize">{typeLabels[property.type]}</span>
                    <span className="text-xs text-on-surface-variant uppercase tracking-wider">Type</span>
                  </div>
                )}
              </section>
            )}

            {/* Description */}
            {property.description && (
              <section className="p-8 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-5">
                <h2 className="text-xl font-bold text-on-surface tracking-tight">Property Description</h2>
                <p className="text-on-surface-variant text-base leading-relaxed">{property.description}</p>
              </section>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <section className="p-8 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-on-surface tracking-tight">Amenities & Features</h2>
                  <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface text-xs font-semibold">
                    {property.amenities.length} features
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {property.amenities.map(a => (
                    <div key={a} className="p-4 rounded-xl bg-surface-container-low/50 hover:bg-surface-container-low transition-colors flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                        <CheckCircle2 size={18} />
                      </div>
                      <span className="text-sm text-on-surface font-medium">{a}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Location map */}
            <section id="location" className="p-8 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-on-surface tracking-tight">Location</h2>
                  <p className="text-sm text-on-surface-variant mt-1">{property.city}</p>
                </div>
              </div>
              <div className="relative w-full h-64 rounded-xl overflow-hidden bg-surface-container">
                {property.latitude && property.longitude ? (
                  <iframe
                    src={`https://www.google.com/maps?q=${property.latitude},${property.longitude}&z=14&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Property location"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <MapPin size={32} className="text-secondary mb-2" />
                    <p className="text-sm text-on-surface-variant">{property.city}, Pakistan</p>
                  </div>
                )}
              </div>
            </section>
          </article>

          {/* RIGHT: 4 cols sticky sidebar */}
          <aside className="lg:col-span-4 flex flex-col gap-6 sticky top-[90px]">

            {/* Agent info */}
            {property.agent?.user && (
              <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0 text-lg font-bold font-display">
                    {property.agent.user.full_name?.charAt(0) ?? 'A'}
                  </div>
                  <div>
                    <p className="font-semibold text-on-surface">{property.agent.user.full_name}</p>
                    <p className="text-xs text-on-surface-variant">Licensed Agent</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {property.agent.user.email && (
                    <a
                      href={`mailto:${property.agent.user.email}`}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors"
                    >
                      <Mail size={15} className="text-secondary" /> {property.agent.user.email}
                    </a>
                  )}
                  <Link
                    href={`/agents/${property.agent.id}`}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors"
                  >
                    <User size={15} className="text-secondary" /> View Profile
                  </Link>
                </div>
              </div>
            )}

            {/* Inquiry form */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm">
              {submitted ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-secondary-fixed flex items-center justify-center mb-4">
                    <CheckCircle2 size={26} className="text-secondary" />
                  </div>
                  <h3 className="text-lg font-bold text-on-surface font-display mb-2">Message Sent!</h3>
                  <p className="text-sm text-on-surface-variant">Our team will contact you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-on-surface">Schedule a Viewing</h3>
                    {property.inquiries_count > 0 && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-secondary-fixed/40 border border-secondary/20 text-secondary font-semibold shrink-0">
                        {property.inquiries_count} {property.inquiries_count === 1 ? 'person' : 'people'} interested
                      </span>
                    )}
                  </div>

                  {formError && (
                    <div className="p-3 bg-error-container border border-error/20 rounded-xl text-xs text-on-error-container">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
                      <input
                        required
                        type="text"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Your full name"
                        className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary/50 focus:bg-surface-container-lowest focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Phone *
                    </label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
                      <input
                        required
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="+92 300 0000000"
                        className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary/50 focus:bg-surface-container-lowest focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com"
                        className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary/50 focus:bg-surface-container-lowest focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Message
                    </label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      rows={3}
                      placeholder={`I am interested in ${property.title}…`}
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary/50 focus:bg-surface-container-lowest focus:outline-none transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-secondary-container text-on-secondary-container text-sm font-semibold rounded-xl hover:bg-secondary hover:text-on-secondary disabled:opacity-50 transition-colors active:scale-95"
                  >
                    {submitting ? (
                      <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    ) : (
                      <Calendar size={15} />
                    )}
                    {submitting ? 'Sending…' : 'Schedule Viewing'}
                  </button>

                  <p className="text-xs text-on-surface-variant text-center">
                    Your inquiry is confidential and handled with full discretion.
                  </p>
                </form>
              )}
            </div>

            {/* Property meta */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm">
              <h3 className="text-sm font-semibold text-on-surface mb-4">Property Details</h3>
              <div className="space-y-3">
                {[
                  { label: 'Property ID',  value: `#${property.id.slice(-8).toUpperCase()}` },
                  { label: 'Type',         value: typeLabels[property.type] ?? property.type },
                  { label: 'Purpose',      value: property.purpose === 'sale' ? 'For Sale' : 'For Rent' },
                  { label: 'Status',       value: property.status.charAt(0).toUpperCase() + property.status.slice(1) },
                  { label: 'City',         value: property.city },
                  ...(property.area_size ? [{ label: 'Area', value: `${Number(property.area_size).toLocaleString()} ${property.area_unit}` }] : []),
                  ...(property.views_count ? [{ label: 'Views', value: property.views_count.toLocaleString() }] : []),
                  ...(property.inquiries_count > 0 ? [{ label: 'Interested', value: `${property.inquiries_count} ${property.inquiries_count === 1 ? 'person' : 'people'}` }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-surface-container last:border-0">
                    <span className="text-xs text-on-surface-variant">{label}</span>
                    <span className="text-xs font-semibold text-on-surface">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Similar Properties ── */}
      {related.length > 0 && (
        <section className="w-full bg-surface-container-low py-14">
          <div className="max-w-[1360px] mx-auto px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary">You May Also Like</span>
                <h2 className="text-2xl font-bold text-on-surface font-display mt-1">Similar Properties</h2>
              </div>
              <Link href="/properties" className="text-sm font-semibold text-secondary hover:underline">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Fullscreen gallery overlay ── */}
      {showAll && images.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm font-medium">{activeImage + 1} / {images.length}</span>
            <button onClick={() => setShowAll(false)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white">
              ✕
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center relative px-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[activeImage]?.url} alt={property.title} className="max-h-full max-w-full object-contain rounded-xl" />
            <button
              onClick={() => setActiveImage(i => (i - 1 + images.length) % images.length)}
              className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => setActiveImage(i => (i + 1) % images.length)}
              className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto px-4 pb-4 justify-center">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(i)}
                className={`w-16 h-12 rounded-lg overflow-hidden shrink-0 transition-all ${i === activeImage ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-80'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
