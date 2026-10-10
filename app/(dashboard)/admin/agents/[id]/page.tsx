'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle2, Clock, XCircle, Home, GitBranch, Handshake,
  Phone, Mail, CreditCard, Calendar, TrendingUp, Award, DollarSign, Users,
  Building2, ChevronRight,
} from 'lucide-react';
import { agentsApi } from '@/lib/api';
import { ApiAgentDossier } from '@/lib/api-types';

const statusStyle: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
  pending:  { bg: 'bg-secondary-fixed/40', text: 'text-on-secondary-fixed-variant', icon: Clock },
  approved: { bg: 'bg-emerald-50',         text: 'text-emerald-700',                icon: CheckCircle2 },
  rejected: { bg: 'bg-error-container',    text: 'text-on-error-container',         icon: XCircle },
};

const leadStatusCfg: Record<string, { bg: string; text: string }> = {
  new:         { bg: 'bg-surface-container-high',    text: 'text-primary-container' },
  contacted:   { bg: 'bg-secondary-fixed/40',        text: 'text-on-secondary-fixed-variant' },
  site_visit:  { bg: 'bg-surface-container-highest', text: 'text-on-surface' },
  negotiation: { bg: 'bg-secondary-fixed/40',        text: 'text-secondary' },
  closed_won:  { bg: 'bg-emerald-50',                text: 'text-emerald-700' },
  closed_lost: { bg: 'bg-error-container',           text: 'text-on-error-container' },
};

const dealStatusCfg: Record<string, { bg: string; text: string }> = {
  pending:   { bg: 'bg-secondary-fixed/40',  text: 'text-on-secondary-fixed-variant' },
  confirmed: { bg: 'bg-surface-container-highest', text: 'text-on-surface' },
  completed: { bg: 'bg-emerald-50',          text: 'text-emerald-700' },
};

function fmt(n: string | number | null | undefined): string {
  if (!n) return '—';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return '—';
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num}`;
}

type Tab = 'overview' | 'properties' | 'leads' | 'deals';

export default function AgentDossierPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [dossier, setDossier] = useState<ApiAgentDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    agentsApi.dossier(id)
      .then((res) => setDossier(res.data))
      .catch(() => setError('Failed to load agent dossier.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-outline-variant border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-on-surface-variant">{error || 'Agent not found.'}</p>
        <button onClick={() => router.back()} className="text-sm text-secondary hover:underline">Go back</button>
      </div>
    );
  }

  const { agent, stats, recent_properties, recent_leads, recent_deals } = dossier;
  const ss = statusStyle[agent.approval_status] ?? statusStyle.pending;
  const StatusIcon = ss.icon;

  const statCards = [
    { icon: Home,       label: 'Properties', value: stats.properties_count,      sub: `${stats.available_properties_count} available`, color: 'text-primary-container', bg: 'bg-primary-container/10' },
    { icon: GitBranch,  label: 'Leads',      value: stats.leads_count,           sub: `${stats.won_leads_count} won`,                  color: 'text-secondary',          bg: 'bg-secondary/10' },
    { icon: Handshake,  label: 'Deals',      value: stats.deals_count,           sub: `${stats.completed_deals_count} completed`,      color: 'text-on-tertiary-container', bg: 'bg-on-tertiary-container/10' },
    { icon: DollarSign, label: 'Volume',     value: fmt(stats.total_volume),     sub: 'completed deals',                               color: 'text-emerald-600',        bg: 'bg-emerald-50' },
    { icon: Award,      label: 'Commission', value: fmt(stats.total_commission), sub: 'earned',                                        color: 'text-secondary',          bg: 'bg-secondary/10' },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span className="font-semibold uppercase tracking-wider">RMS Enterprise</span>
        <span className="text-outline-variant">/</span>
        <Link href="/admin/agents" className="font-semibold text-secondary uppercase tracking-wider hover:underline">Agents</Link>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider truncate max-w-[200px]">{agent.user?.full_name ?? 'Dossier'}</span>
      </div>

      {/* Back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 text-on-surface-variant hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container-high"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-semibold text-on-surface font-display">Agent Dossier</h1>
      </div>

      {/* Hero Card */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary-container via-secondary to-secondary-container" />

        <div className="p-6 flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="relative w-24 h-24 rounded-2xl bg-primary-container/10 border-2 border-primary-container/20 flex items-center justify-center overflow-hidden shadow-md">
              {agent.user?.avatar_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={agent.user.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-4xl font-bold text-primary-container">
                    {agent.user?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </span>
              }
              <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full ring-2 ring-surface-container-lowest ${agent.approval_status === 'approved' ? 'bg-secondary' : 'bg-outline'}`} />
            </div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${ss.bg} ${ss.text}`}>
              <StatusIcon size={11} />
              {agent.approval_status.charAt(0).toUpperCase() + agent.approval_status.slice(1)}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-bold text-on-surface font-display">{agent.user?.full_name ?? '—'}</h2>
              {agent.specialization && (
                <p className="text-sm font-semibold text-secondary uppercase tracking-wider mt-0.5">{agent.specialization}</p>
              )}
              {agent.bio && (
                <p className="text-sm text-on-surface-variant mt-2 max-w-prose">{agent.bio}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low">
                <Phone size={14} className="text-on-surface-variant shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Phone</p>
                  <p className="text-sm font-medium text-on-surface truncate">{agent.user?.phone ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low">
                <Mail size={14} className="text-on-surface-variant shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Email</p>
                  <p className="text-sm font-medium text-on-surface truncate">{agent.user?.email ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low">
                <CreditCard size={14} className="text-on-surface-variant shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">CNIC</p>
                  <p className="text-sm font-medium text-on-surface font-mono">{agent.cnic ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low">
                <Calendar size={14} className="text-on-surface-variant shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Joined</p>
                  <p className="text-sm font-medium text-on-surface">
                    {agent.joining_date ? new Date(agent.joining_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col gap-2">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg}`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div>
              <p className="text-xl font-bold text-on-surface leading-none">{s.value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mt-1">{s.label}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Property breakdown */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Available', value: stats.available_properties_count, cls: 'text-secondary' },
          { label: 'Sold',      value: stats.sold_properties_count,      cls: 'text-emerald-600' },
          { label: 'Rented',    value: stats.rented_properties_count,    cls: 'text-on-tertiary-container' },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] text-center">
            <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex items-center bg-surface-container-low p-1 rounded-xl gap-1 w-fit">
        {(['overview', 'properties', 'leads', 'deals'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
              tab === t ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t === 'overview' ? 'Overview' : t === 'properties' ? `Properties (${stats.properties_count})` : t === 'leads' ? `Leads (${stats.leads_count})` : `Deals (${stats.deals_count})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead pipeline breakdown */}
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <GitBranch size={16} className="text-secondary" />
              </div>
              <h3 className="text-sm font-semibold text-on-surface">Lead Breakdown</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Total', value: stats.leads_count },
                { label: 'New', value: stats.new_leads_count },
                { label: 'Won', value: stats.won_leads_count },
                { label: 'Lost', value: stats.lost_leads_count },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">{row.label}</span>
                  <span className="text-sm font-semibold text-on-surface">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deal pipeline breakdown */}
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Handshake size={16} className="text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-on-surface">Deal Breakdown</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Total', value: stats.deals_count },
                { label: 'Pending', value: stats.pending_deals_count },
                { label: 'Confirmed', value: stats.confirmed_deals_count },
                { label: 'Completed', value: stats.completed_deals_count },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">{row.label}</span>
                  <span className="text-sm font-semibold text-on-surface">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial summary */}
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp size={16} className="text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-on-surface">Financial Summary</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant">Total Volume</span>
                <span className="text-sm font-bold text-emerald-600">{fmt(stats.total_volume)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant">Total Commission</span>
                <span className="text-sm font-bold text-secondary">{fmt(stats.total_commission)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant">Commission Rate</span>
                <span className="text-sm font-semibold text-on-surface">{agent.commission_default_pct ?? '—'}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'properties' && (
        <div className="space-y-3">
          {recent_properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-surface-container-lowest rounded-xl">
              <Building2 size={32} className="text-on-surface-variant mb-3" />
              <p className="text-sm text-on-surface-variant">No properties yet</p>
            </div>
          ) : (
            recent_properties.map((property) => {
              const img = property.images?.[0]?.url;
              return (
                <Link
                  key={property.id}
                  href={`/admin/properties/${property.id}`}
                  className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all group"
                >
                  <div className="w-16 h-16 rounded-lg bg-surface-container-low shrink-0 overflow-hidden">
                    {img
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={img} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Building2 size={20} className="text-on-surface-variant" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{property.title}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{property.city} • {property.type} • {property.purpose}</p>
                    <p className="text-xs text-secondary font-semibold mt-1">${parseFloat(property.price).toLocaleString()}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                      property.status === 'available' ? 'bg-emerald-50 text-emerald-700' :
                      property.status === 'sold' ? 'bg-surface-container-highest text-on-surface' :
                      'bg-secondary-fixed/40 text-on-secondary-fixed-variant'
                    }`}>{property.status}</span>
                    <ChevronRight size={16} className="text-outline group-hover:text-on-surface-variant transition-colors" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}

      {tab === 'leads' && (
        <div className="space-y-3">
          {recent_leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-surface-container-lowest rounded-xl">
              <Users size={32} className="text-on-surface-variant mb-3" />
              <p className="text-sm text-on-surface-variant">No leads yet</p>
            </div>
          ) : (
            recent_leads.map((lead) => {
              const cfg = leadStatusCfg[lead.status] ?? leadStatusCfg.new;
              return (
                <div
                  key={lead.id}
                  className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
                >
                  <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-on-surface-variant">{lead.client_name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface">{lead.client_name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-on-surface-variant"><Phone size={10} /> {lead.phone}</span>
                      {lead.email && <span className="flex items-center gap-1 text-xs text-on-surface-variant truncate"><Mail size={10} /> {lead.email}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${cfg.bg} ${cfg.text}`}>
                      {lead.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-on-surface-variant capitalize">{lead.source}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'deals' && (
        <div className="space-y-3">
          {recent_deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-surface-container-lowest rounded-xl">
              <Handshake size={32} className="text-on-surface-variant mb-3" />
              <p className="text-sm text-on-surface-variant">No deals yet</p>
            </div>
          ) : (
            recent_deals.map((deal) => {
              const cfg = dealStatusCfg[deal.deal_status] ?? dealStatusCfg.pending;
              return (
                <Link
                  key={deal.id}
                  href={`/admin/deals/${deal.id}`}
                  className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <Handshake size={18} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface">{deal.property?.title ?? 'No property'}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{deal.client?.name ?? '—'} • {deal.deal_type}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-emerald-600">{fmt(deal.amount)}</span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${cfg.bg} ${cfg.text}`}>{deal.deal_status}</span>
                    <ChevronRight size={16} className="text-outline group-hover:text-on-surface-variant transition-colors" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
