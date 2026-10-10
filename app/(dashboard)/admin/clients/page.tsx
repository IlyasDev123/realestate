'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Users2, Search, Plus, Phone, Mail, ChevronRight, ChevronLeft, LayoutGrid, List, X } from 'lucide-react';
import { clientsApi } from '@/lib/api';
import { ApiClient } from '@/lib/api-types';
import { ClientCard } from '@/components/dashboard/ClientCard';

const typeStyle: Record<ApiClient['type'], { bg: string; text: string; dot: string }> = {
  buyer:    { bg: 'bg-secondary/10',           text: 'text-secondary',           dot: 'bg-secondary' },
  seller:   { bg: 'bg-primary-container/10',   text: 'text-primary-container',   dot: 'bg-primary-container' },
  tenant:   { bg: 'bg-outline-variant/30',     text: 'text-on-surface-variant',  dot: 'bg-outline' },
  landlord: { bg: 'bg-surface-container-high', text: 'text-on-surface',          dot: 'bg-outline-variant' },
};

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await clientsApi.list({ page: p, per_page: perPage, search: debouncedSearch || undefined, type: typeFilter || undefined });
      setClients(res.data);
      setTotal(res.meta.total);
      setLastPage(res.meta.last_page);
      setPage(p);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, typeFilter, perPage]);

  useEffect(() => { load(1); }, [load]);

  const hasFilters = search !== '' || typeFilter !== '';
  function clearFilters() {
    setSearch('');
    setDebouncedSearch('');
    setTypeFilter('');
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
        <span className="font-semibold text-secondary uppercase tracking-wider">Clients</span>
        <div className="flex items-center gap-1.5 ml-3 px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          <span className="text-xs font-medium">{total} Total Clients</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-on-surface font-display">Client Directory</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage buyers, sellers, tenants and landlords.</p>
        </div>
        <Link
          href="/admin/clients/new"
          className="px-4 py-2.5 rounded-lg bg-secondary text-on-secondary text-sm font-semibold shadow-md hover:opacity-95 transition-all flex items-center gap-2 shrink-0"
        >
          <Plus size={15} /> Add Client
        </Link>
      </div>

      {/* Filters */}
      <div className="p-3 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone or email…"
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:bg-surface-container-lowest transition-all"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="pl-3 pr-8 py-2 bg-surface-container-low rounded-lg text-sm text-on-surface focus:outline-none appearance-none cursor-pointer"
        >
          <option value="">All Types</option>
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
          <option value="tenant">Tenant</option>
          <option value="landlord">Landlord</option>
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
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-2 border-outline-variant border-t-secondary rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] rounded-xl flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center mb-4">
            <Users2 size={24} className="text-on-surface-variant" />
          </div>
          <p className="text-sm font-medium text-on-surface">No clients found</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              href={`/admin/clients/${client.id}`}
              extraField="notes"
            />
          ))}
        </div>
      ) : (
        <div className="bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] rounded-xl overflow-hidden">
          <div className="divide-y divide-outline-variant/10">
            {clients.map((client) => {
              const s = typeStyle[client.type];
              return (
                <Link
                  key={client.id}
                  href={`/admin/clients/${client.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-surface-container-low/30 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-secondary">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-on-surface">{client.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {client.phone && (
                          <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                            <Phone size={10} /> {client.phone}
                          </span>
                        )}
                        {client.email && (
                          <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                            <Mail size={10} /> {client.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${s.bg} ${s.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {client.type}
                    </span>
                    <ChevronRight size={16} className="text-outline group-hover:text-on-surface-variant transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {total > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-xs text-on-surface-variant">Page {page} of {lastPage}</p>
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
              <button onClick={() => load(page - 1)} disabled={page <= 1}
                className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface disabled:opacity-40 transition-colors">
                <ChevronLeft size={16} />
              </button>
              {pageButtons?.map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-on-surface-variant text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => load(p as number)}
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
              <button onClick={() => load(page + 1)} disabled={page >= lastPage}
                className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface disabled:opacity-40 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
