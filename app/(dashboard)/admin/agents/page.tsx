'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Clock, CheckCircle2, XCircle, Users,
  ChevronLeft, ChevronRight, Check, X, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { adminApi, ApiError } from '@/lib/api';
import { ApiAgent } from '@/lib/api-types';
import { useToast } from '@/components/ui/Toast';
import { AgentCard } from '@/components/dashboard/AgentCard';

export default function AgentApplicationsPage() {
  const toast = useToast();

  const [pending, setPending]       = useState<ApiAgent[]>([]);
  const [page, setPage]             = useState(1);
  const [lastPage, setLastPage]     = useState(1);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [actionId, setActionId]     = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [rejectId, setRejectId]     = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await adminApi.pendingAgents(p);
      setPending(res.data);
      setPage(res.meta.current_page);
      setLastPage(res.meta.last_page);
      setTotal(res.meta.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  async function handleApprove(agentId: string) {
    setActionId(agentId);
    setActionError('');
    try {
      await adminApi.approveAgent(agentId);
      setPending((a) => a.filter((x) => x.id !== agentId));
      setTotal((t) => Math.max(0, t - 1));
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
      setTotal((t) => Math.max(0, t - 1));
      setRejectId(null);
      setRejectReason('');
      toast('Agent rejected');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Error rejecting agent');
    } finally {
      setActionId(null);
    }
  }

  function renderPageButtons(): (number | '...')[] {
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
        <span className="font-semibold text-secondary uppercase tracking-wider">Agent Applications</span>
        <div className="flex items-center gap-1.5 ml-3 px-2.5 py-0.5 rounded-full bg-amber-500/10">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-medium text-amber-700">{total} Pending Review</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-on-surface font-display">Agent Applications</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Review and action incoming advisory agent applications. Approved agents appear in{' '}
            <Link href="/admin/users" className="text-secondary hover:underline font-medium">Manage Users</Link>.
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Awaiting Review',
            value: total,
            sub: total > 0 ? 'Needs your attention' : 'All caught up',
            icon: Clock,
            iconGrad: 'linear-gradient(135deg, #904d00, #fe932c)',
            valueCls: total > 0 ? 'text-secondary' : 'text-on-surface',
          },
          {
            label: 'Approve Action',
            value: 'Approve',
            sub: 'Grant portal access',
            icon: CheckCircle2,
            iconGrad: 'linear-gradient(135deg, #047857, #10b981)',
            valueCls: 'text-emerald-700',
          },
          {
            label: 'Reject Action',
            value: 'Reject',
            sub: 'Decline with reason',
            icon: XCircle,
            iconGrad: 'linear-gradient(135deg, #b91c1c, #ef4444)',
            valueCls: 'text-red-600',
          },
        ].map((kpi) => (
          <div key={kpi.label} className="p-4 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: kpi.iconGrad }}>
              <kpi.icon size={18} className="text-white" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{kpi.label}</span>
              <p className={`text-2xl font-bold font-display leading-tight ${kpi.valueCls}`}>{kpi.value}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Error banner */}
      {actionError && (
        <div className="flex items-center gap-3 p-4 bg-error-container border border-error/20 rounded-xl text-sm text-on-error-container">
          <AlertCircle size={16} className="shrink-0" />
          {actionError}
        </div>
      )}

      {/* Reject dialog */}
      {rejectId && (
        <div className="p-5 bg-surface-container-lowest border border-outline-variant/20 rounded-xl flex flex-col gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-error-container flex items-center justify-center shrink-0">
              <XCircle size={16} className="text-on-error-container" />
            </div>
            <p className="text-sm font-semibold text-on-surface">Provide a rejection reason for this application:</p>
          </div>
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirmReject()}
            placeholder="Enter reason…"
            className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-secondary transition-all"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={confirmReject}
              disabled={!rejectReason.trim() || actionId === rejectId}
              className="px-5 py-2 text-sm font-semibold bg-error text-on-error rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
            >
              <X size={13} /> Confirm Reject
            </button>
            <button
              onClick={() => setRejectId(null)}
              className="px-4 py-2 text-sm font-medium bg-surface-container text-on-surface-variant rounded-lg hover:text-on-surface transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-outline-variant border-t-secondary rounded-full animate-spin" />
        </div>
      ) : pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </div>
          <p className="text-base font-semibold text-on-surface">All caught up!</p>
          <p className="text-sm text-on-surface-variant mt-1">No pending agent applications to review.</p>
          <Link
            href="/admin/users"
            className="mt-4 text-sm text-secondary font-medium hover:underline flex items-center gap-1"
          >
            View approved agents in Manage Users →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pending.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onApprove={handleApprove}
              onReject={openReject}
              actionId={actionId}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-on-surface-variant">
            Page {page} of {lastPage} · {total} pending
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => load(page - 1)}
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
            <button
              onClick={() => load(page + 1)}
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
