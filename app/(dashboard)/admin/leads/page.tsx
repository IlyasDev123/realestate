'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { GitBranch, Search, ChevronRight, Phone, Mail, ChevronLeft, LayoutGrid, List, Calendar, Plus, X } from 'lucide-react';
import { leadsApi } from '@/lib/api';
import { ApiLead } from '@/lib/api-types';

// ── Unified badge system ────────────────────────────────────────────────────
const LEAD_STATUS_CFG: Record<string, {
  label: string; bg: string; text: string; dot: string;
  avatarBg: string; avatarText: string;
}> = {
  new:         { label: 'New',         bg: 'bg-secondary/90',   text: 'text-white', dot: 'bg-white/70', avatarBg: 'bg-secondary/15',  avatarText: 'text-secondary' },
  contacted:   { label: 'Contacted',   bg: 'bg-sky-500/90',     text: 'text-white', dot: 'bg-white/70', avatarBg: 'bg-sky-100',       avatarText: 'text-sky-700' },
  site_visit:  { label: 'Site Visit',  bg: 'bg-violet-500/90',  text: 'text-white', dot: 'bg-white/70', avatarBg: 'bg-violet-100',    avatarText: 'text-violet-700' },
  negotiation: { label: 'Negotiation', bg: 'bg-amber-500/90',   text: 'text-white', dot: 'bg-white/70', avatarBg: 'bg-amber-100',     avatarText: 'text-amber-700' },
  closed_won:  { label: 'Won',         bg: 'bg-emerald-500/90', text: 'text-white', dot: 'bg-white/70', avatarBg: 'bg-emerald-100',   avatarText: 'text-emerald-700' },
  closed_lost: { label: 'Lost',        bg: 'bg-rose-600/90',    text: 'text-white', dot: 'bg-white/70', avatarBg: 'bg-rose-100',      avatarText: 'text-rose-700' },
};

const SOURCE_CFG: Record<string, { bg: string; text: string }> = {
  website:  { bg: 'bg-secondary/10', text: 'text-secondary' },
  referral: { bg: 'bg-emerald-50',   text: 'text-emerald-700' },
  social:   { bg: 'bg-violet-50',    text: 'text-violet-700' },
  walk_in:  { bg: 'bg-amber-50',     text: 'text-amber-700' },
  phone:    { bg: 'bg-sky-50',       text: 'text-sky-700' },
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<ApiLead[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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
      const res = await leadsApi.list({ page: p, per_page: perPage, search: debouncedSearch || undefined, status: statusFilter || undefined });
      setLeads(res.data);
      setTotal(res.meta.total);
      setLastPage(res.meta.last_page);
      setPage(p);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, perPage]);

  useEffect(() => { load(1); }, [load]);

  const hasFilters = search !== '' || statusFilter !== '';
  function clearFilters() { setSearch(''); setDebouncedSearch(''); setStatusFilter(''); }

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
        <span className="font-semibold text-secondary uppercase tracking-wider">Leads</span>
        <div className="flex items-center gap-1.5 ml-3 px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
          <span className="text-xs font-semibold">{total} Total</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-on-surface font-display">All Leads</h1>
          <p className="text-sm text-on-surface-variant mt-1">Track and manage all incoming buyer &amp; tenant enquiries.</p>
        </div>
        <Link
          href="/admin/leads/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-on-secondary text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm shrink-0"
        >
          <Plus size={15} /> Add Lead
        </Link>
      </div>

      {/* Filters */}
      <div className="p-3 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone…"
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:bg-surface-container-lowest transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="pl-3 pr-8 py-2 bg-surface-container-low rounded-lg text-sm text-on-surface focus:outline-none appearance-none cursor-pointer"
        >
          <option value="">All Statuses</option>
          {Object.entries(LEAD_STATUS_CFG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface bg-surface-container-low hover:bg-surface-container rounded-lg transition-colors shrink-0"
          >
            <X size={13} /> Clear
          </button>
        )}
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
      ) : leads.length === 0 ? (
        <div className="bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] rounded-2xl flex flex-col items-center justify-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
            <GitBranch size={24} className="text-secondary" />
          </div>
          <p className="text-sm font-semibold text-on-surface">No leads found</p>
        </div>
      ) : viewMode === 'grid' ? (

        /* ── Grid view ─────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {leads.map((lead) => {
            const cfg = LEAD_STATUS_CFG[lead.status] ?? LEAD_STATUS_CFG.new;
            const src = SOURCE_CFG[lead.source] ?? { bg: 'bg-surface-container', text: 'text-on-surface-variant' };
            return (
              <Link
                key={lead.id}
                href={`/admin/leads/${lead.id}`}
                className="group rounded-2xl bg-surface-container-lowest border border-outline-variant/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col shadow-[0_2px_12px_rgba(13,28,50,0.06)]"
              >
                {/* Card header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-outline-variant/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-full ${cfg.avatarBg} flex items-center justify-center shrink-0`}>
                      <span className={`text-base font-bold ${cfg.avatarText}`}>
                        {lead.client_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-bold text-on-surface truncate">{lead.client_name}</p>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1 ${cfg.bg} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize shrink-0 ml-2 ${src.bg} ${src.text}`}>
                    {lead.source?.replace('_', ' ')}
                  </span>
                </div>

                {/* Contact info */}
                <div className="px-5 py-4 flex flex-col gap-2.5 flex-1">
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <Phone size={13} className="shrink-0 text-secondary/70" /> {lead.phone}
                  </div>
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <Mail size={13} className="shrink-0 text-secondary/70" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}
                  {lead.property && (
                    <div className="flex items-start gap-2 text-sm text-on-surface-variant/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-outline-variant mt-1.5 shrink-0" />
                      <span className="line-clamp-1">{lead.property.title}</span>
                    </div>
                  )}
                  {lead.next_followup_at && (
                    <div className="flex items-center gap-2 text-sm text-secondary font-semibold mt-0.5">
                      <Calendar size={13} className="shrink-0" />
                      Follow-up: {new Date(lead.next_followup_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-outline-variant/10 flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant/50">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </span>
                  <ChevronRight size={15} className="text-outline-variant group-hover:text-secondary transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>

      ) : (

        /* ── List view ─────────────────────────────────────────────── */
        <div className="bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden">
          <div className="divide-y divide-outline-variant/10">
            {leads.map((lead) => {
              const cfg = LEAD_STATUS_CFG[lead.status] ?? LEAD_STATUS_CFG.new;
              const src = SOURCE_CFG[lead.source] ?? { bg: 'bg-surface-container', text: 'text-on-surface-variant' };
              return (
                <Link
                  key={lead.id}
                  href={`/admin/leads/${lead.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-surface-container-low/40 transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-full ${cfg.avatarBg} flex items-center justify-center shrink-0`}>
                      <span className={`text-sm font-bold ${cfg.avatarText}`}>
                        {lead.client_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface">{lead.client_name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                          <Phone size={10} /> {lead.phone}
                        </span>
                        {lead.email && (
                          <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                            <Mail size={10} /> {lead.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                    <span className={`hidden sm:inline-flex text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${src.bg} ${src.text}`}>
                      {lead.source}
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
