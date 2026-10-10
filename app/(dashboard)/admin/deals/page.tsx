'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Handshake, ChevronRight, Plus, ChevronLeft, LayoutGrid, List, Search, X, TrendingUp, MapPin, User } from 'lucide-react';
import { dealsApi } from '@/lib/api';
import { ApiDeal } from '@/lib/api-types';

// ── Unified badge system ────────────────────────────────────────────────────
const DEAL_STATUS_CFG: Record<string, { bg: string; text: string; dot: string; gradFrom: string }> = {
  pending:   { bg: 'bg-amber-500/90',   text: 'text-white', dot: 'bg-white/70', gradFrom: 'from-amber-500/10' },
  confirmed: { bg: 'bg-secondary/90',   text: 'text-white', dot: 'bg-white/70', gradFrom: 'from-secondary/10' },
  completed: { bg: 'bg-emerald-500/90', text: 'text-white', dot: 'bg-white/70', gradFrom: 'from-emerald-500/10' },
};

const PAYMENT_STATUS_CFG: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-rose-500/90',    text: 'text-white' },
  partial: { bg: 'bg-amber-500/90',   text: 'text-white' },
  paid:    { bg: 'bg-emerald-500/90', text: 'text-white' },
};

const DEAL_TYPE_CFG: Record<string, { bg: string; text: string; iconBg: string; iconText: string }> = {
  sale: { bg: 'bg-secondary/10', text: 'text-secondary',   iconBg: 'bg-secondary/15', iconText: 'text-secondary' },
  rent: { bg: 'bg-emerald-50',   text: 'text-emerald-700', iconBg: 'bg-emerald-100',  iconText: 'text-emerald-700' },
};

function formatPrice(value: string | number) {
  const n = Number(value);
  if (n >= 10_000_000) return `PKR ${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `PKR ${(n / 100_000).toFixed(2)} L`;
  return `PKR ${n.toLocaleString()}`;
}

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<ApiDeal[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dealStatus, setDealStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
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
      const res = await dealsApi.list({
        page: p,
        per_page: perPage,
        search: debouncedSearch || undefined,
        deal_status: dealStatus || undefined,
        payment_status: paymentStatus || undefined,
      });
      setDeals(res.data);
      setTotal(res.meta.total);
      setLastPage(res.meta.last_page);
      setPage(p);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, dealStatus, paymentStatus, perPage]);

  useEffect(() => { load(1); }, [load]);

  const hasFilters = search !== '' || dealStatus !== '' || paymentStatus !== '';
  function clearFilters() { setSearch(''); setDebouncedSearch(''); setDealStatus(''); setPaymentStatus(''); }

  const totalVolume = deals.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalCommission = deals.reduce((sum, d) => sum + Number(d.commission_amount), 0);

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
        <span className="font-semibold text-secondary uppercase tracking-wider">Deals</span>
        <div className="flex items-center gap-1.5 ml-3 px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
          <span className="text-xs font-semibold">{total} Total</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-on-surface font-display">All Deals</h1>
          <p className="text-sm text-on-surface-variant mt-1">Fiduciary transaction rooms and confirmed mandates.</p>
        </div>
        <Link href="/admin/deals/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-on-secondary rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-md shrink-0">
          <Plus size={16} /> New Deal
        </Link>
      </div>

      {/* Summary KPIs */}
      {deals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Deals',     value: total,                        grad: 'from-secondary/8',   iconBg: 'bg-secondary/15', iconText: 'text-secondary',   icon: Handshake },
            { label: 'Completed',       value: deals.filter((d) => d.deal_status === 'completed').length, grad: 'from-emerald-500/8', iconBg: 'bg-emerald-100', iconText: 'text-emerald-700', icon: TrendingUp },
            { label: 'Total Volume',    value: formatPrice(totalVolume),     grad: 'from-amber-500/8',   iconBg: 'bg-amber-100',    iconText: 'text-amber-700',   icon: TrendingUp },
          ].map((kpi) => (
            <div key={kpi.label} className={`relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br ${kpi.grad} via-surface-container-lowest to-surface-container-lowest border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow`}>
              <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-surface-container-low/40" />
              <div className="flex items-center gap-3 relative">
                <div className={`w-11 h-11 rounded-2xl ${kpi.iconBg} flex items-center justify-center shrink-0`}>
                  <kpi.icon size={20} className={kpi.iconText} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{kpi.label}</p>
                  <p className="text-2xl font-bold text-on-surface mt-0.5 font-display">{kpi.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="p-3 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by property or client…"
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:bg-surface-container-lowest transition-all"
          />
        </div>
        <select
          value={dealStatus}
          onChange={(e) => setDealStatus(e.target.value)}
          className="pl-3 pr-8 py-2 bg-surface-container-low rounded-lg text-sm text-on-surface focus:outline-none appearance-none cursor-pointer"
        >
          <option value="">All Deal Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          className="pl-3 pr-8 py-2 bg-surface-container-low rounded-lg text-sm text-on-surface focus:outline-none appearance-none cursor-pointer"
        >
          <option value="">All Payment Statuses</option>
          <option value="pending">Payment Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface bg-surface-container-low hover:bg-surface-container rounded-lg transition-colors shrink-0"
          >
            <X size={13} /> Clear
          </button>
        )}
        <div className="flex items-center bg-surface-container-low p-1 rounded-lg gap-0.5 ml-auto shrink-0">
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
      ) : deals.length === 0 ? (
        <div className="bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] rounded-2xl flex flex-col items-center justify-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
            <Handshake size={24} className="text-secondary" />
          </div>
          <p className="text-sm font-semibold text-on-surface">No deals found</p>
        </div>
      ) : viewMode === 'grid' ? (

        /* ── Grid view ─────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {deals.map((deal) => {
            const ds = DEAL_STATUS_CFG[deal.deal_status] ?? DEAL_STATUS_CFG.pending;
            const ps = PAYMENT_STATUS_CFG[deal.payment_status] ?? PAYMENT_STATUS_CFG.pending;
            const dt = DEAL_TYPE_CFG[deal.deal_type] ?? DEAL_TYPE_CFG.sale;
            return (
              <Link
                key={deal.id}
                href={`/admin/deals/${deal.id}`}
                className="group rounded-2xl bg-surface-container-lowest border border-outline-variant/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Gradient header */}
                <div className={`px-5 py-4 bg-gradient-to-br ${ds.gradFrom} via-surface-container-lowest to-surface-container-lowest border-b border-outline-variant/10`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="text-sm font-semibold text-on-surface line-clamp-1 flex-1">{deal.property?.title ?? 'Unnamed Property'}</p>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${dt.bg} ${dt.text}`}>
                      {deal.deal_type}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-on-surface font-display">{formatPrice(deal.amount)}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Commission: <span className="font-semibold text-secondary">{formatPrice(deal.commission_amount)}</span>
                  </p>
                </div>

                {/* Body */}
                <div className="px-5 py-3.5 flex flex-col gap-2 flex-1">
                  {deal.property?.city && (
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                      <MapPin size={11} className="shrink-0 text-secondary/70" />
                      {deal.property.city}
                    </div>
                  )}
                  {deal.client?.name && (
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                      <User size={11} className="shrink-0 text-secondary/70" />
                      {deal.client.name}
                      {deal.agent?.user?.full_name && <span className="text-outline-variant">· {deal.agent.user.full_name}</span>}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${ds.bg} ${ds.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ds.dot}`} />
                      {deal.deal_status}
                    </span>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${ps.bg} ${ps.text}`}>
                      {deal.payment_status}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-2.5 border-t border-outline-variant/10 flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">
                    {new Date(deal.created_at).toLocaleDateString()}
                  </span>
                  <ChevronRight size={14} className="text-outline-variant group-hover:text-secondary transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>

      ) : (

        /* ── List view ─────────────────────────────────────────────── */
        <div className="bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden">
          {deals.length > 0 && (
            <div className="px-5 py-3 border-b border-outline-variant/20 flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">
                Showing <strong className="text-on-surface">{deals.length}</strong> of <strong className="text-on-surface">{total}</strong> deals
              </span>
              <span className="text-xs text-on-surface-variant">
                Total volume: <strong className="text-secondary">{formatPrice(totalVolume)}</strong>
                <span className="mx-2 text-outline-variant">·</span>
                Commission: <strong className="text-secondary">{formatPrice(totalCommission)}</strong>
              </span>
            </div>
          )}
          <div className="divide-y divide-outline-variant/10">
            {deals.map((deal) => {
              const ds = DEAL_STATUS_CFG[deal.deal_status] ?? DEAL_STATUS_CFG.pending;
              const ps = PAYMENT_STATUS_CFG[deal.payment_status] ?? PAYMENT_STATUS_CFG.pending;
              const dt = DEAL_TYPE_CFG[deal.deal_type] ?? DEAL_TYPE_CFG.sale;
              return (
                <Link
                  key={deal.id}
                  href={`/admin/deals/${deal.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-surface-container-low/40 transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${dt.iconBg} flex items-center justify-center shrink-0`}>
                      <Handshake size={18} className={dt.iconText} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface line-clamp-1">
                        {deal.property?.title ?? 'Unnamed Property'}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {deal.client?.name}{deal.agent?.user?.full_name ? ` · ${deal.agent.user.full_name}` : ''}
                        {' · '}{new Date(deal.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <p className="text-sm font-bold text-secondary hidden sm:block">{formatPrice(deal.amount)}</p>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${ds.bg} ${ds.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ds.dot}`} />
                      {deal.deal_status}
                    </span>
                    <span className={`hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${ps.bg} ${ps.text}`}>
                      {deal.payment_status}
                    </span>
                    <ChevronRight size={16} className="text-outline-variant group-hover:text-secondary transition-colors" />
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
                  <button key={p} onClick={() => load(p as number)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      page === p ? 'bg-secondary text-on-secondary' : 'border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline'
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
