'use client';

import Link from 'next/link';
import { Check, X, Clock, CheckCircle2, XCircle, Phone, Mail } from 'lucide-react';
import { ApiAgent } from '@/lib/api-types';

const statusStyle: Record<string, { bg: string; text: string; dot: string }> = {
  pending:  { bg: 'bg-amber-500/10',       text: 'text-amber-700',         dot: 'bg-amber-500' },
  approved: { bg: 'bg-emerald-50',         text: 'text-emerald-700',       dot: 'bg-emerald-500' },
  rejected: { bg: 'bg-error-container',    text: 'text-on-error-container', dot: 'bg-error' },
};

const statusIcon = { pending: Clock, approved: CheckCircle2, rejected: XCircle };

interface AgentCardProps {
  agent: ApiAgent;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  actionId?: string | null;
}

export function AgentCard({ agent, onApprove, onReject, actionId }: AgentCardProps) {
  const s = statusStyle[agent.approval_status] ?? statusStyle.pending;
  const StatusIcon = statusIcon[agent.approval_status as keyof typeof statusIcon] ?? Clock;
  const isApproved = agent.approval_status === 'approved';
  const volFormatted = agent.total_volume
    ? `$${(parseFloat(agent.total_volume) / 1_000_000).toFixed(1)}M`
    : '—';
  const commPct = agent.commission_default_pct ? `${agent.commission_default_pct}%` : '—';
  const capacity = agent.properties_count ?? 0;

  return (
    <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden shadow-[0_2px_12px_rgba(13,28,50,0.06)]">

      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-outline-variant/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-11 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 overflow-hidden">
            {agent.user?.avatar_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={agent.user.avatar_url} alt="" className="w-full h-full object-cover" />
              : <span className="text-base font-bold text-secondary">
                  {agent.user?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                </span>
            }
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-surface-container-lowest ${isApproved ? 'bg-secondary' : 'bg-outline'}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-base font-bold text-on-surface truncate">{agent.user?.full_name ?? '—'}</p>
              {isApproved && <CheckCircle2 size={13} className="text-secondary shrink-0" />}
            </div>
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider truncate block">
              {agent.specialization ?? 'General Advisor'}
            </span>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${s.bg} ${s.text}`}>
          <StatusIcon size={10} />
          {agent.approval_status.charAt(0).toUpperCase() + agent.approval_status.slice(1)}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col gap-2.5 flex-1">
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <Phone size={13} className="shrink-0 text-secondary/70" />
          {agent.user?.phone ?? '—'}
        </div>
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <Mail size={13} className="shrink-0 text-secondary/70" />
          <span className="truncate">{agent.user?.email ?? '—'}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="p-2.5 rounded-lg bg-surface-container-low/60 flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Properties</span>
            <span className="text-sm font-semibold text-on-surface">{capacity} Estates</span>
            <span className="text-xs text-secondary font-medium">{volFormatted} AUM</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-low/60 flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Deals / Comm.</span>
            <span className="text-sm font-semibold text-on-surface">{agent.closed_deals_count ?? 0} Closed</span>
            <span className="text-xs text-on-surface-variant font-medium">{commPct} rate</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-outline-variant/10 flex items-center justify-between gap-2">
        {agent.approval_status === 'pending' && onApprove && onReject ? (
          <>
            <button
              onClick={() => onApprove(agent.id)}
              disabled={actionId === agent.id}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-secondary/10 hover:bg-secondary/15 text-secondary rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Check size={12} /> Approve
            </button>
            <button
              onClick={() => onReject(agent.id)}
              disabled={actionId === agent.id}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-error-container hover:bg-error/10 text-on-error-container rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              <X size={12} /> Reject
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              {capacity}/15 Estates
            </div>
            <Link
              href={`/admin/agents/${agent.id}`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary text-xs font-semibold hover:bg-secondary/15 transition-colors"
            >
              View Dossier
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
