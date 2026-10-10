'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Pencil, Trash2, ChevronLeft, ChevronRight, Home, Star, LayoutGrid, List, X, MapPin, Bed, Bath, Eye } from 'lucide-react';
import { propertiesApi, ApiError } from '@/lib/api';
import { ApiProperty } from '@/lib/api-types';
import { formatPrice } from '@/components/PropertyCard';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';

// ── Consistent badge system ────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { bg: string; text: string; dot: string }> = {
  available: { bg: 'bg-emerald-500/90', text: 'text-white',        dot: 'bg-white/70' },
  draft:     { bg: 'bg-slate-500/85',   text: 'text-white',        dot: 'bg-white/50' },
  reserved:  { bg: 'bg-amber-500/90',   text: 'text-white',        dot: 'bg-white/70' },
  sold:      { bg: 'bg-rose-600/90',    text: 'text-white',        dot: 'bg-white/70' },
  rented:    { bg: 'bg-violet-600/90',  text: 'text-white',        dot: 'bg-white/70' },
};

const TYPE_CFG: Record<string, { bg: string; text: string }> = {
  residential: { bg: 'bg-surface-container-high', text: 'text-on-surface-variant' },
  commercial:  { bg: 'bg-secondary/10',           text: 'text-secondary' },
  plot:        { bg: 'bg-surface-container',       text: 'text-on-surface-variant' },
};

const PURPOSE_CFG: Record<string, { bg: string; text: string }> = {
  sale: { bg: 'bg-secondary/10',         text: 'text-secondary' },
  rent: { bg: 'bg-secondary/8', text: 'text-on-surface-variant' },
};

export default function AgentPropertiesPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const loadProperties = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { page: p, per_page: perPage };
      if (statusFilter) params.status = statusFilter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (user?.agent?.id) params.agent_id = user.agent.id;
      const res = await propertiesApi.list(params);
      setProperties(res.data);
      setPage(res.meta.current_page);
      setLastPage(res.meta.last_page);
      setTotal(res.meta.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, user?.agent?.id, perPage]);

  useEffect(() => { loadProperties(1); }, [loadProperties]);

  const hasFilters = search !== '' || statusFilter !== '';
  function clearFilters() {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('');
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await propertiesApi.delete(id);
      setProperties((prev) => prev.filter((p) => p.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      toast('Property deleted successfully');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Error deleting property', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  function renderPageButtons() {
    if (lastPage <= 1) return null;
    const pages: (number | '...')[] = [];
    if (lastPage <= 7) {
      for (let i = 1; i <= lastPage; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(lastPage - 1, page + 1); i++) pages.push(i);
      if (page < lastPage - 2) pages.push('...');
      pages.push(lastPage);
    }
    return pages;
  }

  const pageButtons = renderPageButtons();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span className="font-semibold uppercase tracking-wider">RMS Enterprise</span>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider">My Properties</span>
        <div className="flex items-center gap-1.5 ml-3 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
          <span className="text-xs font-medium">MLS Syndication Active</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-on-surface font-display">My Property Listings</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage your active mandates and property portfolio.</p>
        </div>
        <Link
          href="/agent/properties/new"
          className="flex items-center gap-2 bg-secondary text-on-secondary font-semibold px-4 py-2.5 rounded-lg text-sm shadow-md hover:opacity-95 transition-all shrink-0"
        >
          <PlusCircle size={15} /> + Upload Property
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title or city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:bg-surface-container-lowest transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); }}
          className="pl-3 pr-8 py-2 bg-surface-container-low rounded-lg text-sm text-on-surface focus:outline-none appearance-none cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface bg-surface-container-low hover:bg-surface-container rounded-lg transition-colors shrink-0"
          >
            <X size={13} />
            Clear
          </button>
        )}
        {/* View toggle */}
        <div className="flex items-center bg-surface-container-low p-1 rounded-lg gap-0.5 shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] rounded-2xl flex items-center justify-center h-48">
          <div className="w-7 h-7 border-2 border-outline-variant border-t-secondary rounded-full animate-spin" />
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] rounded-2xl flex flex-col items-center justify-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
            <Home size={24} className="text-secondary" />
          </div>
          <p className="text-sm font-semibold text-on-surface">No properties yet</p>
          <Link
            href="/agent/properties/new"
            className="mt-3 flex items-center gap-1.5 text-secondary hover:text-on-surface text-sm font-medium transition-colors"
          >
            <PlusCircle size={14} /> Upload your first property
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((p) => {
            const sc = STATUS_CFG[p.status]  ?? STATUS_CFG.draft;
            const tc = TYPE_CFG[p.type]      ?? { bg: 'bg-surface-container', text: 'text-on-surface-variant' };
            const pc = PURPOSE_CFG[p.purpose] ?? PURPOSE_CFG.sale;
            return (
              <div key={p.id} className="group rounded-2xl bg-surface-container-lowest border border-outline-variant/10 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 shadow-[0_2px_12px_rgba(13,28,50,0.06)]">

                  <div className="relative h-52 bg-surface-container overflow-hidden">
                    {p.images?.[0]
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-surface-container to-surface-container-high">
                          <Home size={36} className="text-on-surface-variant/20" />
                          <span className="text-xs text-on-surface-variant/40 font-medium">No photo</span>
                        </div>}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                    {p.is_featured && (
                      <div className="absolute top-3 left-3">
                        <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-secondary text-on-secondary shadow-md">
                          <Star size={10} className="fill-on-secondary" /> Featured
                        </span>
                      </div>
                    )}

                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm capitalize ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {p.status}
                      </span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 px-4 pb-3.5">
                      <p className="text-white text-xl font-bold leading-none drop-shadow-lg">
                        {formatPrice(p.price, p.purpose)}
                      </p>
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-base font-bold text-on-surface line-clamp-1 mb-1.5">{p.title}</p>

                    <div className="flex items-center gap-1.5 text-sm text-on-surface-variant mb-3">
                      <MapPin size={13} className="shrink-0 text-secondary/70" />
                      <span className="truncate">{p.city}{p.address ? `, ${p.address}` : ''}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${tc.bg} ${tc.text}`}>{p.type}</span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pc.bg} ${pc.text}`}>{p.purpose === 'sale' ? 'For Sale' : 'For Rent'}</span>
                      {p.bedrooms != null && p.bedrooms > 0 && (
                        <span className="text-xs text-on-surface-variant flex items-center gap-1"><Bed size={12} /> {p.bedrooms} bd</span>
                      )}
                      {p.bathrooms != null && (
                        <span className="text-xs text-on-surface-variant flex items-center gap-1"><Bath size={12} /> {p.bathrooms} ba</span>
                      )}
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-outline-variant/15">
                      <Link href={`/agent/properties/${p.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-on-surface-variant bg-surface-container hover:bg-surface-container-high rounded-xl transition-colors">
                        <Eye size={13} /> View
                      </Link>
                      <Link href={`/agent/properties/${p.id}/edit`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-secondary bg-secondary/8 hover:bg-secondary/15 rounded-xl transition-colors">
                        <Pencil size={13} /> Edit
                      </Link>
                      <button onClick={() => handleDelete(p.id, p.title)} disabled={deletingId === p.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-error bg-error/8 hover:bg-error/15 rounded-xl transition-colors disabled:opacity-40">
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-outline-variant/20">
              <span className="text-sm text-on-surface-variant">
                <strong className="text-on-surface">{total}</strong> total properties
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container-low/50 border-b border-outline-variant/20">
                    {['Property', 'Type', 'Purpose', 'Price', 'City', 'Status', 'Views', 'Actions'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {properties.map((p) => {
                    const tc2 = TYPE_CFG[p.type]      ?? { bg: 'bg-surface-container', text: 'text-on-surface-variant' };
                    const pc2 = PURPOSE_CFG[p.purpose] ?? PURPOSE_CFG.sale;
                    return (
                      <tr key={p.id} className="hover:bg-surface-container-low/30 transition-colors">
                        <td className="px-5 py-4 max-w-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-surface-container overflow-hidden shrink-0">
                              {p.images?.[0]
                                ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
                                : <div className="w-full h-full flex items-center justify-center"><Home size={14} className="text-on-surface-variant" /></div>}
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <p className="text-sm font-medium text-on-surface line-clamp-1">{p.title}</p>
                                {p.is_featured && <Star size={12} className="text-secondary fill-secondary shrink-0" />}
                              </div>
                              <p className="text-xs text-on-surface-variant">{p.area_size ? `${p.area_size} ${p.area_unit}` : '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${tc2.bg} ${tc2.text}`}>{p.type}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pc2.bg} ${pc2.text}`}>
                            {p.purpose === 'sale' ? 'For Sale' : 'For Rent'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-secondary whitespace-nowrap">
                          {formatPrice(p.price, p.purpose)}
                        </td>
                        <td className="px-5 py-4 text-sm text-on-surface-variant">{p.city}</td>
                        <td className="px-5 py-4">
                          {(() => { const sc2 = STATUS_CFG[p.status] ?? STATUS_CFG.draft; return (
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${sc2.bg} ${sc2.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc2.dot}`} />
                              {p.status}
                            </span>
                          ); })()}
                        </td>
                        <td className="px-5 py-4 text-sm text-on-surface-variant">{p.views_count ?? 0}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Link href={`/agent/properties/${p.id}`}
                              className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors">
                              <Eye size={15} />
                            </Link>
                            <Link href={`/agent/properties/${p.id}/edit`}
                              className="p-1.5 text-on-surface-variant hover:text-secondary hover:bg-secondary-fixed/30 rounded-lg transition-colors">
                              <Pencil size={15} />
                            </Link>
                            <button onClick={() => handleDelete(p.id, p.title)} disabled={deletingId === p.id}
                              className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/50 rounded-lg transition-colors disabled:opacity-50">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {total > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm text-on-surface-variant">Page {page} of {lastPage}</p>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="pl-2 pr-6 py-1.5 text-xs bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface focus:outline-none appearance-none cursor-pointer"
            >
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
          {lastPage > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => loadProperties(page - 1)} disabled={page === 1}
                className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={16} />
              </button>
              {pageButtons?.map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-on-surface-variant text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => loadProperties(p as number)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      page === p
                        ? 'bg-secondary text-on-secondary'
                        : 'border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button onClick={() => loadProperties(page + 1)} disabled={page === lastPage}
                className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
