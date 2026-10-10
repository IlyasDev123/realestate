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

function ActivityRow({ item }: { item: ApiActivityItem }) {
  const isDeal = item.type === 'deal';
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-container-low/50 transition-colors">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isDeal ? 'bg-secondary-fixed/30' : 'bg-surface-container-high'}`}>
        {isDeal ? <Gavel size={15} className="text-secondary" /> : <UserPlus size={15} className="text-on-surface-variant" />}
      </div>
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
  );
}

function ActiveDealRow({ deal }: { deal: ApiActiveDeal }) {
  const isConfirmed = deal.deal_status === 'confirmed';
  return (
    <div className={`flex items-start justify-between p-2.5 rounded-lg hover:bg-surface-container-low transition-colors ${isConfirmed ? 'bg-secondary-fixed/10 border border-secondary/10' : 'bg-amber-50/50 border border-amber-200/40'}`}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-on-surface truncate">{deal.property ?? 'Unnamed Property'}</p>
        <p className="text-xs text-on-surface-variant mt-0.5">{deal.agent_name ?? '—'} · {deal.deal_type === 'sale' ? 'Sale' : 'Rent'} · {fmtPKR(parseFloat(deal.amount))}</p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ml-2 capitalize ${isConfirmed ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-amber-100 text-amber-700'}`}>
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

  // Thin labels: show every nth label so they don't overlap
  const step = data.length > 15 ? 5 : data.length > 8 ? 3 : 1;
  // Shorter labels for day-level data
  const shortLabel = (lbl: string) => lbl.length > 6 ? lbl.slice(0, 6) : lbl;

  return (
    <>
      <div className="relative w-full mt-4" style={{ height: '200px' }}>
        <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 600 200">
          <defs>
            <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#fe932c" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#fe932c" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[50, 100, 150].map(y => (
            <line key={y} stroke="#dce9ff" strokeDasharray="3 3" x1="0" x2="600" y1={y} y2={y} />
          ))}
          <line stroke="#e5eeff" x1="0" x2="600" y1="186" y2="186" />
          <path d={area} fill="url(#areaGrad)" />
          <path d={line} stroke="#fe932c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {peakCount > 0 && pts[peakIdx] && (
            <>
              <line stroke="#fe932c" strokeDasharray="2 3" opacity="0.5"
                x1={pts[peakIdx].x.toFixed(1)} x2={pts[peakIdx].x.toFixed(1)} y1="0" y2="186" />
              <circle cx={pts[peakIdx].x.toFixed(1)} cy={pts[peakIdx].y.toFixed(1)}
                r="5" fill="#fe932c" stroke="#fff" strokeWidth="2" />
            </>
          )}
        </svg>
        {peakCount > 0 && (
          <div className="absolute top-2 right-2 bg-primary-container text-on-primary px-3 py-1.5 rounded-lg shadow-lg pointer-events-none">
            <p className="text-[11px] font-semibold text-secondary-fixed/80">{data[peakIdx]?.label} peak</p>
            <p className="text-sm font-bold text-secondary-fixed">{peakCount} inquiries</p>
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

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 bg-surface-container-low px-4 py-2 rounded-lg">
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
  const BAR_H   = 144; // px max bar height
  const total   = counts.reduce((s, c) => s + c, 0);

  // Thin labels for dense data
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
                  isActive
                    ? 'bg-secondary shadow-sm hover:opacity-90'
                    : m.count > 0
                    ? 'bg-surface-container-highest hover:bg-secondary/50'
                    : 'bg-surface-container-low'
                }`}
                style={{ height: `${h}px` }}
              />
              <span className={`text-center leading-tight max-w-full truncate ${data.length > 20 ? 'text-[8px]' : 'text-[10px]'} ${isActive ? 'font-semibold text-on-surface' : 'text-on-surface-variant'} ${i % step !== 0 ? 'invisible' : ''}`}>
                {shortLabel(m.label)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 bg-surface-container-low px-4 py-2 rounded-lg">
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
    },
    {
      label: 'Active Leads',
      value: `${stats?.total_leads ?? 0}`,
      sub:   `${newLeads} new · ${inProgress} in progress`,
      trend: `${stats?.leads_by_status?.closed_won ?? 0} won`,
      icon:  UserPlus,
    },
    {
      label: 'Advisory Agents',
      value: `${stats?.agents_count ?? 0}`,
      sub:   topCitiesStr,
      trend: `${stats?.total_clients ?? 0} clients`,
      icon:  Users,
    },
    {
      label: 'Closed Volume',
      value: fmtPKR(closedVol),
      sub:   `${fmtPKR(commissionVal)} commission earned`,
      trend: `${stats?.completed_deals ?? 0} completed deals`,
      icon:  DollarSign,
    },
  ];

  const filteredActivity = (stats?.recent_activity ?? []).filter(
    a => feedFilter === 'all' || a.type === feedFilter
  );

  return (
    <div className="flex flex-col gap-8">

      {/* ── Page header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
            <span>Haven RMS</span>
            <span>/</span>
            <span className="text-secondary">Overview</span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-on-surface tracking-tight">Operations Overview</h1>
          <p className="text-sm text-on-surface-variant">Live portfolio, pipeline, and deal performance.</p>
        </div>
        <Link
          href="/admin/properties/new"
          className="flex items-center gap-2 bg-secondary text-on-secondary px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-95 active:scale-[0.98] transition-all shadow-md self-start lg:self-auto"
        >
          <Plus size={16} />
          New Property
        </Link>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpiCards.map((card, idx) => {
          const palettes = [
            { grad: 'from-secondary/8',          iconBg: 'bg-secondary/15',          iconTxt: 'text-secondary',        valueTxt: 'text-secondary',        trendBg: 'bg-secondary/8 text-secondary',        dot: 'bg-secondary' },
            { grad: 'from-emerald-500/8',         iconBg: 'bg-emerald-100',           iconTxt: 'text-emerald-600',      valueTxt: 'text-emerald-700',      trendBg: 'bg-emerald-50 text-emerald-700',        dot: 'bg-emerald-500' },
            { grad: 'from-primary-container/10',  iconBg: 'bg-primary-container/15',  iconTxt: 'text-primary-container',valueTxt: 'text-primary-container', trendBg: 'bg-primary-container/10 text-primary-container', dot: 'bg-primary-container' },
            { grad: 'from-amber-500/8',           iconBg: 'bg-amber-100',             iconTxt: 'text-amber-600',        valueTxt: 'text-amber-700',        trendBg: 'bg-amber-50 text-amber-700',            dot: 'bg-amber-500' },
          ];
          const p = palettes[idx];
          return (
            <Link
              key={card.label}
              href={kpiHrefs[card.label] ?? '#'}
              className={`relative overflow-hidden flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-br ${p.grad} via-surface-container-lowest to-surface-container-lowest border border-outline-variant/20 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group`}
            >
              {/* Decorative circle */}
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-outline-variant/10 to-transparent pointer-events-none" />

              <div className="flex items-start justify-between relative">
                <div className={`w-11 h-11 rounded-2xl ${p.iconBg} flex items-center justify-center shadow-sm`}>
                  <card.icon size={20} className={p.iconTxt} />
                </div>
                <ArrowUpRight size={15} className="text-on-surface-variant/30 group-hover:text-on-surface-variant/70 transition-opacity" />
              </div>

              <div className="mt-5 relative">
                {loading ? (
                  <div className="w-24 h-9 bg-surface-container rounded-xl animate-pulse mb-1" />
                ) : (
                  <span className={`font-display text-3xl font-bold tracking-tight ${p.valueTxt}`}>{card.value}</span>
                )}
                <p className="text-xs font-semibold text-on-surface-variant/70 mt-1 truncate">{card.label}</p>
                {!loading && <p className="text-xs text-on-surface-variant/50 mt-0.5 truncate">{card.sub}</p>}
              </div>

              <div className="mt-4 pt-3 border-t border-outline-variant/15 flex items-center justify-between relative">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${p.trendBg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                  <span>{loading ? '…' : card.trend}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Area chart — Leads inquiry flow */}
        <div className="xl:col-span-7 p-6 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-on-surface">Lead Inquiry Flow</h2>
              <span className="text-xs text-on-surface-variant">Monthly inquiry volume over time</span>
            </div>
            <RangeFilter value={leadRange} onChange={handleLeadRange} loading={leadLoading} />
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-on-surface">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
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
        <div className="xl:col-span-5 p-6 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-on-surface">Deals Per Period</h2>
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
        <div className="xl:col-span-8 p-6 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col gap-4">
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
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors capitalize ${feedFilter === f ? 'bg-primary-container text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'}`}>
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
            <div className="flex flex-col gap-1">
              {filteredActivity.map(item => (
                <ActivityRow key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="xl:col-span-4 flex flex-col gap-6">

          {/* Top Agents */}
          <div className="p-6 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-on-surface">Top Agents</h2>
              <Link href="/admin/agents" className="text-xs text-secondary hover:underline flex items-center gap-0.5">
                View All <ArrowUpRight size={12} />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-surface-container-low rounded-lg animate-pulse" />)}</div>
            ) : (stats?.featured_agents ?? []).length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-4">No agents yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {stats!.featured_agents.map(agent => {
                  const vol    = parseFloat(agent.total_volume ?? '0');
                  const maxVol = parseFloat(stats!.featured_agents[0]?.total_volume ?? '1');
                  const pct    = maxVol > 0 ? Math.round((vol / maxVol) * 100) : 0;
                  return (
                    <div key={agent.id} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-on-primary">{agent.user?.full_name?.charAt(0)?.toUpperCase() ?? '?'}</span>
                          </div>
                          <span className="text-sm font-medium text-on-surface truncate">{agent.user?.full_name ?? 'Agent'}</span>
                        </div>
                        <span className="text-xs font-semibold text-secondary shrink-0">{vol > 0 ? fmtPKR(vol) : '—'}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                        <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-on-surface-variant">{agent.properties_count ?? 0} listings · {agent.closed_deals_count ?? 0} closed</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Deals */}
          <div className="p-6 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-on-surface">Active Deals</h2>
              <Link href="/admin/deals" className="text-xs text-secondary hover:underline flex items-center gap-0.5">
                View all <ArrowUpRight size={12} />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-surface-container-low rounded-lg animate-pulse" />)}</div>
            ) : (stats?.active_deals ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <Handshake size={24} className="text-on-surface-variant/30" />
                <p className="text-xs text-on-surface-variant">No active deals right now.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {stats!.active_deals.map(deal => <ActiveDealRow key={deal.id} deal={deal} />)}
              </div>
            )}
            <Link href="/admin/deals"
              className="w-full py-2 rounded-lg bg-surface-container text-on-surface text-xs font-semibold text-center hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5">
              <RefreshCw size={12} /> View Deals
            </Link>
          </div>
        </div>
      </div>

      {/* ── Quick stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients',    value: loading ? '—' : String(stats?.total_clients ?? 0),  icon: Users,     href: '/admin/clients'  },
          { label: 'New Leads',        value: loading ? '—' : String(newLeads),                   icon: UserPlus,  href: '/admin/leads'    },
          { label: 'Confirmed Deals',  value: loading ? '—' : String(stats?.confirmed_deals ?? 0),icon: Handshake, href: '/admin/deals'    },
          { label: 'Commission',       value: loading ? '—' : fmtPKR(commissionVal),              icon: DollarSign,href: '/admin/deals'    },
        ].map(item => (
          <Link key={item.label} href={item.href}
            className="p-4 rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
              <item.icon size={16} className="text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-on-surface-variant">{item.label}</p>
              <p className="text-base font-bold text-on-surface font-display leading-snug">{item.value}</p>
            </div>
            <ChevronRight size={14} className="text-outline ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>
    </div>
  );
}
