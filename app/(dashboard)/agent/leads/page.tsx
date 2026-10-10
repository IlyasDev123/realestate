'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Phone, ChevronRight, Plus, Search, ChevronLeft, List, GitBranch, Mail, Calendar, X, User,
} from 'lucide-react';
import { leadsApi } from '@/lib/api';
import { ApiLead } from '@/lib/api-types';

// ── Unified badge system ────────────────────────────────────────────────────
const LEAD_STATUS_CFG: Record<string, {
  label: string; bg: string; text: string; dot: string;
  colBorder: string; colBg: string; avatarBg: string; avatarText: string;
}> = {
  new:         { label: 'New',         bg: 'bg-secondary/90',   text: 'text-white', dot: 'bg-white/70', colBorder: 'border-secondary',     colBg: 'bg-secondary/5',     avatarBg: 'bg-secondary/15',    avatarText: 'text-secondary' },
  contacted:   { label: 'Contacted',   bg: 'bg-sky-500/90',     text: 'text-white', dot: 'bg-white/70', colBorder: 'border-sky-400',       colBg: 'bg-sky-50/60',       avatarBg: 'bg-sky-100',         avatarText: 'text-sky-700' },
  site_visit:  { label: 'Site Visit',  bg: 'bg-violet-500/90',  text: 'text-white', dot: 'bg-white/70', colBorder: 'border-violet-400',    colBg: 'bg-violet-50/60',    avatarBg: 'bg-violet-100',      avatarText: 'text-violet-700' },
  negotiation: { label: 'Negotiation', bg: 'bg-amber-500/90',   text: 'text-white', dot: 'bg-white/70', colBorder: 'border-amber-400',     colBg: 'bg-amber-50/60',     avatarBg: 'bg-amber-100',       avatarText: 'text-amber-700' },
  closed_won:  { label: 'Won',         bg: 'bg-emerald-500/90', text: 'text-white', dot: 'bg-white/70', colBorder: 'border-emerald-500',   colBg: 'bg-emerald-50/60',   avatarBg: 'bg-emerald-100',     avatarText: 'text-emerald-700' },
  closed_lost: { label: 'Lost',        bg: 'bg-rose-600/90',    text: 'text-white', dot: 'bg-white/70', colBorder: 'border-rose-500',      colBg: 'bg-rose-50/60',      avatarBg: 'bg-rose-100',        avatarText: 'text-rose-700' },
};

const SOURCE_CFG: Record<string, { bg: string; text: string }> = {
  website:  { bg: 'bg-secondary/10',         text: 'text-secondary' },
  referral: { bg: 'bg-emerald-50',           text: 'text-emerald-700' },
  social:   { bg: 'bg-violet-50',            text: 'text-violet-700' },
  walk_in:  { bg: 'bg-amber-50',             text: 'text-amber-700' },
  phone:    { bg: 'bg-sky-50',               text: 'text-sky-700' },
};

const KANBAN_COLS = ['new', 'contacted', 'site_visit', 'negotiation', 'closed_won', 'closed_lost'] as const;

export default function AgentLeadsPage() {
  const [leads, setLeads] = useState<ApiLead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const effectivePerPage = viewMode === 'kanban' ? 100 : perPage;
      const res = await leadsApi.list({
        page: p,
        per_page: effectivePerPage,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      });
      setLeads(res.data);
      setTotal(res.meta.total);
      setLastPage(res.meta.last_page);
      setPage(res.meta.current_page);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, viewMode, perPage]);

  useEffect(() => { load(1); }, [load]);

  const hasFilters = search !== '' || statusFilter !== '';
  function clearFilters() { setSearch(''); setDebouncedSearch(''); setStatusFilter(''); }

  function renderPageButtons() {
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

  const byStatus = (status: string) => leads.filter((l) => l.status === status);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span className="font-semibold uppercase tracking-wider">RMS Enterprise</span>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider">Leads Pipeline</span>
        <div className="flex items-center gap-1.5 ml-3 px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
          <span className="text-xs font-semibold">{total} leads</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-on-surface font-display">Leads Pipeline</h1>
          <p className="text-sm text-on-surface-variant mt-1">Track your buyer &amp; tenant leads through the sales funnel.</p>
        </div>
        <Link
          href="/agent/leads/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-on-secondary text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm shrink-0"
        >
          <Plus size={15} /> Add Lead
        </Link>
      </div>

      {/* Filters toolbar */}
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
        {/* View toggle */}
        <div className="flex items-center bg-surface-container-low p-1 rounded-lg gap-0.5 shrink-0">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-2.5 py-1.5 rounded text-xs font-semibold transition-colors ${viewMode === 'kanban' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-outline-variant border-t-secondary rounded-full animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-surface-container-lowest rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-3">
            <GitBranch size={24} className="text-secondary" />
          </div>
          <p className="text-sm font-semibold text-on-surface">No leads found</p>
          <p className="text-xs text-on-surface-variant mt-1">Try adjusting your search or add a new lead.</p>
        </div>
      ) : viewMode === 'kanban' ? (

        /* ── Kanban board ─────────────────────────────────────────── */
        <div className="overflow-x-auto -mx-1 px-1 pb-4">
          <div className="flex gap-3 min-w-max">
            {KANBAN_COLS.map((key) => {
              const cfg = LEAD_STATUS_CFG[key];
              const colLeads = byStatus(key);
              return (
                <div
                  key={key}
                  className={`w-64 flex flex-col rounded-2xl overflow-hidden border-t-4 ${cfg.colBorder} bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.05)]`}
                >
                  {/* Column header */}
                  <div className={`px-3.5 py-3 flex items-center justify-between ${cfg.colBg}`}>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>
                    <span className="text-xs font-bold w-6 h-6 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface shadow-sm">
                      {colLeads.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 p-2.5 space-y-2.5 min-h-28">
                    {colLeads.map((lead) => (
                      <Link
                        key={lead.id}
                        href={`/agent/leads/${lead.id}`}
                        className="block p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/15 hover:border-secondary/25 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className={`w-8 h-8 rounded-full ${cfg.avatarBg} flex items-center justify-center shrink-0`}>
                            <span className={`text-xs font-bold ${cfg.avatarText}`}>
                              {lead.client_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-on-surface leading-tight line-clamp-1">{lead.client_name}</p>
                        </div>
                        <div className="space-y-1.5 pl-0.5">
                          <p className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                            <Phone size={10} className="shrink-0" /> {lead.phone}
                          </p>
                          {lead.property && (
                            <p className="text-xs text-on-surface-variant/70 line-clamp-1 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-outline-variant shrink-0" />
                              {lead.property.title}
                            </p>
                          )}
                          {lead.next_followup_at && (
                            <p className="flex items-center gap-1.5 text-xs text-secondary font-medium">
                              <Calendar size={10} className="shrink-0" />
                              {new Date(lead.next_followup_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex justify-end mt-2">
                          <ChevronRight size={13} className="text-outline-variant group-hover:text-secondary transition-colors" />
                        </div>
                      </Link>
                    ))}
                    {colLeads.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-20 gap-1">
                        <div className="w-7 h-7 rounded-full bg-surface-container-low flex items-center justify-center">
                          <User size={13} className="text-on-surface-variant/40" />
                        </div>
                        <p className="text-xs text-on-surface-variant/40 font-medium">Empty</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      ) : (

        /* ── List view ────────────────────────────────────────────── */
        <div className="bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden">
          <div className="divide-y divide-outline-variant/10">
            {leads.map((lead) => {
              const cfg = LEAD_STATUS_CFG[lead.status] ?? LEAD_STATUS_CFG.new;
              const src = SOURCE_CFG[lead.source] ?? { bg: 'bg-surface-container', text: 'text-on-surface-variant' };
              return (
                <Link
                  key={lead.id}
                  href={`/agent/leads/${lead.id}`}
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
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                          <Phone size={10} /> {lead.phone}
                        </span>
                        {lead.email && (
                          <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                            <Mail size={10} /> {lead.email}
                          </span>
                        )}
                        {lead.next_followup_at && (
                          <span className="flex items-center gap-1 text-xs text-secondary font-medium">
                            <Calendar size={10} /> {new Date(lead.next_followup_at).toLocaleDateString()}
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

      {/* Pagination — list view only */}
      {viewMode === 'list' && total > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-xs text-on-surface-variant">Page {page} of {lastPage} · {total} total</p>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="pl-2 pr-6 py-1.5 text-xs bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface focus:outline-none appearance-none cursor-pointer"
            >
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={20}>20 / page</option>
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
              {renderPageButtons().map((p, i) =>
                p === '...' ? (
                  <span key={`e-${i}`} className="px-2 text-on-surface-variant text-sm">…</span>
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
