'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  X, Plus, Search, Building2, ArrowRight, ChevronRight,
  Share2, FileDown, Scale, Bookmark, BedDouble, Bath,
  BadgeCheck, CheckCircle2, Minus,
} from 'lucide-react';
import { propertiesApi } from '@/lib/api';
import { ApiProperty } from '@/lib/api-types';
import { formatPrice } from '@/components/PropertyCard';

// ── Constants ──────────────────────────────────────────────────────────────────
const MAX_COMPARE = 3;

// ── Helpers ────────────────────────────────────────────────────────────────────
function typeLabel(t: ApiProperty['type']): string {
  return { residential: 'Residential Estate', commercial: 'Commercial Compound', plot: 'Land Parcel / Plot' }[t];
}
function statusLabel(s: ApiProperty['status']): string {
  return ({
    available: 'Available — Active Listing',
    reserved:  'Under Offer / Reserved',
    sold:      'Sold',
    rented:    'Rented',
    draft:     'Draft (Unlisted)',
  } as Record<string, string>)[s] ?? s;
}
function pricePerUnit(p: ApiProperty): string {
  if (!p.area_size || Number(p.area_size) <= 0) return '—';
  const ppu = Math.round(Number(p.price) / Number(p.area_size));
  return `PKR ${ppu.toLocaleString()} / ${p.area_unit}`;
}
function areaLabel(p: ApiProperty): string {
  if (!p.area_size) return '—';
  return `${Number(p.area_size).toLocaleString()} ${p.area_unit}`;
}
function allUniqueAmenities(props: ApiProperty[]): string[] {
  const set = new Set<string>();
  props.forEach(p => p.amenities?.forEach(a => set.add(a)));
  return Array.from(set).sort();
}
function valuesAreSame(props: ApiProperty[], fn: (p: ApiProperty) => string): boolean {
  if (props.length < 2) return true;
  const vals = props.map(fn);
  return vals.every(v => v === vals[0]);
}
function hasAmenity(p: ApiProperty, amenity: string): boolean {
  return p.amenities?.some(a => a.toLowerCase() === amenity.toLowerCase()) ?? false;
}

// ── PropertyHeaderCard ─────────────────────────────────────────────────────────
function PropertyHeaderCard({ property, onRemove }: { property: ApiProperty; onRemove: () => void }) {
  const images = property.images ?? [];
  return (
    <div className="flex flex-col relative group">
      <button
        onClick={onRemove}
        title="Remove from comparison"
        className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-primary-container/80 hover:bg-primary-container text-on-primary flex items-center justify-center backdrop-blur transition-all"
      >
        <X size={14} />
      </button>
      <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden bg-surface-container">
        {images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[0].url}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 size={28} className="text-on-surface-variant/30" />
          </div>
        )}
        <div className="absolute bottom-2 left-2">
          <span className="px-2 py-0.5 rounded bg-primary-container/90 text-on-primary text-xs font-semibold uppercase tracking-wider">
            {property.purpose === 'sale' ? 'For Sale' : 'For Rent'}
          </span>
        </div>
      </div>
      <div className="mt-4 flex flex-col flex-grow">
        <span className="text-xs font-semibold text-secondary uppercase tracking-wider">{property.city}</span>
        <h3 className="text-base font-semibold text-on-surface tracking-tight mt-1 leading-snug line-clamp-2">
          {property.title}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-bold text-on-surface">{formatPrice(property.price, property.purpose)}</span>
          {property.area_size && Number(property.area_size) > 0 && (
            <span className="text-xs text-outline">
              {`PKR ${Math.round(Number(property.price) / Number(property.area_size)).toLocaleString()} / ${property.area_unit}`}
            </span>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href="/contact"
            className="w-full py-2 px-3 rounded-lg bg-secondary text-on-secondary text-sm font-semibold text-center hover:opacity-90 transition-all"
          >
            Schedule Private Viewing
          </Link>
          <Link
            href={`/properties/${property.id}`}
            className="w-full py-2 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-semibold text-center transition-all"
          >
            View Full Dossier
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── AddPropertySlot ────────────────────────────────────────────────────────────
function AddPropertySlot({ label, onAdd }: { label: string; onAdd: (p: ApiProperty) => void }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await propertiesApi.list(q ? { city: q, per_page: 6 } : { per_page: 6 });
      setResults(res.data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => search(query), 350);
    return () => clearTimeout(t);
  }, [query, open, search]);

  useEffect(() => {
    if (open) search('');
  }, [open, search]);

  return (
    <div className="rounded-lg bg-surface-container-low hover:bg-surface-container transition-all flex flex-col items-center justify-center p-6 text-center min-h-[360px] group cursor-pointer relative">
      <div
        className="w-14 h-14 rounded-full bg-surface-container-lowest text-secondary shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
        onClick={() => setOpen(true)}
      >
        <Plus size={24} />
      </div>
      <h4 className="text-base font-semibold text-on-surface mt-4">{label}</h4>
      <p className="text-sm text-on-surface-variant max-w-[210px] mt-2">
        Select an estate from your saved collection, portfolio watchlist, or search MLS.
      </p>
      <div className="mt-6 flex flex-col gap-2 w-full max-w-[220px]">
        <button
          onClick={() => setOpen(true)}
          className="w-full py-2 px-4 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container text-sm font-medium shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <Bookmark size={15} className="text-secondary" /> Browse Saved
        </button>
        <button
          onClick={() => setOpen(true)}
          className="w-full py-2 px-4 rounded-lg bg-primary-container text-on-primary text-sm font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <Search size={15} /> Search Active MLS
        </button>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/10 z-40 p-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-low rounded-lg mb-3">
            <Search size={15} className="text-outline shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by city..."
              className="bg-transparent text-sm text-on-surface placeholder:text-outline/60 focus:outline-none w-full"
              onClick={e => e.stopPropagation()}
            />
            <button onClick={() => { setOpen(false); setQuery(''); }} className="text-outline hover:text-on-surface">
              <X size={14} />
            </button>
          </div>
          {loading ? (
            <p className="text-xs text-on-surface-variant text-center py-3">Searching…</p>
          ) : results.length === 0 ? (
            <p className="text-xs text-on-surface-variant text-center py-3">No results found</p>
          ) : (
            <div className="space-y-1 max-h-52 overflow-y-auto">
              {results.map(p => (
                <button
                  key={p.id}
                  onClick={() => { onAdd(p); setOpen(false); setQuery(''); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container-low text-left transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-container overflow-hidden shrink-0">
                    {p.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{p.title}</p>
                    <p className="text-xs text-on-surface-variant">{p.city} · {formatPrice(p.price, p.purpose)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Row helper ────────────────────────────────────────────────────────────────
function RowDiffBadge({ label = 'Diff' }: { label?: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold ml-1">
      {label}
    </span>
  );
}

// ── CompareContent ────────────────────────────────────────────────────────────
function CompareContent() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [highlight,  setHighlight]  = useState(false);

  useEffect(() => {
    const addId = searchParams.get('add');
    if (addId) {
      propertiesApi.get(addId).then(res => setProperties([res.data])).catch(() => {});
    }
  }, [searchParams]);

  function addProperty(p: ApiProperty) {
    if (properties.some(x => x.id === p.id)) return;
    if (properties.length >= MAX_COMPARE) return;
    setProperties(prev => [...prev, p]);
  }
  function removeProperty(id: string) {
    setProperties(prev => prev.filter(p => p.id !== id));
  }

  // Compute max area for progress bars
  const maxArea = Math.max(...properties.map(p => Number(p.area_size) || 0), 1);
  const maxBeds  = Math.max(...properties.map(p => p.bedrooms || 0), 1);

  // All unique amenities across compared properties
  const allAmenities = allUniqueAmenities(properties);

  // Render a 3-column value area (col-span-3 × 3) for a given cell renderer
  function renderValueCols(renderCell: (p: ApiProperty, idx: number) => React.ReactNode) {
    const cols: React.ReactNode[] = [];
    for (let i = 0; i < MAX_COMPARE; i++) {
      if (i < properties.length) {
        cols.push(
          <div key={i} className="col-span-3">
            {renderCell(properties[i], i)}
          </div>
        );
      } else if (i === properties.length && properties.length < MAX_COMPARE) {
        // add slot marker — shown only in header, blank dash in data rows
        cols.push(
          <div key={i} className="col-span-3 text-sm text-outline-variant italic">
            Awaiting selection
          </div>
        );
      } else {
        cols.push(<div key={i} className="col-span-3 text-sm text-outline-variant italic">—</div>);
      }
    }
    return cols;
  }

  function rowBg(idx: number, highlight?: boolean) {
    return highlight
      ? 'bg-secondary-fixed/10'
      : idx % 2 === 0
        ? 'hover:bg-surface-container-lowest'
        : 'bg-surface-container-lowest/50 hover:bg-surface-container-low';
  }

  return (
    <div className="bg-background min-h-screen">

      {/* ── Top Utility Strip ─────────────────────────────────────────── */}
      <div className="w-full bg-surface-container-lowest shadow-[0_1px_4px_rgba(13,28,50,0.04)]">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <nav className="flex items-center gap-1 text-sm text-on-surface-variant">
              <Link href="/" className="hover:text-on-surface transition-colors">Home</Link>
              <ChevronRight size={14} className="text-outline-variant" />
              <Link href="/properties" className="hover:text-on-surface transition-colors">Listings</Link>
              <ChevronRight size={14} className="text-outline-variant" />
              <span className="text-on-surface font-semibold">Property Comparison</span>
            </nav>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-surface-container text-on-surface text-xs font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              Fiduciary Portfolio Advisory • Multi-Asset
            </span>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none px-2 py-1 rounded-lg hover:bg-surface-container-low transition-colors">
              <span className="text-sm font-medium text-on-surface">Highlight Differences Only</span>
              <div
                onClick={() => setHighlight(h => !h)}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${highlight ? 'bg-secondary' : 'bg-surface-container-highest'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform duration-200 ${highlight ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </label>
            <div className="h-4 w-px bg-surface-variant" />
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container-low text-on-surface text-sm font-medium hover:bg-surface-container transition-colors"
            >
              <FileDown size={15} /> Export PDF Dossier
            </button>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container-low text-on-surface text-sm font-medium hover:bg-surface-container transition-colors">
              <Share2 size={15} /> Share
            </button>
          </div>
        </div>
      </div>

      {/* ── Title Section ─────────────────────────────────────────────── */}
      <section className="w-full bg-surface">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-8 pt-10 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-3xl">
              <span className="text-xs font-semibold uppercase tracking-widest text-secondary">Institutional Grade Comparison</span>
              <h1 className="text-2xl lg:text-3xl font-semibold text-on-surface tracking-tight mt-1">Compare Properties</h1>
              <p className="text-on-surface-variant mt-2 leading-relaxed">
                Evaluate premier architectural landmarks side by side across spatial dimensions,
                valuation frameworks, fiduciary overhead, and bespoke custom appointments.
              </p>
            </div>
            <div className="flex items-center gap-4 self-start md:self-auto">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-highest text-on-surface text-sm font-medium">
                <BadgeCheck size={15} className="text-secondary" />
                Comparing {properties.length} of {MAX_COMPARE} Properties
              </span>
              {properties.length > 0 && (
                <button
                  onClick={() => setProperties([])}
                  className="text-sm text-on-surface-variant hover:text-error transition-colors flex items-center gap-1"
                >
                  <X size={15} /> Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison Matrix ─────────────────────────────────────────── */}
      <section className="w-full pb-20">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-8">
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgba(13,28,50,0.06)] overflow-hidden">

            {/* Sticky Header Cards */}
            <div className="sticky top-20 z-30 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_2px_12px_rgba(13,28,50,0.04)]">
              <div className="grid grid-cols-12 gap-6 px-6 py-6">
                {/* Label spacer */}
                <div className="col-span-3 flex flex-col justify-end pb-2 pr-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-outline">Asset Matrix</span>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Review verified metrics certified by EstateLux Fiduciary Appraisal Services.
                  </p>
                </div>
                {/* Property cards + add slots */}
                {[0, 1, 2].map(i => (
                  <div key={i} className="col-span-3">
                    {i < properties.length ? (
                      <PropertyHeaderCard
                        property={properties[i]}
                        onRemove={() => removeProperty(properties[i].id)}
                      />
                    ) : i === properties.length ? (
                      <AddPropertySlot
                        label={`Add ${i === 0 ? '1st' : i === 1 ? '2nd' : '3rd'} Property`}
                        onAdd={addProperty}
                      />
                    ) : (
                      <div className="rounded-lg bg-surface-container-low min-h-[360px] flex items-center justify-center">
                        <p className="text-sm text-outline-variant italic">Empty slot</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Empty state */}
            {properties.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center px-6 border-t border-outline-variant/10">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-5">
                  <Building2 size={28} className="text-on-surface-variant" />
                </div>
                <h3 className="text-xl font-semibold text-on-surface mb-2">No Properties to Compare</h3>
                <p className="text-sm text-on-surface-variant max-w-sm mb-8">
                  Use the slots above to search and add up to 3 properties to compare side by side.
                </p>
                <Link
                  href="/properties"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-container text-on-primary text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Browse Properties <ArrowRight size={15} />
                </Link>
              </div>
            )}

            {/* Data rows — only shown when at least 1 property loaded */}
            {properties.length > 0 && (
              <div className="flex flex-col">

                {/* ── CATEGORY 01: Overview & Location ── */}
                <div className="px-6 pt-6 pb-3 bg-surface-container-low">
                  <span className="text-xs font-bold uppercase tracking-widest text-secondary">Category 01</span>
                  <h2 className="text-xl font-semibold text-on-surface">Overview &amp; Location</h2>
                </div>
                {[
                  {
                    label: 'Submarket / Enclave',
                    fn: (p: ApiProperty) => p.address ? `${p.city} — ${p.address}` : p.city,
                    tooltip: 'Designated geographic territory and municipality',
                  },
                  {
                    label: 'Asset Classification',
                    fn: (p: ApiProperty) => typeLabel(p.type),
                  },
                  {
                    label: 'Transaction Type',
                    fn: (p: ApiProperty) => p.purpose === 'sale' ? 'For Sale — Fee Simple' : 'For Rent — Leasehold',
                  },
                  {
                    label: 'Availability Status',
                    fn: (p: ApiProperty) => statusLabel(p.status),
                  },
                ].map(({ label, fn, tooltip }, ri) => {
                  const same = valuesAreSame(properties, fn);
                  const hidden = highlight && same;
                  return (
                    <div
                      key={label}
                      className={`grid grid-cols-12 gap-6 px-6 py-4 items-center transition-colors ${hidden ? 'hidden' : ''} ${rowBg(ri)}`}
                    >
                      <div className="col-span-3 flex items-center gap-1.5">
                        <span className="text-sm font-medium text-on-surface">{label}</span>
                        {tooltip && (
                          <span className="text-xs text-outline" title={tooltip}>ⓘ</span>
                        )}
                        {!same && <RowDiffBadge />}
                      </div>
                      {renderValueCols(p => (
                        <span className={`text-sm ${!same ? 'font-semibold text-on-surface' : 'text-on-surface'}`}>
                          {fn(p)}
                        </span>
                      ))}
                    </div>
                  );
                })}

                {/* ── CATEGORY 02: Space & Volume ── */}
                <div className="px-6 pt-6 pb-3 bg-surface-container-low">
                  <span className="text-xs font-bold uppercase tracking-widest text-secondary">Category 02</span>
                  <h2 className="text-xl font-semibold text-on-surface">Space &amp; Volume Metrics</h2>
                </div>
                {/* Bedrooms */}
                {(() => {
                  const fn = (p: ApiProperty) => p.bedrooms ? `${p.bedrooms} Bedrooms` : '—';
                  const same = valuesAreSame(properties, fn);
                  return (
                    <div className={`grid grid-cols-12 gap-6 px-6 py-4 items-center ${highlight && same ? 'hidden' : ''} hover:bg-surface-container-lowest`}>
                      <div className="col-span-3 flex items-center gap-1.5">
                        <BedDouble size={16} className="text-outline shrink-0" />
                        <span className="text-sm font-medium text-on-surface">Bedrooms / Suites</span>
                        {!same && <RowDiffBadge />}
                      </div>
                      {renderValueCols(p => (
                        <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                          {p.bedrooms ? `${p.bedrooms} En-Suite Bedrooms` : '—'}
                        </div>
                      ))}
                    </div>
                  );
                })()}
                {/* Bathrooms */}
                {(() => {
                  const fn = (p: ApiProperty) => p.bathrooms ? `${p.bathrooms}` : '—';
                  const same = valuesAreSame(properties, fn);
                  return (
                    <div className={`grid grid-cols-12 gap-6 px-6 py-4 items-center ${highlight && same ? 'hidden' : ''} bg-surface-container-lowest/50 hover:bg-surface-container-low`}>
                      <div className="col-span-3 flex items-center gap-1.5">
                        <Bath size={16} className="text-outline shrink-0" />
                        <span className="text-sm font-medium text-on-surface">Bathrooms</span>
                        {!same && <RowDiffBadge />}
                      </div>
                      {renderValueCols(p => (
                        <span className="text-sm text-on-surface">
                          {p.bathrooms ? `${p.bathrooms} Bathrooms` : '—'}
                        </span>
                      ))}
                    </div>
                  );
                })()}
                {/* Interior Area with progress bars */}
                {(() => {
                  const fn = (p: ApiProperty) => areaLabel(p);
                  const same = valuesAreSame(properties, fn);
                  return (
                    <div className={`grid grid-cols-12 gap-6 px-6 py-4 items-start ${highlight && same ? 'hidden' : ''} hover:bg-surface-container-lowest`}>
                      <div className="col-span-3 flex items-center gap-1.5 pt-1">
                        <span className="text-sm font-medium text-on-surface">Interior Living Area</span>
                        {!same && <RowDiffBadge />}
                      </div>
                      {renderValueCols(p => {
                        if (!p.area_size) return <span className="text-sm text-on-surface">—</span>;
                        const pct = Math.round((Number(p.area_size) / maxArea) * 100);
                        return (
                          <div>
                            <span className="text-xl font-semibold text-on-surface">{Number(p.area_size).toLocaleString()}</span>
                            <span className="text-xs text-on-surface-variant ml-1">{p.area_unit}</span>
                            <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
                              <div
                                className="bg-primary-container h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                {/* Parking */}
                {(() => {
                  const fn = (p: ApiProperty) => p.parking_spaces > 0 ? `${p.parking_spaces} spaces` : '—';
                  const same = valuesAreSame(properties, fn);
                  return (
                    <div className={`grid grid-cols-12 gap-6 px-6 py-4 items-center ${highlight && same ? 'hidden' : ''} bg-surface-container-lowest/50 hover:bg-surface-container-low`}>
                      <div className="col-span-3 flex items-center gap-1.5">
                        <span className="text-sm font-medium text-on-surface">Auto Gallery &amp; Parking</span>
                        {!same && <RowDiffBadge />}
                      </div>
                      {renderValueCols(p => (
                        <span className="text-sm text-on-surface font-semibold">
                          {p.parking_spaces > 0 ? `${p.parking_spaces}-Car Parking` : '—'}
                        </span>
                      ))}
                    </div>
                  );
                })()}

                {/* ── CATEGORY 03: Valuation ── */}
                <div className="px-6 pt-6 pb-3 bg-surface-container-low">
                  <span className="text-xs font-bold uppercase tracking-widest text-secondary">Category 03</span>
                  <h2 className="text-xl font-semibold text-on-surface">Valuation &amp; Carrying Costs</h2>
                </div>
                {/* Price */}
                {(() => {
                  const fn = (p: ApiProperty) => formatPrice(p.price, p.purpose);
                  const same = valuesAreSame(properties, fn);
                  return (
                    <div className={`grid grid-cols-12 gap-6 px-6 py-4 items-start ${highlight && same ? 'hidden' : ''} hover:bg-surface-container-lowest`}>
                      <div className="col-span-3 flex items-center gap-1.5 pt-1">
                        <span className="text-sm font-medium text-on-surface">Offered Valuation</span>
                      </div>
                      {renderValueCols(p => (
                        <div>
                          <div className="text-lg font-bold text-on-surface">{formatPrice(p.price, p.purpose)}</div>
                          <p className="text-xs text-outline mt-0.5">Unencumbered Fee Simple</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                {/* Price per unit */}
                {(() => {
                  const fn = pricePerUnit;
                  const same = valuesAreSame(properties, fn);
                  return (
                    <div className={`grid grid-cols-12 gap-6 px-6 py-4 items-center ${highlight && same ? 'hidden' : ''} bg-surface-container-lowest/50 hover:bg-surface-container-low`}>
                      <div className="col-span-3 flex items-center gap-1.5">
                        <span className="text-sm font-medium text-on-surface">Price per Internal Unit</span>
                        {!same && <RowDiffBadge />}
                      </div>
                      {renderValueCols(p => (
                        <span className="text-sm font-semibold text-on-surface">{pricePerUnit(p)}</span>
                      ))}
                    </div>
                  );
                })()}
                {/* Taxes – static advisory */}
                <div className={`grid grid-cols-12 gap-6 px-6 py-4 items-center ${highlight ? 'hidden' : ''} hover:bg-surface-container-lowest`}>
                  <div className="col-span-3">
                    <span className="text-sm font-medium text-on-surface">Est. Annual Property Taxes</span>
                  </div>
                  {[0, 1, 2].map(i => (
                    <div key={i} className="col-span-3 text-sm text-on-surface-variant italic">
                      {i < properties.length ? 'Contact Advisory Desk' : '—'}
                    </div>
                  ))}
                </div>
                {/* HOA */}
                <div className={`grid grid-cols-12 gap-6 px-6 py-4 items-center ${highlight ? 'hidden' : ''} bg-surface-container-lowest/50 hover:bg-surface-container-low`}>
                  <div className="col-span-3">
                    <span className="text-sm font-medium text-on-surface">Enclave Security &amp; HOA Dues</span>
                  </div>
                  {[0, 1, 2].map(i => (
                    <div key={i} className="col-span-3 text-sm text-on-surface-variant italic">
                      {i < properties.length ? 'Contact Advisory Desk' : '—'}
                    </div>
                  ))}
                </div>

                {/* ── CATEGORY 04: Amenities ── */}
                <div className="px-6 pt-6 pb-3 bg-surface-container-low">
                  <span className="text-xs font-bold uppercase tracking-widest text-secondary">Category 04</span>
                  <h2 className="text-xl font-semibold text-on-surface">Luxury Amenities &amp; Bespoke Features</h2>
                </div>
                {allAmenities.length === 0 && (
                  <div className="px-6 py-4 text-sm text-on-surface-variant italic">
                    No amenities listed for the selected properties.
                  </div>
                )}
                {allAmenities.map((amenity, ri) => {
                  const hasPerProp = properties.map(p => hasAmenity(p, amenity));
                  const allHave   = hasPerProp.every(Boolean);
                  const noneHave  = hasPerProp.every(v => !v);
                  const isKeyDiff = !allHave && !noneHave;
                  const hidden    = highlight && allHave;
                  return (
                    <div
                      key={amenity}
                      className={`grid grid-cols-12 gap-6 px-6 py-4 items-center ${hidden ? 'hidden' : ''} ${isKeyDiff ? 'bg-secondary-fixed/10' : ri % 2 === 0 ? 'hover:bg-surface-container-lowest' : 'bg-surface-container-lowest/50 hover:bg-surface-container-low'}`}
                    >
                      <div className="col-span-3 flex items-center gap-1.5">
                        <span className="text-sm font-medium text-on-surface">{amenity}</span>
                        {isKeyDiff && <RowDiffBadge label="Key Diff" />}
                      </div>
                      {[0, 1, 2].map(i => {
                        if (i < properties.length) {
                          const has = hasPerProp[i];
                          return (
                            <div key={i} className="col-span-3 flex items-center gap-2 text-sm">
                              {has ? (
                                <>
                                  <CheckCircle2 size={16} className="text-secondary shrink-0" />
                                  <span className="text-on-surface font-medium">{amenity}</span>
                                </>
                              ) : (
                                <>
                                  <Minus size={16} className="text-outline-variant shrink-0" />
                                  <span className="text-on-surface-variant">Not included</span>
                                </>
                              )}
                            </div>
                          );
                        }
                        return <div key={i} className="col-span-3 text-sm text-outline-variant italic">—</div>;
                      })}
                    </div>
                  );
                })}

                {/* ── CATEGORY 05: Advisory Representation ── */}
                <div className="px-6 pt-6 pb-3 bg-surface-container-low">
                  <span className="text-xs font-bold uppercase tracking-widest text-secondary">Category 05</span>
                  <h2 className="text-xl font-semibold text-on-surface">Fiduciary Advisory &amp; Exclusive Representation</h2>
                </div>
                <div className="grid grid-cols-12 gap-6 px-6 py-6 items-center hover:bg-surface-container-lowest">
                  <div className="col-span-3">
                    <span className="text-sm font-medium text-on-surface">Principal Listing Advisor</span>
                  </div>
                  {[0, 1, 2].map(i => {
                    if (i >= properties.length) {
                      return (
                        <div key={i} className="col-span-3 text-sm text-outline-variant italic">—</div>
                      );
                    }
                    const p = properties[i];
                    const agent = p.agent;
                    if (!agent?.user) {
                      return (
                        <div key={i} className="col-span-3 text-sm text-on-surface-variant italic">
                          No assigned advisor
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="col-span-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-lowest shadow-[0_2px_8px_rgba(13,28,50,0.04)]">
                          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0 overflow-hidden">
                            <Building2 size={20} className="text-on-surface-variant/40" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-base font-semibold text-on-surface truncate">
                              {agent.user.full_name}
                            </span>
                            <span className="text-xs text-secondary">Listing Advisor</span>
                            <Link
                              href={`/agents/${agent.id}`}
                              className="text-xs text-on-surface-variant hover:text-on-surface underline mt-0.5 inline-flex items-center gap-1"
                            >
                              Direct Inquiry <ArrowRight size={11} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Advisory CTA Banner ───────────────────────────────────────── */}
      <section className="w-full bg-surface-container py-10">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-8">
          <div className="rounded-xl bg-primary-container text-on-primary p-8 lg:p-10 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-secondary-container/10 blur-3xl pointer-events-none" />
            <div className="flex flex-col max-w-2xl relative z-10">
              <div className="flex items-center gap-2 mb-2 text-secondary-fixed">
                <Scale size={18} />
                <span className="text-xs font-semibold uppercase tracking-widest">Private Advisory Practice</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight text-on-primary">
                Unsure which estate aligns best with your portfolio mandate?
              </h2>
              <p className="text-on-primary-container mt-2 leading-relaxed">
                Our Advisory Desk provides tailored comparative yield models, zoning impact forecasts,
                and discreet representation for family offices and institutional principals.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full lg:w-auto shrink-0">
              <Link
                href="/contact"
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-secondary text-on-secondary text-sm font-semibold hover:opacity-90 transition-all text-center"
              >
                Request Comparative Market Analysis
              </Link>
              <Link
                href="/contact"
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 text-on-primary text-sm font-semibold transition-all text-center"
              >
                Contact Private Advisor
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────
export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-surface-container border-t-secondary rounded-full animate-spin" />
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
