'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search, Grid2X2, List, X,
  ChevronLeft, ChevronRight, MapPin, SlidersHorizontal,
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
    <aside className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-6 sticky top-[90px] max-h-[calc(100vh-110px)] overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-surface-container">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-on-surface">Filters</span>
          {activeCount > 0 && (
            <span className="bg-secondary-fixed text-on-secondary-fixed text-xs px-2 py-0.5 rounded-full font-bold">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="text-sm text-secondary hover:underline"
          >
            Reset All
          </button>
        )}
      </div>

      {/* Location */}
      <div className="space-y-2">
        <span className="text-sm font-semibold text-on-surface block">Location</span>
        <div className="relative">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
          <input
            type="text"
            placeholder="City, neighborhood..."
            value={cityInput}
            onChange={e => onCityChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm text-on-surface placeholder:text-outline/50 focus:outline-none focus:border-secondary/40 transition-colors"
          />
        </div>
      </div>

      {/* Transaction type */}
      <div className="space-y-2">
        <span className="text-sm font-semibold text-on-surface block">Transaction</span>
        <div className="grid grid-cols-2 gap-1 bg-surface-container-low p-1 rounded-lg">
          {[
            { value: '' as const,     label: 'All' },
            { value: 'sale' as const, label: 'Buy' },
            { value: 'rent' as const, label: 'Rent' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => onPurposeChange(opt.value)}
              className={`py-1.5 rounded text-xs font-semibold transition-all col-span-${opt.value === '' ? '2' : '1'} ${
                filters.purpose === opt.value
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Property type */}
      <div className="space-y-2">
        <span className="text-sm font-semibold text-on-surface block">Property Typology</span>
        <div className="space-y-2">
          {TYPE_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={opt.value === '' ? filters.type === '' : filters.type === opt.value}
                  onChange={() => onTypeChange(opt.value)}
                  className="w-4 h-4 rounded text-secondary focus:ring-0 focus:ring-offset-0 bg-surface-container"
                />
                <span className="text-sm text-on-surface group-hover:text-secondary transition-colors">
                  {opt.label}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Bedrooms */}
      <div className="space-y-2">
        <span className="text-sm font-semibold text-on-surface block">Bedrooms</span>
        <div className="grid grid-cols-5 gap-1 bg-surface-container-low p-1 rounded-lg">
          {BEDS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onBedsChange(opt.value)}
              className={`py-1 rounded text-xs font-semibold transition-all ${
                filters.minBeds === opt.value
                  ? 'bg-primary-container text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Apply */}
      <div className="pt-4 border-t border-surface-container">
        <div className="text-xs text-on-surface-variant text-center">
          {total > 0 ? `${total} properties match` : 'Adjust filters above'}
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
              <div className="flex items-center gap-2 px-3 py-2 flex-1 min-w-[180px] bg-surface-container-lowest rounded-lg">
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
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => { if (page > 1) loadProperties(page - 1); }}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant hover:text-on-surface disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(7, lastPage) }, (_, i) => {
                  const pg = lastPage <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= lastPage - 3 ? lastPage - 6 + i : page - 3 + i;
                  return (
                    <button
                      key={pg}
                      onClick={() => loadProperties(pg)}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                        pg === page
                          ? 'bg-primary-container text-on-primary shadow-sm'
                          : 'bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}
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
