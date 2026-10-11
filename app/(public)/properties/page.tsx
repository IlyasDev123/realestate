'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search, Grid2X2, List, X,
  ChevronLeft, ChevronRight, MapPin, SlidersHorizontal,
  Home, Building2, LandPlot, Check, BedDouble,
  RotateCcw, TrendingUp, Key, Tag, Building,
} from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import { propertiesApi, ApiError } from '@/lib/api';
import { ApiProperty } from '@/lib/api-types';

type ViewMode = 'grid' | 'list';
type SortKey  = 'newest' | 'price_asc' | 'price_desc' | 'popular';

interface Filters {
  city:    string;
  type:    '' | 'residential' | 'commercial' | 'plot';
  purpose: '' | 'sale' | 'rent';
  minBeds: number;
}

const TYPE_OPTIONS = [
  { value: '' as const,            label: 'All Types',   count: '' },
  { value: 'residential' as const, label: 'Residential', count: '' },
  { value: 'commercial' as const,  label: 'Commercial',  count: '' },
  { value: 'plot' as const,        label: 'Plot / Land', count: '' },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest',     label: 'Newest First'       },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular',    label: 'Most Viewed'        },
];

const BEDS_OPTIONS = [
  { value: 0, label: 'Any' },
  { value: 2, label: '2+' },
  { value: 3, label: '3+' },
  { value: 4, label: '4+' },
  { value: 5, label: '5+' },
];

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
      <div className="aspect-[16/11] skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-5 skeleton rounded-lg w-2/3" />
        <div className="h-4 skeleton rounded-lg w-1/2" />
        <div className="h-4 skeleton rounded-lg w-3/4" />
      </div>
    </div>
  );
}

const PROPERTY_TYPE_OPTIONS = [
  { value: '' as const,            label: 'All Types',    desc: 'Every category',    Icon: Building2 },
  { value: 'residential' as const, label: 'Residential',  desc: 'Houses & flats',    Icon: Home      },
  { value: 'commercial' as const,  label: 'Commercial',   desc: 'Offices & shops',   Icon: Building  },
  { value: 'plot' as const,        label: 'Plot / Land',  desc: 'Land & parcels',    Icon: LandPlot  },
];

const PURPOSE_OPTIONS = [
  { value: '' as const,     label: 'All',  Icon: Building2  },
  { value: 'sale' as const, label: 'Buy',  Icon: TrendingUp },
  { value: 'rent' as const, label: 'Rent', Icon: Key        },
];

function FilterSidebar({
  filters,
  onTypeChange,
  onPurposeChange,
  onBedsChange,
  onCityChange,
  onReset,
  total,
  cityInput,
}: {
  filters: Filters;
  onTypeChange: (v: Filters['type']) => void;
  onPurposeChange: (v: Filters['purpose']) => void;
  onBedsChange: (v: number) => void;
  onCityChange: (v: string) => void;
  onReset: () => void;
  total: number;
  cityInput: string;
}) {
  const activeCount = [
    filters.city,
    filters.type,
    filters.purpose,
    filters.minBeds > 0 ? 'beds' : '',
  ].filter(Boolean).length;

  return (
    <aside className="w-full bg-surface-container-lowest rounded-2xl shadow-md overflow-hidden sticky top-[90px] max-h-[calc(100vh-110px)] overflow-y-auto">

      {/* ── Branded header ── */}
      <div className="relative bg-primary-container px-5 py-4 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface/15 backdrop-blur flex items-center justify-center shrink-0">
              <SlidersHorizontal size={16} className="text-on-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-on-primary/60 font-bold leading-none">Refine</p>
              <h3 className="text-sm font-bold text-on-primary leading-tight mt-0.5">Property Filters</h3>
            </div>
          </div>
          {activeCount > 0 ? (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs font-semibold text-on-primary/80 hover:text-on-primary bg-surface/10 hover:bg-surface/20 px-2.5 py-1.5 rounded-lg transition-all"
            >
              <RotateCcw size={11} />
              Reset
            </button>
          ) : (
            <span className="text-[10px] text-on-primary/40 font-medium">No filters set</span>
          )}
        </div>

        {/* Active filter indicators */}
        {activeCount > 0 && (
          <div className="relative flex items-center gap-2 mt-3 pt-3 border-t border-surface/10">
            <div className="flex gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i < activeCount ? 'w-5 bg-secondary-fixed' : 'w-2 bg-surface/20'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-on-primary/60 font-medium">
              {activeCount} of 4 filters active
            </span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-6">

        {/* ── Location ── */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-widest">
            <MapPin size={10} />
            Location
          </label>
          <div className="relative group">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-secondary pointer-events-none transition-colors" />
            <input
              type="text"
              placeholder="City or neighborhood…"
              value={cityInput}
              onChange={e => onCityChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-surface-container-low border border-outline-variant/25 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/10 transition-all"
            />
            {cityInput && (
              <button
                onClick={() => onCityChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-outline-variant/30 hover:bg-error/20 hover:text-error flex items-center justify-center text-on-surface-variant transition-all"
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* ── Transaction type ── */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-widest">
            <Tag size={10} />
            Transaction
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {PURPOSE_OPTIONS.map(opt => {
              const active = filters.purpose === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onPurposeChange(opt.value)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 ${
                    active
                      ? 'bg-secondary text-on-secondary shadow-md shadow-secondary/20 ring-2 ring-secondary/30'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <opt.Icon size={15} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Property type ── */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-widest">
            <Building2 size={10} />
            Property Type
          </label>
          <div className="space-y-1.5">
            {PROPERTY_TYPE_OPTIONS.map(opt => {
              const active = filters.type === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onTypeChange(opt.value)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left active:scale-[0.98] ${
                    active
                      ? 'bg-primary-container ring-1 ring-primary-container/50 shadow-sm'
                      : 'bg-surface-container hover:bg-surface-container-high'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    active ? 'bg-surface/20' : 'bg-surface-container-lowest'
                  }`}>
                    <opt.Icon size={15} className={active ? 'text-on-primary' : 'text-on-surface-variant'} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className={`text-xs font-semibold leading-none ${active ? 'text-on-primary' : 'text-on-surface'}`}>
                      {opt.label}
                    </p>
                    <p className={`text-[10px] mt-0.5 leading-none ${active ? 'text-on-primary/65' : 'text-on-surface-variant'}`}>
                      {opt.desc}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    active
                      ? 'border-on-primary bg-on-primary'
                      : 'border-outline-variant/40'
                  }`}>
                    {active && <Check size={11} className="text-primary-container" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Bedrooms ── */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-widest">
            <BedDouble size={10} />
            Bedrooms (min)
          </label>
          <div className="flex gap-1.5">
            {BEDS_OPTIONS.map(opt => {
              const active = filters.minBeds === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onBedsChange(opt.value)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                    active
                      ? 'bg-secondary text-on-secondary shadow-md shadow-secondary/20 ring-2 ring-secondary/30'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Results footer ── */}
        <div className="pt-1">
          <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${
            total > 0 ? 'bg-emerald-50 border border-emerald-200/60' : 'bg-surface-container border border-outline-variant/20'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${total > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-outline-variant'}`} />
              <span className={`text-xs font-semibold ${total > 0 ? 'text-emerald-700' : 'text-on-surface-variant'}`}>
                {total > 0 ? `${total.toLocaleString()} matches` : 'No results'}
              </span>
            </div>
            {total > 0 && (
              <span className="text-[10px] text-emerald-600 font-medium">
                {total === 1 ? '1 property' : `${total} properties`}
              </span>
            )}
          </div>
        </div>

      </div>
    </aside>
  );
}

function PropertiesContent() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>({
    city:    searchParams.get('location') ?? '',
    type:    (searchParams.get('type')    as Filters['type'])    ?? '',
    purpose: (searchParams.get('purpose') as Filters['purpose']) ?? '',
    minBeds: 0,
  });
  const [cityInput, setCityInput]   = useState(searchParams.get('location') ?? '');
  const [sort,     setSort]         = useState<SortKey>('newest');
  const [view,     setView]         = useState<ViewMode>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [lastPage,   setLastPage]   = useState(1);
  const [total,      setTotal]      = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleCityInput(val: string) {
    setCityInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters(f => ({ ...f, city: val }));
    }, 450);
  }

  const loadProperties = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { page: p, per_page: 12 };
      if (filters.city.trim()) params.city         = filters.city.trim();
      if (filters.type)        params.type         = filters.type;
      if (filters.purpose)     params.purpose      = filters.purpose;
      if (filters.minBeds > 0) params.min_bedrooms = filters.minBeds;
      if (sort !== 'newest')   params.sort         = sort;

      const res = await propertiesApi.list(params);
      setProperties(res.data);
      setPage(res.meta.current_page);
      setLastPage(res.meta.last_page);
      setTotal(res.meta.total);
    } catch (err) {
      if (!(err instanceof ApiError)) console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, sort]);

  useEffect(() => { loadProperties(1); }, [loadProperties]);

  useEffect(() => {
    const loc     = searchParams.get('location') ?? '';
    const type    = (searchParams.get('type')    as Filters['type'])    ?? '';
    const purpose = (searchParams.get('purpose') as Filters['purpose']) ?? '';
    setCityInput(loc);
    setFilters(f => ({ ...f, city: loc, type, purpose }));
  }, [searchParams]);

  function setFilter<K extends keyof Filters>(key: K, val: Filters[K]) {
    setFilters(f => ({ ...f, [key]: val }));
  }

  function resetFilters() {
    setCityInput('');
    setFilters({ city: '', type: '', purpose: '', minBeds: 0 });
  }

  const activeCount = [
    filters.city,
    filters.type,
    filters.purpose,
    filters.minBeds > 0 ? 'beds' : '',
  ].filter(Boolean).length;

  // Build active filter tag pills
  const activeTags: { label: string; key: keyof Filters | 'all' }[] = [];
  if (filters.purpose) activeTags.push({ label: filters.purpose === 'sale' ? 'For Sale' : 'For Rent', key: 'purpose' });
  if (filters.type)    activeTags.push({ label: TYPE_OPTIONS.find(o => o.value === filters.type)!.label, key: 'type' });
  if (filters.city)    activeTags.push({ label: filters.city, key: 'city' });
  if (filters.minBeds > 0) activeTags.push({ label: `${filters.minBeds}+ Beds`, key: 'minBeds' });

  return (
    <div className="bg-background min-h-screen">

      {/* ── Sticky search strip ── */}
      <div className="w-full bg-surface-container-lowest shadow-sm sticky top-20 z-30">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            {/* Search row */}
            <div className="flex flex-1 flex-wrap sm:flex-nowrap items-center bg-surface-container-low rounded-xl p-1 gap-1">
              <div className="flex items-center gap-2 px-3 py-2 flex-1 min-w-0 bg-surface-container-lowest rounded-lg">
                <Search size={16} className="text-outline shrink-0" />
                <input
                  type="text"
                  placeholder="City, neighborhood..."
                  value={cityInput}
                  onChange={e => handleCityInput(e.target.value)}
                  className="bg-transparent text-sm text-on-surface placeholder:text-outline/60 focus:outline-none w-full"
                />
              </div>
              <div className="flex items-center bg-surface-container rounded-lg p-1">
                {[{ v: '' as const, l: 'All' }, { v: 'sale' as const, l: 'Buy' }, { v: 'rent' as const, l: 'Rent' }].map(o => (
                  <button
                    key={o.v}
                    onClick={() => setFilter('purpose', o.v)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      filters.purpose === o.v
                        ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
              <select
                value={filters.type}
                onChange={e => setFilter('type', e.target.value as Filters['type'])}
                className="bg-surface-container-lowest text-sm text-on-surface px-3 py-2 rounded-lg border-0 focus:outline-none cursor-pointer"
              >
                {TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className={`lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeCount > 0
                    ? 'bg-secondary-fixed text-on-secondary-fixed'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <SlidersHorizontal size={15} />
                Filters{activeCount > 0 ? ` (${activeCount})` : ''}
              </button>
              <div className="flex items-center bg-surface-container-low p-1 rounded-lg gap-0.5">
                <button
                  onClick={() => setView('grid')}
                  className={`p-1.5 rounded transition-colors ${view === 'grid' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-outline hover:text-on-surface'}`}
                >
                  <Grid2X2 size={16} />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`p-1.5 rounded transition-colors ${view === 'list' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-outline hover:text-on-surface'}`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main layout: Sidebar + Grid ── */}
      <div className="max-w-[1360px] mx-auto px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Sidebar — desktop only */}
          <div className="hidden lg:block lg:col-span-3">
            <FilterSidebar
              filters={filters}
              cityInput={cityInput}
              onTypeChange={v => setFilter('type', v)}
              onPurposeChange={v => setFilter('purpose', v)}
              onBedsChange={v => setFilter('minBeds', v)}
              onCityChange={handleCityInput}
              onReset={resetFilters}
              total={total}
            />
          </div>

          {/* Main listings */}
          <div className="lg:col-span-9 flex flex-col gap-5">

            {/* Results bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-xl shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-on-surface tracking-tight">
                    {loading ? 'Loading…' : `${total} Properties`}
                  </h1>
                  {filters.city && (
                    <span className="text-sm text-outline">in {filters.city}</span>
                  )}
                </div>
                {/* Active filter tags */}
                {activeTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {activeTags.map(tag => (
                      <span
                        key={tag.key}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container text-on-surface text-xs font-medium"
                      >
                        {tag.label}
                        <button
                          onClick={() => {
                            if (tag.key === 'city') { setCityInput(''); setFilter('city', ''); }
                            else if (tag.key === 'type') setFilter('type', '');
                            else if (tag.key === 'purpose') setFilter('purpose', '');
                            else if (tag.key === 'minBeds') setFilter('minBeds', 0);
                          }}
                          className="hover:text-secondary transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <button onClick={resetFilters} className="text-xs text-secondary hover:underline">Clear all</button>
                  </div>
                )}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                <div className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-lg">
                  <span className="text-xs text-outline">Sort:</span>
                  <select
                    value={sort}
                    onChange={e => setSort(e.target.value as SortKey)}
                    className="bg-transparent text-xs font-semibold text-on-surface border-0 focus:outline-none cursor-pointer"
                  >
                    {SORT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className={`grid gap-5 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-on-surface-variant" />
                </div>
                <h3 className="text-lg font-semibold text-on-surface mb-2">No properties found</h3>
                <p className="text-sm text-on-surface-variant mb-6">Try adjusting your filters or search terms.</p>
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 bg-primary-container text-on-primary text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className={`grid gap-5 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {properties.map(p => (
                  <PropertyCard key={p.id} property={p} variant={view === 'list' ? 'list' : 'grid'} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && lastPage > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-4">
                <button
                  onClick={() => { if (page > 1) loadProperties(page - 1); }}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant hover:text-on-surface disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-on-surface-variant px-2">
                  <span className="font-semibold text-on-surface">{page}</span> / {lastPage}
                </span>
                <button
                  onClick={() => { if (page < lastPage) loadProperties(page + 1); }}
                  disabled={page === lastPage}
                  className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant hover:text-on-surface disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter sheet ── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
          <div className="relative ml-auto w-80 max-w-full bg-surface-container-lowest h-full overflow-y-auto">
            <div className="sticky top-0 bg-surface-container-lowest border-b border-outline-variant/10 px-5 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-on-surface">Filters</h3>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <FilterSidebar
                filters={filters}
                cityInput={cityInput}
                onTypeChange={v => setFilter('type', v)}
                onPurposeChange={v => setFilter('purpose', v)}
                onBedsChange={v => setFilter('minBeds', v)}
                onCityChange={handleCityInput}
                onReset={resetFilters}
                total={total}
              />
            </div>
            <div className="sticky bottom-0 p-4 bg-surface-container-lowest border-t border-outline-variant/10">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3 bg-primary-container text-on-primary text-sm font-semibold rounded-xl hover:opacity-95 transition-opacity"
              >
                Show {total} Properties
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={
      <div className="bg-background min-h-screen pt-8">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="hidden lg:block lg:col-span-3">
            <div className="bg-surface-container-lowest rounded-xl h-96 skeleton" />
          </div>
          <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-xl overflow-hidden">
                <div className="aspect-[16/11] skeleton" />
                <div className="p-4 space-y-3">
                  <div className="h-5 skeleton rounded-lg w-2/3" />
                  <div className="h-4 skeleton rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <PropertiesContent />
    </Suspense>
  );
}
