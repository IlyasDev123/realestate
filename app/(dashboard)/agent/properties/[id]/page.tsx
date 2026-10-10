'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Home, MapPin, Bed, Bath, Car, Layers, Maximize2,
  Eye, MessageSquare, Star, Pencil, Calendar, User,
  AlertCircle, ChevronLeft, ChevronRight, ImageOff,
} from 'lucide-react';
import { propertiesApi } from '@/lib/api';
import { ApiProperty } from '@/lib/api-types';
import { formatPrice } from '@/components/PropertyCard';

const STATUS_CFG: Record<string, { bg: string; text: string; dot: string }> = {
  available: { bg: 'bg-emerald-500/90', text: 'text-white',  dot: 'bg-white/70' },
  draft:     { bg: 'bg-slate-500/85',   text: 'text-white',  dot: 'bg-white/50' },
  reserved:  { bg: 'bg-amber-500/90',   text: 'text-white',  dot: 'bg-white/70' },
  sold:      { bg: 'bg-rose-600/90',    text: 'text-white',  dot: 'bg-white/70' },
  rented:    { bg: 'bg-violet-600/90',  text: 'text-white',  dot: 'bg-white/70' },
};

const TYPE_CFG: Record<string, { bg: string; text: string }> = {
  residential: { bg: 'bg-surface-container-high', text: 'text-on-surface-variant' },
  commercial:  { bg: 'bg-secondary/10',            text: 'text-secondary' },
  plot:        { bg: 'bg-surface-container',        text: 'text-on-surface-variant' },
};

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 border-b border-outline-variant/10 flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
          <Icon size={13} className="text-secondary" />
        </div>
        <h3 className="text-sm font-semibold text-on-surface">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatChip({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-outline-variant/10 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
        <Icon size={13} className="text-secondary" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">{label}</p>
        <p className="text-sm font-medium text-on-surface">{value}</p>
      </div>
    </div>
  );
}

export default function AgentPropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [property, setProperty] = useState<ApiProperty | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    propertiesApi.get(id)
      .then((res) => setProperty(res.data))
      .catch(() => setError('Property not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-outline-variant border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex items-center gap-2 p-4 bg-error-container/60 border border-error/20 rounded-xl text-sm text-on-error-container">
        <AlertCircle size={15} className="shrink-0" />{error || 'Property not found'}
      </div>
    );
  }

  const sc  = STATUS_CFG[property.status] ?? STATUS_CFG.draft;
  const tc  = TYPE_CFG[property.type]     ?? { bg: 'bg-surface-container', text: 'text-on-surface-variant' };
  const imgs = property.images ?? [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span className="font-semibold uppercase tracking-wider">RMS Enterprise</span>
        <span className="text-outline-variant">/</span>
        <Link href="/agent/properties" className="font-semibold text-secondary/70 uppercase tracking-wider hover:text-secondary transition-colors">
          My Properties
        </Link>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider truncate max-w-[200px]">{property.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-on-surface font-display">{property.title}</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Property Detail</p>
          </div>
        </div>
        <Link href={`/agent/properties/${id}/edit`}
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-on-secondary text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-md shrink-0">
          <Pencil size={13} /> Edit Property
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-7">

        {/* ── Left panel ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Image viewer */}
          <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 overflow-hidden shadow-sm">
            <div className="relative h-56 bg-surface-container">
              {imgs.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgs[imgIndex].url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <ImageOff size={32} className="text-on-surface-variant/30" />
                  <p className="text-xs text-on-surface-variant/40">No photos uploaded</p>
                </div>
              )}

              {imgs.length > 1 && (
                <>
                  <button onClick={() => setImgIndex((i) => (i - 1 + imgs.length) % imgs.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setImgIndex((i) => (i + 1) % imgs.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
                    <ChevronRight size={16} />
                  </button>
                  <span className="absolute bottom-2 right-3 text-[11px] font-semibold text-white bg-black/40 px-2 py-0.5 rounded-full">
                    {imgIndex + 1} / {imgs.length}
                  </span>
                </>
              )}

              {property.is_featured && (
                <span className="absolute top-3 left-3 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-secondary text-on-secondary shadow-md">
                  <Star size={10} className="fill-on-secondary" /> Featured
                </span>
              )}
            </div>

            {imgs.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {imgs.map((img, i) => (
                  <button key={img.id} onClick={() => setImgIndex(i)}
                    className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${i === imgIndex ? 'border-secondary' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Identity card */}
          <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 p-5 shadow-sm">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${sc.bg} ${sc.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{property.status}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${tc.bg} ${tc.text}`}>
                {property.type}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary/10 text-secondary">
                For {property.purpose === 'sale' ? 'Sale' : 'Rent'}
              </span>
            </div>

            <p className="text-2xl font-bold text-secondary">{formatPrice(property.price, property.purpose)}</p>
            <p className="text-xs text-on-surface-variant/60 mb-3">{property.purpose === 'rent' ? 'per month' : 'asking price'}</p>

            {property.bedrooms != null && property.bedrooms > 0 && (
              <StatChip icon={Bed}       label="Bedrooms"  value={property.bedrooms} />
            )}
            {property.bathrooms != null && (
              <StatChip icon={Bath}      label="Bathrooms" value={property.bathrooms} />
            )}
            {property.area_size && (
              <StatChip icon={Maximize2} label="Area"      value={`${property.area_size} ${property.area_unit}`} />
            )}
            {property.floor != null && (
              <StatChip icon={Layers}    label="Floor"     value={property.floor} />
            )}
            {property.parking_spaces > 0 && (
              <StatChip icon={Car}       label="Parking"   value={`${property.parking_spaces} space${property.parking_spaces !== 1 ? 's' : ''}`} />
            )}
            <StatChip icon={Eye}           label="Views"      value={property.views_count} />
            <StatChip icon={MessageSquare} label="Inquiries"  value={property.inquiries_count} />

            <div className="pt-3 mt-1 border-t border-outline-variant/10 space-y-1">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant/60">
                <Calendar size={11} />
                <span>Listed {new Date(property.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right panel ────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">

          {property.description && (
            <Section title="Description" icon={Home}>
              <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line">{property.description}</p>
            </Section>
          )}

          <Section title="Location" icon={MapPin}>
            <div>
              <div className="flex justify-between py-3 border-b border-outline-variant/10">
                <span className="text-sm text-on-surface-variant">City</span>
                <span className="text-sm font-medium text-on-surface">{property.city}</span>
              </div>
              {property.address && (
                <div className="flex justify-between py-3 border-b border-outline-variant/10 last:border-0">
                  <span className="text-sm text-on-surface-variant">Address</span>
                  <span className="text-sm font-medium text-on-surface text-right max-w-[60%]">{property.address}</span>
                </div>
              )}
              {property.latitude && property.longitude && (
                <div className="flex justify-between py-3">
                  <span className="text-sm text-on-surface-variant">Coordinates</span>
                  <span className="text-xs font-mono text-on-surface-variant">{property.latitude}, {property.longitude}</span>
                </div>
              )}
            </div>
          </Section>

          <Section title="Features &amp; Specs" icon={Maximize2}>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Type',     value: property.type,    show: true },
                { label: 'Purpose',  value: `For ${property.purpose === 'sale' ? 'Sale' : 'Rent'}`, show: true },
                { label: 'Bedrooms', value: property.bedrooms != null ? String(property.bedrooms) : null, show: property.bedrooms != null },
                { label: 'Bathrooms',value: property.bathrooms != null ? String(property.bathrooms) : null, show: property.bathrooms != null },
                { label: 'Area',     value: property.area_size ? `${property.area_size} ${property.area_unit}` : null, show: !!property.area_size },
                { label: 'Floor',    value: property.floor != null ? String(property.floor) : null, show: property.floor != null },
                { label: 'Parking',  value: property.parking_spaces > 0 ? String(property.parking_spaces) : null, show: property.parking_spaces > 0 },
              ].filter(f => f.show && f.value).map(({ label, value }) => (
                <div key={label} className="bg-surface-container-low rounded-xl px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">{label}</p>
                  <p className="text-sm font-semibold text-on-surface capitalize mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {property.amenities && property.amenities.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2.5">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a) => (
                    <span key={a} className="text-xs font-medium px-3 py-1.5 rounded-full bg-secondary/10 text-secondary capitalize">
                      {a.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {property.agent && (
            <Section title="Assigned Agent" icon={User}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-on-secondary font-bold text-sm shrink-0">
                  {property.agent.user.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{property.agent.user.full_name}</p>
                  <p className="text-xs text-on-surface-variant">{property.agent.user.email}</p>
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
