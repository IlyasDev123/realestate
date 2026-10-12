'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus, ChevronRight, Gavel, UserPlus, Building2,
  TrendingUp, Building, Users, Handshake,
  DollarSign, RefreshCw, ArrowUpRight, Loader2,
} from 'lucide-react';

import { statsApi } from '@/lib/api';
import { ApiStats, ApiActivityItem, ApiActiveDeal, ApiMonthStat } from '@/lib/api-types';

const kpiHrefs: Record<string, string> = {
  'Total Properties': '/admin/properties',
  'Active Leads':     '/admin/leads',
  'Advisory Agents':  '/admin/agents',
  'Closed Volume':    '/admin/deals',
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtPKR(n: number): string {
  if (n >= 1_000_000_000) return `PKR ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 10_000_000)    return `PKR ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 100_000)       return `PKR ${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000)         return `PKR ${(n / 1_000).toFixed(0)}K`;
  return `PKR ${n.toLocaleString()}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── SVG smooth area path from data points ─────────────────────────────────────
function buildAreaPath(counts: number[]): { line: string; area: string; pts: { x: number; y: number }[] } {
  const n   = counts.length;
  const max = Math.max(...counts, 1);
  const W = 600, TOP = 14, BOT = 186;
  const pts = counts.map((c, i) => ({
    x: n > 1 ? (i / (n - 1)) * W : W / 2,
    y: BOT - (c / max) * (BOT - TOP),
  }));
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx  = (pts[i + 1].x - pts[i].x) * 0.45;
    d += ` C ${(pts[i].x + dx).toFixed(1)} ${pts[i].y.toFixed(1)} ${(pts[i + 1].x - dx).toFixed(1)} ${pts[i + 1].y.toFixed(1)} ${pts[i + 1].x.toFixed(1)} ${pts[i + 1].y.toFixed(1)}`;
  }
  return { line: d, area: `${d} L ${W} ${BOT} L 0 ${BOT} Z`, pts };
}

// ── Filter pill group ──────────────────────────────────────────────────────────
type Range = '7d' | '30d' | '3m' | '6m' | '1y';
const RANGES: { key: Range; label: string }[] = [
  { key: '7d',  label: '7D'  },
  { key: '30d', label: '30D' },
  { key: '3m',  label: '3M'  },
  { key: '6m',  label: '6M'  },
  { key: '1y',  label: '1Y'  },
];

function RangeFilter({ value, onChange, loading }: { value: Range; onChange: (r: Range) => void; loading: boolean }) {
  return (
    <div className="flex items-center bg-surface-container-low p-0.5 rounded-lg gap-0.5">
      {RANGES.map(r => (
        <button
          key={r.key}
          onClick={() => onChange(r.key)}
          disabled={loading}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all disabled:opacity-40 ${
            value === r.key
              ? 'bg-surface-container-lowest text-on-surface shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          {r.label}
        </button>
      ))}
      {loading && <Loader2 size={13} className="animate-spin text-on-surface-variant ml-1" />}
    </div>
  );
}

// ── Activity badge colours ─────────────────────────────────────────────────────
const BADGE: Record<string, string> = {
  Completed:    'bg-emerald-50 text-emerald-700',
  Confirmed:    'bg-surface-container-highest text-on-surface',
  Pending:      'bg-amber-50 text-amber-700',
  New:          'bg-blue-50 text-blue-700',
  Contacted:    'bg-surface-container-high text-on-surface',
  'Site visit': 'bg-secondary-fixed/40 text-on-secondary-fixed-variant',
  Negotiation:  'bg-purple-50 text-purple-700',
  'Closed won': 'bg-emerald-50 text-emerald-700',
  'Closed lost':'bg-red-50 text-red-700',
};

// ── Avatar helpers ─────────────────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #904d00, #fe932c)',
  'linear-gradient(135deg, #047857, #10b981)',
  'linear-gradient(135deg, #1e40af, #3b82f6)',
  'linear-gradient(135deg, #6d28d9, #8b5cf6)',
  'linear-gradient(135deg, #be185d, #ec4899)',
  'linear-gradient(135deg, #0e7490, #06b6d4)',
];

function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ── Activity feed row ─────────────────────────────────────────────────────────
function ActivityRow({ item, isLast }: { item: ApiActivityItem; isLast: boolean }) {
  const isDeal = item.type === 'deal';
  const name = item.title ?? 'Unknown';
  const avatarGrad = getAvatarGradient(name);
  return (
    <div className="flex gap-3">
      {/* Timeline column */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-sm"
          style={{ background: isDeal ? 'linear-gradient(135deg, #904d00, #fe932c)' : 'linear-gradient(135deg, #047857, #10b981)' }}
        >
          {initials(name)}
        </div>
        {!isLast && <div className="w-px flex-1 mt-1 bg-outline-variant/20" />}
      </div>
      {/* Content */}
      <div className={`flex-1 min-w-0 pb-3 ${isLast ? '' : ''}`}>
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border transition-all hover:shadow-sm ${
            isDeal
              ? 'bg-surface-container-lowest border-outline-variant/10 hover:border-secondary/30'
              : 'bg-surface-container-lowest border-outline-variant/10 hover:border-emerald-500/30'
          }`}
          style={{ borderLeftWidth: '4px', borderLeftColor: isDeal ? 'var(--color-secondary)' : '#10b981' }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold text-on-surface truncate max-w-[200px]">{item.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${BADGE[item.badge] ?? 'bg-surface-container text-on-surface-variant'}`}>{item.badge}</span>
              </div>
              <span className="text-xs text-on-surface-variant shrink-0">{timeAgo(item.created_at)}</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5 truncate">
              {isDeal
                ? `${item.sub}${item.agent_name ? ` · ${item.agent_name}` : ''}${item.amount ? ` · ${fmtPKR(parseFloat(item.amount))}` : ''}`
                : `${item.sub}${item.property ? ` · ${item.property}` : ''}${item.phone ? ` · ${item.phone}` : ''}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActiveDealRow({ deal }: { deal: ApiActiveDeal }) {
  const isConfirmed = deal.deal_status === 'confirmed';
  return (
    <div
      className={`flex items-start justify-between p-3 rounded-xl transition-colors ${
        isConfirmed
          ? 'border-l-4 border-secondary bg-gradient-to-r from-secondary/8 to-transparent'
          : 'border-l-4 border-amber-500 bg-gradient-to-r from-amber-500/8 to-transparent'
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-on-surface truncate">{deal.property ?? 'Unnamed Property'}</p>
        <p className="text-xs text-on-surface-variant mt-0.5">{deal.agent_name ?? '—'} · {deal.deal_type === 'sale' ? 'Sale' : 'Rent'} · <span className="font-medium text-on-surface">{fmtPKR(parseFloat(deal.amount))}</span></p>
      </div>
      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ml-2 capitalize ${isConfirmed ? 'bg-secondary/15 text-secondary' : 'bg-amber-100 text-amber-700'}`}>
        {deal.deal_status}
      </span>
    </div>
  );
}

// ── Area chart component ───────────────────────────────────────────────────────
function LeadsAreaChart({ data, loading }: { data: ApiMonthStat[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-52 mt-4">
        <Loader2 size={22} className="animate-spin text-secondary" />
      </div>
    );
  }
  if (!data.length) return null;

  const counts   = data.map(m => m.count);
  const total    = counts.reduce((s, c) => s + c, 0);
  const peakIdx  = counts.indexOf(Math.max(...counts));
  const peakCount = counts[peakIdx] ?? 0;
  const { line, area, pts } = buildAreaPath(counts);

  const step = data.length > 15 ? 5 : data.length > 8 ? 3 : 1;
  const shortLabel = (lbl: string) => lbl.length > 6 ? lbl.slice(0, 6) : lbl;

  return (
    <>
      <div className="relative w-full mt-4" style={{ height: '200px' }}>
        <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 600 200">
          <defs>
            <linearGradient id="areaGradLeads" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[50, 100, 150].map(y => (
            <line key={y} stroke="var(--color-outline-variant)" strokeDasharray="3 3" strokeOpacity="0.4" x1="0" x2="600" y1={y} y2={y} />
          ))}
          <line stroke="var(--color-outline-variant)" strokeOpacity="0.3" x1="0" x2="600" y1="186" y2="186" />
          <path d={area} fill="url(#areaGradLeads)" />
          <path d={line} style={{ stroke: 'var(--color-secondary)' }} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {peakCount > 0 && pts[peakIdx] && (
            <>
              <line style={{ stroke: 'var(--color-secondary)' }} strokeDasharray="2 3" opacity="0.5"
                x1={pts[peakIdx].x.toFixed(1)} x2={pts[peakIdx].x.toFixed(1)} y1="0" y2="186" />
              <circle cx={pts[peakIdx].x.toFixed(1)} cy={pts[peakIdx].y.toFixed(1)}
                r="5" fill="var(--color-secondary)" stroke="#fff" strokeWidth="2" />
            </>
          )}
        </svg>
        {peakCount > 0 && (
          <div className="absolute top-2 right-2 bg-surface-container border border-secondary/20 px-3 py-1.5 rounded-xl shadow-lg pointer-events-none">
            <p className="text-[11px] font-semibold text-on-surface-variant">{data[peakIdx]?.label} peak</p>
            <p className="text-sm font-bold text-secondary">{peakCount} inquiries</p>
          </div>
        )}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-[10px] text-on-surface-variant px-0.5 pt-1 overflow-hidden">
        {data.map((m, i) => (
          <span
            key={m.month}
            className={`${i % step !== 0 ? 'invisible' : ''} ${i === peakIdx && peakCount > 0 ? 'font-semibold text-on-surface' : ''}`}
          >
            {shortLabel(m.label)}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 bg-surface-container-low px-4 py-2.5 rounded-xl">
        <span className="text-xs text-on-surface-variant">Period total: <strong className="text-on-surface">{total}</strong></span>
        <span className="text-xs text-on-surface-variant">Peak: <strong className="text-on-surface">{peakCount > 0 ? `${peakCount} (${data[peakIdx]?.label})` : '—'}</strong></span>
        <span className="text-xs text-on-surface-variant">Avg/period: <strong className="text-on-surface">{data.length > 0 ? (total / data.length).toFixed(1) : '0'}</strong></span>
      </div>
    </>
  );
}

// ── Bar chart component ────────────────────────────────────────────────────────
function DealsBarChart({ data, loading, closedVol, completedDeals, confirmedDeals, pendingDeals }: {
  data: ApiMonthStat[];
  loading: boolean;
  closedVol: number;
  completedDeals: number;
  confirmedDeals: number;
  pendingDeals: number;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-52 mt-4">
        <Loader2 size={22} className="animate-spin text-secondary" />
      </div>
    );
  }
  if (!data.length) return null;

  const counts  = data.map(m => m.count);
  const maxC    = Math.max(...counts, 1);
  const BAR_H   = 144;
  const total   = counts.reduce((s, c) => s + c, 0);

  const step = data.length > 20 ? 7 : data.length > 10 ? 3 : 1;
  const shortLabel = (lbl: string) => data.length > 15 ? lbl.slice(0, 2) : lbl.length > 6 ? lbl.slice(0, 6) : lbl;

  return (
    <>
      <div className="flex items-end justify-between gap-0.5 mt-5 px-0.5" style={{ height: `${BAR_H + 28}px` }}>
        {data.map((m, i) => {
          const h       = maxC > 0 ? Math.max(m.count > 0 ? 10 : 3, Math.round((m.count / maxC) * BAR_H)) : 3;
          const isActive = m.count > 0 && m.count === maxC;
          return (
            <div key={m.month} className="flex flex-col items-center gap-1 flex-1 group min-w-0">
              {m.count > 0 && (
                <span className={`text-[10px] font-semibold transition-opacity leading-none ${isActive ? 'text-secondary opacity-100' : 'text-on-surface-variant opacity-0 group-hover:opacity-100'}`}>
                  {m.count}
                </span>
              )}
              <div
                title={`${m.label}: ${m.count} deals`}
                className={`w-full rounded-t transition-all cursor-pointer ${
                  m.count === 0 ? 'bg-surface-container-low' : ''
                }`}
                style={{
                  height: `${h}px`,
                  background: m.count > 0
                    ? isActive
                      ? 'linear-gradient(180deg, var(--color-secondary), var(--color-secondary-container))'
                      : 'linear-gradient(180deg, var(--color-secondary-container), var(--color-secondary-container))'
                    : undefined,
                  opacity: m.count > 0 && !isActive ? 0.55 : undefined,
                }}
              />
              <span className={`text-center leading-tight max-w-full truncate ${data.length > 20 ? 'text-[8px]' : 'text-[10px]'} ${isActive ? 'font-semibold text-on-surface' : 'text-on-surface-variant'} ${i % step !== 0 ? 'invisible' : ''}`}>
                {shortLabel(m.label)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 bg-surface-container-low px-4 py-2.5 rounded-xl">
        <span className="text-xs text-on-surface-variant">Period deals: <strong className="text-on-surface">{total}</strong></span>
        <span className="text-xs text-on-surface-variant">Completed: <strong className="text-on-surface">{completedDeals}</strong></span>
        <span className="text-xs text-on-surface-variant">Volume: <strong className="text-on-surface">{fmtPKR(closedVol)}</strong></span>
      </div>
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats,       setStats]       = useState<ApiStats | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [feedFilter,  setFeedFilter]  = useState<'all' | 'deal' | 'lead'>('all');

  // Per-chart filter state + data
  const [leadRange,   setLeadRange]   = useState<Range>('6m');
  const [dealRange,   setDealRange]   = useState<Range>('6m');
  const [leadData,    setLeadData]    = useState<ApiMonthStat[]>([]);
  const [dealData,    setDealData]    = useState<ApiMonthStat[]>([]);
  const [leadLoading, setLeadLoading] = useState(false);
  const [dealLoading, setDealLoading] = useState(false);

  // Initial full stats load
  useEffect(() => {
    statsApi.get()
      .then(res => {
        setStats(res.data);
        setLeadData(res.data.leads_by_month);
        setDealData(res.data.deals_by_month);
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const fetchLeadChart = useCallback(async (range: Range) => {
    setLeadLoading(true);
    try {
      const res = await statsApi.charts(range);
      setLeadData(res.data.leads_by_month);
    } catch { /* keep existing */ } finally {
      setLeadLoading(false);
    }
  }, []);

  const fetchDealChart = useCallback(async (range: Range) => {
    setDealLoading(true);
    try {
      const res = await statsApi.charts(range);
      setDealData(res.data.deals_by_month);
    } catch { /* keep existing */ } finally {
      setDealLoading(false);
    }
  }, []);

  function handleLeadRange(r: Range) {
    setLeadRange(r);
    fetchLeadChart(r);
  }

  function handleDealRange(r: Range) {
    setDealRange(r);
    fetchDealChart(r);
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const portfolioVal  = parseFloat(stats?.portfolio_value   ?? '0');
  const closedVol     = parseFloat(stats?.closed_volume     ?? '0');
  const commissionVal = parseFloat(stats?.commission_earned ?? '0');
  const topCitiesStr  = stats ? Object.keys(stats.top_cities).join(' · ') : '—';
  const newLeads      = stats?.leads_by_status?.new       ?? 0;
  const inProgress    = (stats?.leads_by_status?.contacted  ?? 0)
                      + (stats?.leads_by_status?.site_visit  ?? 0)
                      + (stats?.leads_by_status?.negotiation  ?? 0);

  const kpiCards = [
    {
      label: 'Total Properties',
      value: `${stats?.total_properties ?? 0}`,
      sub:   `${stats?.properties_count ?? 0} available · ${fmtPKR(portfolioVal)} portfolio`,
      trend: `${stats?.completed_deals ?? 0} deals closed`,
      icon:  Building,
      gradient: 'linear-gradient(135deg, #904d00, #fe932c)',
    },
    {
      label: 'Active Leads',
      value: `${stats?.total_leads ?? 0}`,
      sub:   `${newLeads} new · ${inProgress} in progress`,
      trend: `${stats?.leads_by_status?.closed_won ?? 0} won`,
      icon:  UserPlus,
      gradient: 'linear-gradient(135deg, #047857, #10b981)',
    },
    {
      label: 'Advisory Agents',
      value: `${stats?.agents_count ?? 0}`,
      sub:   topCitiesStr,
      trend: `${stats?.total_clients ?? 0} clients`,
      icon:  Users,
      gradient: 'linear-gradient(135deg, #1e40af, #3b82f6)',
    },
    {
      label: 'Closed Volume',
      value: fmtPKR(closedVol),
      sub:   `${fmtPKR(commissionVal)} commission earned`,
      trend: `${stats?.completed_deals ?? 0} completed deals`,
      icon:  DollarSign,
      gradient: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
    },
  ];

  const filteredActivity = (stats?.recent_activity ?? []).filter(
    a => feedFilter === 'all' || a.type === feedFilter
  );

  // Today's date for hero
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex flex-col gap-8">

      {/* ── Hero Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-7 border border-outline-variant/15 shadow-sm"
        style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-secondary-container) 60%, transparent), var(--color-surface-container), var(--color-surface-container-lowest))' }}
      >
        {/* Decorative blurred orb */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none" style={{ background: 'var(--color-secondary)', opacity: 0.08, filter: 'blur(64px)' }} />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'var(--color-secondary)', opacity: 0.04, filter: 'blur(48px)' }} />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: title + date */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-widest uppercase text-on-surface-variant/60">Operations Overview</span>
              {/* Live indicator pill */}
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <h1 className="font-display text-3xl lg:text-4xl font-bold text-on-surface tracking-tight leading-tight">
              Admin Dashboard
            </h1>
            <p className="text-sm text-on-surface-variant">{todayStr}</p>
          </div>

          {/* Right: mini-stats + CTA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Inline mini-stats */}
            <div className="flex items-center gap-1 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest/60 backdrop-blur-sm divide-x divide-outline-variant/15 overflow-hidden shadow-sm">
              <div className="px-4 py-2.5 text-center">
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">Properties</p>
                <p className="text-lg font-bold text-on-surface font-display leading-tight">
                  {loading ? <span className="w-8 h-5 bg-surface-container rounded animate-pulse inline-block" /> : stats?.total_properties ?? 0}
                </p>
              </div>
              <div className="px-4 py-2.5 text-center">
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">Active Leads</p>
                <p className="text-lg font-bold text-on-surface font-display leading-tight">
                  {loading ? <span className="w-8 h-5 bg-surface-container rounded animate-pulse inline-block" /> : stats?.total_leads ?? 0}
                </p>
              </div>
              <div className="px-4 py-2.5 text-center">
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">Commission</p>
                <p className="text-lg font-bold text-secondary font-display leading-tight">
                  {loading ? <span className="w-12 h-5 bg-surface-container rounded animate-pulse inline-block" /> : fmtPKR(commissionVal)}
                </p>
              </div>
            </div>

            {/* New Property CTA */}
            <Link
              href="/admin/properties/new"
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold text-on-secondary shadow-lg hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] transition-all shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--color-secondary), color-mix(in srgb, var(--color-secondary) 80%, #fe932c))' }}
            >
              <Plus size={17} />
              New Property
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpiCards.map((card) => (
          <Link
            key={card.label}
            href={kpiHrefs[card.label] ?? '#'}
            className="relative overflow-hidden flex flex-col justify-between p-5 rounded-2xl text-white hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
            style={{ background: card.gradient }}
          >
            {/* Decorative orb */}
            <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -top-8 -left-8 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

            {/* Top row: icon + arrow */}
            <div className="flex items-start justify-between relative">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-sm">
                <card.icon size={20} className="text-white" />
              </div>
              <ArrowUpRight size={15} className="text-white/40 group-hover:text-white/80 transition-colors" />
            </div>

            {/* Value + label */}
            <div className="mt-5 relative">
              {loading ? (
                <div className="w-24 h-9 bg-white/20 rounded-xl animate-pulse mb-1" />
              ) : (
                <span className="font-display text-4xl font-bold text-white tracking-tight leading-none">{card.value}</span>
              )}
              <p className="text-white/70 text-sm font-medium mt-1.5">{card.label}</p>
              {!loading && <p className="text-white/50 text-xs mt-0.5 truncate">{card.sub}</p>}
            </div>

            {/* Trend badge */}
            <div className="mt-4 pt-3 border-t border-white/15 relative">
              <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                <TrendingUp size={11} />
                {loading ? '…' : card.trend}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Area chart — Leads inquiry flow */}
        <div className="xl:col-span-7 p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 shadow-sm border-t-2 flex flex-col" style={{ borderTopColor: 'var(--color-secondary)' }}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-on-surface">Lead Inquiry Flow</h2>
                {!loading && leadData.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary/10 text-secondary">
                    {leadData.reduce((s, m) => s + m.count, 0)} total
                  </span>
                )}
              </div>
              <span className="text-xs text-on-surface-variant">Monthly inquiry volume over time</span>
            </div>
            <RangeFilter value={leadRange} onChange={handleLeadRange} loading={leadLoading} />
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-on-surface">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-secondary)' }} />
              <span>Inquiries</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
              <span>Won</span>
            </div>
          </div>
          <LeadsAreaChart data={leadData} loading={loading || leadLoading} />
        </div>

        {/* Bar chart — Deals */}
        <div className="xl:col-span-5 p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 shadow-sm border-t-2 border-t-blue-500 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-on-surface">Deals Per Period</h2>
                {!loading && dealData.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600">
                    {dealData.reduce((s, m) => s + m.count, 0)} total
                  </span>
                )}
              </div>
              <span className="text-xs text-on-surface-variant">Total deal count over time</span>
            </div>
            <RangeFilter value={dealRange} onChange={handleDealRange} loading={dealLoading} />
          </div>
          <DealsBarChart
            data={dealData}
            loading={loading || dealLoading}
            closedVol={closedVol}
            completedDeals={stats?.completed_deals ?? 0}
            confirmedDeals={stats?.confirmed_deals ?? 0}
            pendingDeals={stats?.pending_deals ?? 0}
          />
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Activity Feed */}
        <div className="xl:col-span-8 p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-on-surface">Recent Activity</h2>
              <span className="text-xs text-on-surface-variant">Latest leads and deal movements</span>
            </div>
            <Link href="/admin/leads" className="text-xs text-secondary hover:text-on-surface flex items-center gap-0.5 transition-colors font-medium">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex gap-2">
            {(['all', 'deal', 'lead'] as const).map(f => (
              <button key={f} onClick={() => setFeedFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors capitalize ${feedFilter === f ? 'bg-secondary text-on-secondary shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'}`}>
                {f === 'all' ? 'All' : f === 'deal' ? 'Deals' : 'Leads'}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-secondary" />
            </div>
          ) : filteredActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Building2 size={28} className="text-on-surface-variant/30" />
              <p className="text-sm text-on-surface-variant">No recent activity.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredActivity.map((item, idx) => (
                <ActivityRow key={`${item.type}-${item.id}`} item={item} isLast={idx === filteredActivity.length - 1} />
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="xl:col-span-4 flex flex-col gap-6">

          {/* Top Agents Leaderboard */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-on-surface">Top Agents</h2>
              <Link href="/admin/agents" className="text-xs text-secondary hover:underline flex items-center gap-0.5">
                View All <ArrowUpRight size={12} />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-surface-container-low rounded-xl animate-pulse" />)}</div>
            ) : (stats?.featured_agents ?? []).length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-4">No agents yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {stats!.featured_agents.map((agent, idx) => {
                  const vol    = parseFloat(agent.total_volume ?? '0');
                  const maxVol = parseFloat(stats!.featured_agents[0]?.total_volume ?? '1');
                  const pct    = maxVol > 0 ? Math.round((vol / maxVol) * 100) : 0;
                  const name   = agent.user?.full_name ?? 'Agent';
                  const rankBg = idx === 0
                    ? 'bg-secondary text-on-secondary'
                    : idx === 1
                    ? 'bg-surface-container-high text-on-surface'
                    : 'bg-surface-container text-on-surface-variant';
                  return (
                    <div key={agent.id} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Rank badge */}
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${rankBg}`}>
                            {idx + 1}
                          </span>
                          {/* Avatar with gradient */}
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-sm"
                            style={{ background: getAvatarGradient(name) }}
                          >
                            {initials(name)}
                          </div>
                          <span className="text-sm font-semibold text-on-surface truncate">{name}</span>
                        </div>
                        <span className="text-xs font-bold text-secondary shrink-0">{vol > 0 ? fmtPKR(vol) : '—'}</span>
                      </div>
                      {/* Gradient progress bar */}
                      <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden ml-7">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: 'linear-gradient(90deg, var(--color-secondary), var(--color-secondary-container))',
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-on-surface-variant ml-7">{agent.properties_count ?? 0} listings · {agent.closed_deals_count ?? 0} closed</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Deals */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-on-surface">Active Deals</h2>
              <Link href="/admin/deals" className="text-xs text-secondary hover:underline flex items-center gap-0.5">
                View all <ArrowUpRight size={12} />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-surface-container-low rounded-xl animate-pulse" />)}</div>
            ) : (stats?.active_deals ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <Handshake size={24} className="text-on-surface-variant/30" />
                <p className="text-xs text-on-surface-variant">No active deals right now.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {stats!.active_deals.map(deal => <ActiveDealRow key={deal.id} deal={deal} />)}
              </div>
            )}
            <Link href="/admin/deals"
              className="w-full py-2.5 rounded-xl bg-surface-container text-on-surface text-xs font-semibold text-center hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5">
              <RefreshCw size={12} /> View All Deals
            </Link>
          </div>
        </div>
      </div>

      {/* ── Snapshot strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Clients',
            value: loading ? '—' : String(stats?.total_clients ?? 0),
            icon: Users,
            href: '/admin/clients',
            iconGrad: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            trend: '+',
          },
          {
            label: 'New Leads',
            value: loading ? '—' : String(newLeads),
            icon: UserPlus,
            href: '/admin/leads',
            iconGrad: 'linear-gradient(135deg, #047857, #10b981)',
            trend: '+',
          },
          {
            label: 'Confirmed Deals',
            value: loading ? '—' : String(stats?.confirmed_deals ?? 0),
            icon: Handshake,
            href: '/admin/deals',
            iconGrad: 'linear-gradient(135deg, #904d00, #fe932c)',
            trend: '+',
          },
          {
            label: 'Commission',
            value: loading ? '—' : fmtPKR(commissionVal),
            icon: DollarSign,
            href: '/admin/deals',
            iconGrad: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
            trend: '+',
          },
        ].map(item => (
          <Link
            key={item.label}
            href={item.href}
            className="p-4 rounded-2xl border border-outline-variant/15 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3 group"
            style={{ background: 'linear-gradient(135deg, var(--color-surface-container), var(--color-surface-container-lowest))' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ background: item.iconGrad }}
            >
              <item.icon size={17} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-on-surface-variant">{item.label}</p>
              <p className="text-base font-bold text-on-surface font-display leading-snug">{item.value}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <ArrowUpRight size={13} className="text-outline opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{item.trend}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
