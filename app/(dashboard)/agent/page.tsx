'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Home, PlusCircle, FileEdit, Star, GitBranch, Handshake,
  TrendingUp, Download, Users, ChevronRight, ArrowUpRight,
  Building2, Eye, CheckCircle2, Clock, XCircle, Loader2,
  BarChart3, MapPin,
} from 'lucide-react';
import { propertiesApi, leadsApi, dealsApi } from '@/lib/api';
import { ApiProperty, ApiLead, ApiDeal } from '@/lib/api-types';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/components/PropertyCard';

// ── Helpers ────────────────────────────────────────────────────────────────────

function Sk({ w = 'w-16', h = 'h-5', cls = '' }: { w?: string; h?: string; cls?: string }) {
  return <span className={`inline-block ${w} ${h} bg-white/20 rounded-lg animate-pulse ${cls}`} />;
}

function SkLight({ w = 'w-16', h = 'h-5', cls = '' }: { w?: string; h?: string; cls?: string }) {
  return <span className={`inline-block ${w} ${h} bg-surface-container-high rounded-lg animate-pulse ${cls}`} />;
}

function formatPKR(n: number): string {
  if (n >= 1_000_000_000) return `PKR ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 10_000_000)    return `PKR ${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)       return `PKR ${(n / 100_000).toFixed(2)} L`;
  if (n >= 1_000)         return `PKR ${(n / 1_000).toFixed(0)}K`;
  return `PKR ${n.toLocaleString()}`;
}

const propertyStatusStyle: Record<string, { bg: string; text: string; dot: string }> = {
  available: { bg: 'bg-emerald-50',               text: 'text-emerald-700',                dot: 'bg-emerald-500' },
  draft:     { bg: 'bg-surface-container',          text: 'text-on-surface-variant',         dot: 'bg-outline' },
  reserved:  { bg: 'bg-surface-container-high',     text: 'text-on-surface',                 dot: 'bg-secondary' },
  sold:      { bg: 'bg-surface-container-highest',  text: 'text-primary-container',          dot: 'bg-primary-container' },
  rented:    { bg: 'bg-secondary-fixed/40',          text: 'text-on-secondary-fixed-variant', dot: 'bg-secondary-container' },
};

const STATUS_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'reserved',  label: 'Reserved' },
  { key: 'sold',      label: 'Sold' },
  { key: 'rented',    label: 'Rented' },
  { key: 'draft',     label: 'Draft' },
] as const;

type StatusTabKey = typeof STATUS_TABS[number]['key'];

const pipelineConfig: { key: ApiLead['status']; label: string; grad: string; lightText: string }[] = [
  { key: 'new',         label: 'New Inquiry',  grad: 'linear-gradient(90deg, #1e40af, #3b82f6)', lightText: 'text-blue-600' },
  { key: 'contacted',   label: 'Contacted',    grad: 'linear-gradient(90deg, #904d00, #fe932c)', lightText: 'text-secondary' },
  { key: 'site_visit',  label: 'Site Visit',   grad: 'linear-gradient(90deg, #0e7490, #06b6d4)', lightText: 'text-on-tertiary-container' },
  { key: 'negotiation', label: 'Negotiation',  grad: 'linear-gradient(90deg, #6d28d9, #8b5cf6)', lightText: 'text-purple-600' },
  { key: 'closed_won',  label: 'Won',          grad: 'linear-gradient(90deg, #047857, #10b981)', lightText: 'text-emerald-700' },
];

// ── Dashboard component ────────────────────────────────────────────────────────

export default function AgentDashboard() {
  const { user } = useAuth();

  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [leads, setLeads]           = useState<ApiLead[]>([]);
  const [deals, setDeals]           = useState<ApiDeal[]>([]);
  const [totalProperties, setTotalProperties] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalDeals, setTotalDeals] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [exporting, setExporting]   = useState(false);
  const [activeTab, setActiveTab]   = useState<StatusTabKey>('all');

  const load = useCallback(async (agentId: string) => {
    setLoading(true);
    try {
      const [propsRes, leadsRes, dealsRes] = await Promise.all([
        propertiesApi.list({ per_page: 100, agent_id: agentId }),
        leadsApi.list({ per_page: 100 }),
        dealsApi.list({ per_page: 50 }),
      ]);
      setProperties(propsRes.data);
      setTotalProperties(propsRes.meta.total);
      setLeads(leadsRes.data);
      setTotalLeads(leadsRes.meta.total);
      setDeals(dealsRes.data);
      setTotalDeals(dealsRes.meta.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.agent?.id) return;
    load(user.agent.id);
  }, [user?.agent?.id, load]);

  // ── Derived stats ────────────────────────────────────────────────────────────
  const availableCount  = properties.filter((p) => p.status === 'available').length;
  const reservedCount   = properties.filter((p) => p.status === 'reserved').length;
  const soldCount       = properties.filter((p) => p.status === 'sold').length;
  const rentedCount     = properties.filter((p) => p.status === 'rented').length;
  const draftCount      = properties.filter((p) => p.status === 'draft').length;
  const totalViews      = properties.reduce((s, p) => s + (p.views_count ?? 0), 0);
  const newLeads        = leads.filter((l) => l.status === 'new').length;
  const wonLeads        = leads.filter((l) => l.status === 'closed_won').length;
  const completedDeals  = deals.filter((d) => d.deal_status === 'completed').length;
  const pendingDeals    = deals.filter((d) => d.deal_status === 'pending').length;
  const commission      = deals
    .filter((d) => d.deal_status === 'completed')
    .reduce((s, d) => s + parseFloat(d.commission_amount ?? '0'), 0);
  const paidDeals = deals.filter((d) => d.payment_status === 'paid').length;

  const stageCounts = pipelineConfig.map((s) => ({
    ...s,
    count: leads.filter((l) => l.status === s.key).length,
  }));

  const tabCounts: Record<StatusTabKey, number> = {
    all:       totalProperties,
    available: availableCount,
    reserved:  reservedCount,
    sold:      soldCount,
    rented:    rentedCount,
    draft:     draftCount,
  };

  const filteredProperties = activeTab === 'all'
    ? properties
    : properties.filter((p) => p.status === activeTab);

  const approvalStatus = user?.agent?.approval_status ?? 'pending';
  const isApproved     = approvalStatus === 'approved';
  const firstName      = user?.full_name?.split(' ')[0] ?? 'Advisor';
  const todayStr       = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  function exportCSV() {
    setExporting(true);
    try {
      type Row = Record<string, string | number | boolean | null | undefined>;
      const rows: Row[] = properties.map((p) => ({
        id: p.id, title: p.title, type: p.type, purpose: p.purpose,
        price: p.price, city: p.city, status: p.status,
        bedrooms: p.bedrooms, bathrooms: p.bathrooms,
        area_size: p.area_size, area_unit: p.area_unit,
        views: p.views_count, inquiries: p.inquiries_count,
      }));
      if (!rows.length) return;
      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(','),
        ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), { href: url, download: `properties-${new Date().toISOString().slice(0, 10)}.csv` });
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  // ── KPI cards ────────────────────────────────────────────────────────────────
  const kpis = [
    {
      label:   'My Listings',
      value:   totalProperties,
      sub:     `${availableCount} available · ${totalViews.toLocaleString()} views`,
      trend:   `${draftCount} drafts`,
      icon:    Home,
      grad:    'linear-gradient(135deg, #904d00 0%, #c86a00 50%, #f59b2b 100%)',
      href:    '/agent/properties',
    },
    {
      label:   'Lead Pipeline',
      value:   totalLeads,
      sub:     `${newLeads} new · ${wonLeads} won`,
      trend:   `${leads.filter(l => l.status === 'negotiation').length} in negotiation`,
      icon:    GitBranch,
      grad:    'linear-gradient(135deg, #047857 0%, #059669 50%, #34d399 100%)',
      href:    '/agent/leads',
    },
    {
      label:   'My Deals',
      value:   totalDeals,
      sub:     `${completedDeals} closed · ${pendingDeals} pending`,
      trend:   `${paidDeals} paid out`,
      icon:    Handshake,
      grad:    'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #60a5fa 100%)',
      href:    '/agent/deals',
    },
    {
      label:   'Commission',
      value:   commission > 0 ? formatPKR(commission) : '—',
      sub:     'Earned from completed deals',
      trend:   `${paidDeals} deals paid`,
      icon:    TrendingUp,
      grad:    'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a78bfa 100%)',
      href:    '/agent/deals',
      isStr:   true,
    },
  ];

  return (
    <div className="flex flex-col gap-8">

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-7 border border-outline-variant/15 shadow-sm"
        style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-secondary-container) 60%, transparent), var(--color-surface-container), var(--color-surface-container-lowest))' }}
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none" style={{ background: 'var(--color-secondary)', opacity: 0.08, filter: 'blur(64px)' }} />
        <div className="absolute bottom-0 left-1/4 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'var(--color-secondary)', opacity: 0.04, filter: 'blur(48px)' }} />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-widest uppercase text-on-surface-variant/60">Agent Portal</span>
              <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${isApproved ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/15 text-amber-600 border-amber-500/20'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isApproved ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {isApproved ? 'Active' : approvalStatus}
              </span>
            </div>
            <h1 className="font-display text-3xl lg:text-4xl font-bold text-on-surface tracking-tight leading-tight">
              Welcome back,{' '}
              {loading
                ? <span className="inline-block w-32 h-9 bg-surface-container rounded-xl animate-pulse align-middle ml-1" />
                : firstName}
            </h1>
            <p className="text-sm text-on-surface-variant">{todayStr}</p>
          </div>

          {/* Right: mini-stats + actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-1 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest/60 backdrop-blur-sm divide-x divide-outline-variant/15 overflow-hidden shadow-sm">
              <div className="px-4 py-2.5 text-center">
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">Listings</p>
                <p className="text-lg font-bold text-on-surface font-display leading-tight">
                  {loading ? <span className="inline-block w-8 h-5 bg-surface-container rounded animate-pulse" /> : totalProperties}
                </p>
              </div>
              <div className="px-4 py-2.5 text-center">
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">Leads</p>
                <p className="text-lg font-bold text-on-surface font-display leading-tight">
                  {loading ? <span className="inline-block w-8 h-5 bg-surface-container rounded animate-pulse" /> : totalLeads}
                </p>
              </div>
              <div className="px-4 py-2.5 text-center">
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">Commission</p>
                <p className="text-lg font-bold text-secondary font-display leading-tight">
                  {loading ? <span className="inline-block w-12 h-5 bg-surface-container rounded animate-pulse" /> : (commission > 0 ? formatPKR(commission) : '—')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportCSV}
                disabled={exporting || loading || properties.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-lowest/70 border border-outline-variant/25 text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low shadow-sm transition-all disabled:opacity-40"
              >
                {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                Export
              </button>
              <Link
                href="/agent/properties/new"
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold text-on-secondary shadow-lg hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] transition-all shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--color-secondary), color-mix(in srgb, var(--color-secondary) 80%, #fe932c))' }}
              >
                <PlusCircle size={16} />
                Add Property
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="relative overflow-hidden flex flex-col justify-between p-5 rounded-2xl text-white hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
            style={{ background: card.grad }}
          >
            <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -top-8 -left-8 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

            <div className="flex items-start justify-between relative">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-sm">
                <card.icon size={20} className="text-white" />
              </div>
              <ArrowUpRight size={15} className="text-white/40 group-hover:text-white/80 transition-colors" />
            </div>

            <div className="mt-5 relative">
              {loading ? (
                <div className="w-24 h-9 bg-white/20 rounded-xl animate-pulse mb-1" />
              ) : (
                <span className={`font-display font-bold text-white tracking-tight leading-none ${card.isStr ? 'text-2xl' : 'text-4xl'}`}>{card.value}</span>
              )}
              <p className="text-white/70 text-sm font-medium mt-1.5">{card.label}</p>
              {!loading && <p className="text-white/50 text-xs mt-0.5 truncate">{card.sub}</p>}
            </div>

            <div className="mt-4 pt-3 border-t border-white/15 relative">
              <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                <TrendingUp size={11} />
                {loading ? '…' : card.trend}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Pipeline + Quick Actions ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Pipeline card */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 shadow-sm border-t-[3px]" style={{ borderTopColor: 'var(--color-secondary)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-on-surface">Lead Pipeline</h2>
                {!loading && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary/10 text-secondary">
                    {totalLeads} leads
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">Active leads across all funnel stages</p>
            </div>
            <Link href="/agent/leads" className="text-xs text-secondary hover:text-on-surface flex items-center gap-0.5 transition-colors font-medium">
              Manage <ChevronRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkLight w="w-28" h="h-3.5" />
                  <div className="flex-1 h-3 bg-surface-container-high rounded-full animate-pulse" />
                  <SkLight w="w-5" h="h-3.5" />
                </div>
              ))}
            </div>
          ) : totalLeads === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center">
                <GitBranch size={24} className="text-on-surface-variant/50" />
              </div>
              <p className="text-sm text-on-surface-variant">No leads in pipeline yet</p>
              <Link href="/agent/leads/new" className="text-xs text-secondary font-semibold hover:underline">
                Add your first lead →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {stageCounts.map((stage) => {
                const pct = totalLeads > 0 ? (stage.count / totalLeads) * 100 : 0;
                return (
                  <div key={stage.key} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-on-surface-variant w-28 shrink-0">{stage.label}</span>
                    <div className="flex-1 h-3 rounded-full bg-surface-container-high overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(pct > 0 ? 4 : 0, pct)}%`, background: stage.grad }}
                      />
                    </div>
                    <span className={`text-xs font-bold w-7 text-right shrink-0 ${stage.lightText}`}>{stage.count}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Property status mini-grid */}
          {!loading && totalProperties > 0 && (
            <div className="mt-5 pt-4 border-t border-outline-variant/20 grid grid-cols-4 gap-2">
              {[
                { label: 'Available', count: availableCount, cls: 'text-emerald-700', dot: 'bg-emerald-500', bg: 'bg-emerald-50' },
                { label: 'Reserved',  count: reservedCount,  cls: 'text-secondary',   dot: 'bg-secondary',  bg: 'bg-secondary/10' },
                { label: 'Sold',      count: soldCount,      cls: 'text-blue-600',    dot: 'bg-blue-500',   bg: 'bg-blue-50' },
                { label: 'Rented',    count: rentedCount,    cls: 'text-purple-600',  dot: 'bg-purple-500', bg: 'bg-purple-50' },
              ].map((s) => (
                <div key={s.label} className={`flex flex-col items-center p-2.5 rounded-xl ${s.bg}`}>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{s.label}</span>
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    <span className={`text-lg font-bold font-display ${s.cls}`}>{s.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-5 flex flex-col gap-5">

          {/* Quick actions */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 shadow-sm">
            <h2 className="text-sm font-semibold text-on-surface mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-2">
              {[
                { href: '/agent/leads/new',      icon: GitBranch, label: 'Add Walk-in Lead',  desc: 'Log a new client enquiry',  grad: 'linear-gradient(135deg, #1e40af, #3b82f6)' },
                { href: '/agent/properties/new', icon: Building2, label: 'Upload Property',   desc: 'Add a new listing',          grad: 'linear-gradient(135deg, #904d00, #c86a00)' },
                { href: '/agent/clients',        icon: Users,     label: 'View Clients',      desc: 'Buyer & tenant roster',      grad: 'linear-gradient(135deg, #6d28d9, #8b5cf6)' },
                { href: '/agent/deals',          icon: Handshake, label: 'My Deals',          desc: 'Track your transactions',    grad: 'linear-gradient(135deg, #047857, #10b981)' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-outline-variant/10 hover:border-outline-variant/25 hover:bg-surface-container-low/50 transition-all group"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{ background: item.grad }}
                  >
                    <item.icon size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface leading-tight">{item.label}</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronRight size={14} className="text-outline opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Deal status strip */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-on-surface">Deal Status</h2>
                <BarChart3 size={14} className="text-on-surface-variant/50" />
              </div>
              <Link href="/agent/deals" className="text-xs text-secondary hover:underline font-medium">View all</Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-surface-container-low rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Pending',   count: pendingDeals,   icon: Clock,        grad: 'linear-gradient(135deg, #904d00, #fe932c)', bg: 'bg-secondary/10',   text: 'text-secondary' },
                  { label: 'Completed', count: completedDeals, icon: CheckCircle2, grad: 'linear-gradient(135deg, #047857, #10b981)', bg: 'bg-emerald-50',      text: 'text-emerald-700' },
                  { label: 'Paid Out',  count: paidDeals,      icon: TrendingUp,   grad: 'linear-gradient(135deg, #1e40af, #3b82f6)', bg: 'bg-blue-50',         text: 'text-blue-700' },
                ].map((s) => (
                  <div key={s.label} className={`flex flex-col items-center py-3 px-2 rounded-xl ${s.bg}`}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2 shadow-sm" style={{ background: s.grad }}>
                      <s.icon size={13} className="text-white" />
                    </div>
                    <span className={`text-xl font-bold font-display ${s.text}`}>{s.count}</span>
                    <span className="text-[10px] text-on-surface-variant text-center leading-tight mt-0.5">{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Listings ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/15 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/15">
          <div>
            <h2 className="text-base font-semibold text-on-surface">My Listings</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {loading ? <SkLight w="w-40" h="h-3" /> : `${totalProperties} properties in your portfolio`}
            </p>
          </div>
          <Link href="/agent/properties" className="text-xs text-secondary hover:text-on-surface flex items-center gap-0.5 transition-colors font-medium">
            View all <ChevronRight size={12} />
          </Link>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-outline-variant/10 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const count    = loading ? null : tabCounts[tab.key];
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-secondary text-on-secondary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                {tab.label}
                {count !== null && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-on-secondary/20 text-on-secondary' : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low/40 border-b border-outline-variant/15">
                {['Property', 'Type', 'Price', 'Location', 'Status', 'Views', ''].map((h) => (
                  <th key={h} className="text-left text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <SkLight w="w-9" h="h-9" cls="rounded-xl shrink-0" />
                        <div className="flex flex-col gap-1.5">
                          <SkLight w="w-36" h="h-3.5" />
                          <SkLight w="w-16" h="h-2.5" />
                        </div>
                      </div>
                    </td>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-3.5"><SkLight w="w-16" h="h-3" /></td>
                    ))}
                    <td className="px-5 py-3.5"><SkLight w="w-8" h="h-7" cls="rounded-lg" /></td>
                  </tr>
                ))
              ) : filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center">
                        <Home size={22} className="text-on-surface-variant/40" />
                      </div>
                      <p className="text-sm text-on-surface-variant">
                        {activeTab === 'all' ? 'No properties yet' : `No ${activeTab} properties`}
                      </p>
                      {activeTab === 'all' && (
                        <Link
                          href="/agent/properties/new"
                          className="flex items-center gap-2 bg-secondary text-on-secondary font-semibold px-4 py-2 rounded-xl text-sm shadow-sm"
                        >
                          <PlusCircle size={14} /> Upload Property
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProperties.slice(0, 8).map((p) => {
                  const s = propertyStatusStyle[p.status] ?? propertyStatusStyle.draft;
                  return (
                    <tr key={p.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-surface-container overflow-hidden shrink-0">
                            {p.images?.[0]
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center"><Home size={13} className="text-on-surface-variant" /></div>}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-on-surface line-clamp-1">{p.title}</p>
                              {p.is_featured && <Star size={10} className="text-secondary fill-secondary shrink-0" />}
                            </div>
                            <p className="text-xs text-on-surface-variant">{p.purpose === 'sale' ? 'For Sale' : 'For Rent'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-on-surface-variant capitalize">{p.type}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-secondary whitespace-nowrap">{formatPrice(p.price, p.purpose)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                          <MapPin size={11} />
                          {p.city}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${s.bg} ${s.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                          <Eye size={12} />
                          {p.views_count ?? 0}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/agent/properties/${p.id}/edit`}
                          className="p-1.5 text-on-surface-variant hover:text-secondary hover:bg-secondary-fixed/30 rounded-lg transition-colors inline-flex"
                        >
                          <FileEdit size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Deals section */}
        {!loading && deals.length > 0 && (
          <div className="px-6 py-5 border-t border-outline-variant/15">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-on-surface">Recent Deals</h3>
              <Link href="/agent/deals" className="text-xs text-secondary hover:underline font-medium">View all</Link>
            </div>
            <div className="flex flex-col gap-2.5">
              {deals.slice(0, 3).map((d) => (
                <Link
                  key={d.id}
                  href={`/agent/deals/${d.id}`}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant/10 hover:border-outline-variant/25 hover:bg-surface-container-low/30 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{ background: d.deal_status === 'completed' ? 'linear-gradient(135deg, #047857, #10b981)' : 'linear-gradient(135deg, #904d00, #fe932c)' }}
                    >
                      <Handshake size={14} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">{d.property?.title ?? 'Unnamed Property'}</p>
                      <p className="text-[11px] text-on-surface-variant">{d.client?.name ?? '—'} · {d.deal_type === 'sale' ? 'Sale' : 'Rent'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-secondary">
                      {d.commission_amount ? formatPKR(parseFloat(d.commission_amount)) : '—'}
                    </span>
                    {d.deal_status === 'completed'
                      ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">Completed</span>
                      : d.deal_status === 'pending'
                      ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">Pending</span>
                      : <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-semibold capitalize">{d.deal_status}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
