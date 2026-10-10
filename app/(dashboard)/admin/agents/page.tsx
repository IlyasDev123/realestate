'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Clock, CheckCircle2, XCircle, Users, ChevronLeft, ChevronRight,
  Download, LayoutGrid, List, Search, Check, X,
} from 'lucide-react';
import Link from 'next/link';
import { adminApi, agentsApi, ApiError } from '@/lib/api';
import { ApiAgent } from '@/lib/api-types';
import { useToast } from '@/components/ui/Toast';
import { AgentCard } from '@/components/dashboard/AgentCard';

const statusStyle: Record<string, { bg: string; text: string; dot: string }> = {
  pending:  { bg: 'bg-amber-500/10',       text: 'text-amber-700',         dot: 'bg-amber-500' },
  approved: { bg: 'bg-emerald-50',         text: 'text-emerald-700',       dot: 'bg-emerald-500' },
  rejected: { bg: 'bg-error-container',    text: 'text-on-error-container', dot: 'bg-error' },
};
const statusIcon = { pending: Clock, approved: CheckCircle2, rejected: XCircle };

export default function AgentsPage() {
  const toast = useToast();
  // ── "All" tab state ──────────────────────────────────────────────────────
  const [allAgents, setAllAgents] = useState<ApiAgent[]>([]);
  const [allPage, setAllPage] = useState(1);
  const [allLastPage, setAllLastPage] = useState(1);
  const [allTotal, setAllTotal] = useState(0);
  const [allLoading, setAllLoading] = useState(true);

  // ── "Pending" tab state ──────────────────────────────────────────────────
  const [pending, setPending] = useState<ApiAgent[]>([]);
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingLastPage, setPendingLastPage] = useState(1);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingLoading, setPendingLoading] = useState(true);

  // ── Shared UI state ──────────────────────────────────────────────────────
  const [tab, setTab] = useState<'all' | 'pending'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input → debouncedSearch
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); };
  }, [search]);

  // ── Load functions ───────────────────────────────────────────────────────
  const loadAll = useCallback(async (p: number) => {
    setAllLoading(true);
    try {
      const res = await agentsApi.list({ page: p, per_page: 12, search: debouncedSearch || undefined });
      setAllAgents(res.data);
      setAllPage(res.meta.current_page);
      setAllLastPage(res.meta.last_page);
      setAllTotal(res.meta.total);
    } catch {
      // ignore
    } finally {
      setAllLoading(false);
    }
  }, [debouncedSearch]);

  const loadPending = useCallback(async (p: number) => {
    setPendingLoading(true);
    try {
      const res = await adminApi.pendingAgents(p);
      setPending(res.data);
      setPendingPage(res.meta.current_page);
      setPendingLastPage(res.meta.last_page);
      setPendingTotal(res.meta.total);
    } catch {
      // ignore
    } finally {
      setPendingLoading(false);
    }
  }, []);

  // Reload "all" tab when search changes (always reset to page 1)
  useEffect(() => {
    loadAll(1);
  }, [loadAll]);

  // Load pending once on mount
  useEffect(() => {
    loadPending(1);
  }, [loadPending]);

  // ── Actions ──────────────────────────────────────────────────────────────
  async function handleApprove(agentId: string) {
    setActionId(agentId);
    setActionError('');
    try {
      await adminApi.approveAgent(agentId);
      setPending((a) => a.filter((x) => x.id !== agentId));
      setPendingTotal((t) => Math.max(0, t - 1));
      toast('Agent approved successfully');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Error approving agent');
    } finally {
      setActionId(null);
    }
  }

  function openReject(agentId: string) {
    setRejectId(agentId);
    setRejectReason('');
    setActionError('');
  }

  async function confirmReject() {
    if (!rejectId || !rejectReason.trim()) return;
    setActionId(rejectId);
    setActionError('');
    try {
      await adminApi.rejectAgent(rejectId, rejectReason.trim());
      setPending((a) => a.filter((x) => x.id !== rejectId));
      setPendingTotal((t) => Math.max(0, t - 1));
      setRejectId(null);
      setRejectReason('');
      toast('Agent rejected');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Error rejecting agent');
    } finally {
      setActionId(null);
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const isAll = tab === 'all';
  const displayAgents = isAll ? allAgents : pending;
  const loading = isAll ? allLoading : pendingLoading;
  const page = isAll ? allPage : pendingPage;
  const lastPage = isAll ? allLastPage : pendingLastPage;

  const hasFilters = search !== '' || tab !== 'all';
  function clearFilters() {
    setSearch('');
    setDebouncedSearch('');
    setTab('all');
  }

  function handlePageChange(p: number) {
    if (isAll) loadAll(p);
    else loadPending(p);
  }

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

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span className="font-semibold uppercase tracking-wider">RMS Enterprise</span>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider">Agents</span>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider">Advisory Desk Directory</span>
        <div className="flex items-center gap-1.5 ml-3 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          <span className="text-xs font-medium">Active Rosters • {allTotal} Advisory Partners</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-on-surface font-display">Advisory Partners &amp; Private Brokers</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage the advisory desk directory and review incoming agent applications.</p>
        </div>
        <button className="px-4 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface text-sm font-medium shadow-sm hover:bg-surface-container-low transition-all flex items-center gap-2 w-fit">
          <Download size={15} className="text-on-surface-variant" />
          Export Directory CSV
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Advisors',         value: allTotal,       sub: 'All registered agents',       subtextCls: 'text-on-surface-variant' },
          { label: 'Active Mandates',        value: allAgents.reduce((s, a) => s + (a.properties_count ?? 0), 0), sub: 'Across visible agents', subtextCls: 'text-on-surface-variant' },
          { label: 'Pending Applications',   value: pendingTotal,   sub: pendingTotal > 0 ? 'Awaiting review' : 'All reviewed', subtextCls: pendingTotal > 0 ? 'text-secondary' : 'text-on-tertiary-container' },
          { label: 'Closed Deals (visible)', value: allAgents.reduce((s, a) => s + (a.closed_deals_count ?? 0), 0), sub: 'Completed deals', subtextCls: 'text-on-surface-variant' },
        ].map((kpi) => (
          <div key={kpi.label} className="p-4 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{kpi.label}</span>
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center">
                <Users size={16} className="text-secondary" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-on-surface leading-none font-display">{kpi.value}</span>
              <span className={`text-xs font-medium ${kpi.subtextCls}`}>{kpi.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Error / Reject dialog */}
      {actionError && (
        <div className="p-3 bg-error-container border border-error/20 rounded-lg text-sm text-on-error-container">{actionError}</div>
      )}
      {rejectId && (
        <div className="p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-xl flex flex-col gap-3 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm font-semibold text-on-surface">Provide a rejection reason:</p>
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter reason…"
            className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-secondary transition-all"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={confirmReject} disabled={!rejectReason.trim() || actionId === rejectId}
              className="px-4 py-2 text-sm font-semibold bg-error text-on-error rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
              Confirm Reject
            </button>
            <button onClick={() => setRejectId(null)}
              className="px-4 py-2 text-sm font-medium bg-surface-container text-on-surface-variant rounded-lg hover:text-on-surface transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center bg-surface-container-low p-1 rounded-lg gap-0.5">
          {(['all', 'pending'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded text-xs font-semibold transition-colors ${
                tab === t ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t === 'all' ? `All Advisors (${allTotal})` : `Pending Review (${pendingTotal})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {tab === 'all' && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search advisory desks…"
                className="pl-9 pr-4 py-2 bg-surface-container-low rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:bg-surface-container-lowest transition-all w-56"
              />
            </div>
          )}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface bg-surface-container-low hover:bg-surface-container rounded-lg transition-colors"
            >
              <X size={13} />
              Clear
            </button>
          )}
          <div className="flex items-center bg-surface-container-low p-1 rounded-lg gap-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-outline-variant border-t-secondary rounded-full animate-spin" />
        </div>
      ) : displayAgents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-surface-container-lowest rounded-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center mb-3">
            <Users size={24} className="text-on-surface-variant" />
          </div>
          <p className="text-sm font-semibold text-on-surface">
            {tab === 'pending' ? 'No pending applications' : 'No agents found'}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            {tab === 'pending' ? 'All agent applications have been reviewed.' : 'Try adjusting your search.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onApprove={agent.approval_status === 'pending' ? handleApprove : undefined}
              onReject={agent.approval_status === 'pending' ? openReject : undefined}
              actionId={actionId}
            />
          ))}
        </div>
      ) : (
        <div className="bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant/20">
                  {['Agent', 'Email', 'Phone', 'CNIC', 'Specialization', 'Properties', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {displayAgents.map((agent) => {
                  const s = statusStyle[agent.approval_status] ?? statusStyle.pending;
                  const StatusIcon = statusIcon[agent.approval_status as keyof typeof statusIcon] ?? Clock;
                  return (
                    <tr key={agent.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-secondary">
                              {agent.user?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-on-surface">{agent.user?.full_name}</p>
                            <p className="text-xs text-on-surface-variant font-mono">ID: {agent.id.slice(0, 8)}…</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant">{agent.user?.email}</td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant">{agent.user?.phone ?? '—'}</td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant font-mono">{agent.cnic ?? '—'}</td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant">{agent.specialization ?? '—'}</td>
                      <td className="px-5 py-4 text-sm text-on-surface">{agent.properties_count ?? 0}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          <StatusIcon size={11} />
                          {agent.approval_status.charAt(0).toUpperCase() + agent.approval_status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {agent.approval_status === 'pending' ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleApprove(agent.id)} disabled={actionId === agent.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-secondary/10 hover:bg-secondary/15 text-secondary rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                              <Check size={12} /> Approve
                            </button>
                            <button onClick={() => openReject(agent.id)} disabled={actionId === agent.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-error-container hover:bg-error/10 text-on-error-container rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                              <X size={12} /> Reject
                            </button>
                          </div>
                        ) : (
                          <Link
                            href={`/admin/agents/${agent.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg text-xs font-semibold hover:bg-secondary/15 transition-colors"
                          >
                            View Dossier
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-on-surface-variant">
            Page {page} of {lastPage} · {isAll ? allTotal : pendingTotal} total
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {renderPageButtons().map((p, i) =>
              p === '...' ? (
                <span key={`e-${i}`} className="px-2 text-on-surface-variant text-sm">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => handlePageChange(p as number)}
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
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= lastPage}
              className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
