'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Home, PlusCircle, FileEdit, Star, GitBranch, Handshake,
  TrendingUp, Download, Users, ChevronRight, ArrowUpRight,
  Building2, Eye, CheckCircle2, Clock, XCircle,
} from 'lucide-react';
import { propertiesApi, leadsApi, dealsApi } from '@/lib/api';
import { ApiProperty, ApiLead, ApiDeal } from '@/lib/api-types';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/components/PropertyCard';

// ── Helpers ────────────────────────────────────────────────────────────────────

function Sk({ w = 'w-16', h = 'h-5', cls = '' }: { w?: string; h?: string; cls?: string }) {
  return <span className={`inline-block ${w} ${h} bg-surface-container-high rounded-lg animate-pulse ${cls}`} />;
}

function formatPKR(n: number): string {
  if (n >= 10_000_000) return `PKR ${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `PKR ${(n / 100_000).toFixed(2)} L`;
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

const pipelineConfig: { key: ApiLead['status']; label: string; barCls: string; countCls: string }[] = [
  { key: 'new',         label: 'New',         barCls: 'bg-primary-container/50',    countCls: 'text-primary-container' },
  { key: 'contacted',   label: 'Contacted',   barCls: 'bg-secondary/70',            countCls: 'text-secondary' },
  { key: 'site_visit',  label: 'Site Visit',  barCls: 'bg-on-tertiary-container/60',countCls: 'text-on-tertiary-container' },
  { key: 'negotiation', label: 'Negotiation', barCls: 'bg-secondary-container',     countCls: 'text-on-secondary-fixed-variant' },
  { key: 'closed_won',  label: 'Won',         barCls: 'bg-emerald-400',             countCls: 'text-emerald-700' },
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
      label:    'My Listings',
      value:    totalProperties,
      sub:      `${availableCount} available`,
      footer:   `${totalViews.toLocaleString()} total views`,
      icon:     Home,
      iconBg:   'bg-primary-container/10',
      iconCls:  'text-primary-container',
      href:     '/agent/properties',
    },
    {
      label:    'Leads Pipeline',
      value:    totalLeads,
      sub:      `${newLeads} new`,
      footer:   `${wonLeads} won`,
      icon:     GitBranch,
      iconBg:   'bg-secondary-fixed/30',
      iconCls:  'text-on-secondary-fixed-variant',
      href:     '/agent/leads',
    },
    {
      label:    'My Deals',
      value:    totalDeals,
      sub:      `${completedDeals} closed`,
      footer:   `${pendingDeals} pending`,
      icon:     Handshake,
      iconBg:   'bg-emerald-50',
      iconCls:  'text-emerald-700',
      href:     '/agent/deals',
    },
    {
      label:    'Commission',
      value:    commission > 0 ? formatPKR(commission) : '—',
      sub:      'Earned YTD',
      footer:   `${paidDeals} deals paid`,
      icon:     TrendingUp,
      iconBg:   'bg-surface-container-high',
      iconCls:  'text-secondary',
      href:     '/agent/deals',
      isString: true,
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span className="font-semibold uppercase tracking-wider">RMS Enterprise</span>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider">Agent Dashboard</span>
        <div className={`flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-full ${isApproved ? 'bg-emerald-50' : 'bg-surface-container-high'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isApproved ? 'bg-emerald-500 animate-pulse' : 'bg-secondary'}`} />
          <span className={`text-xs font-semibold capitalize ${isApproved ? 'text-emerald-700' : 'text-on-surface'}`}>
            {approvalStatus}
          </span>
        </div>
      </div>

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-on-surface font-display">
            Welcome back,{' '}
            {loading ? <Sk w="w-32" h="h-8" cls="inline-block align-middle ml-1" /> : (user?.full_name?.split(' ')[0] ?? 'Advisor')}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {isApproved
              ? 'Your advisory account is active. Manage your listings, leads and deals below.'
              : `Account status: ${approvalStatus}. Some features may be restricted.`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportCSV}
            disabled={exporting || loading || properties.length === 0}
            className="px-4 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface text-sm font-medium shadow-sm hover:bg-surface-container-low border border-outline-variant/20 transition-all flex items-center gap-2 disabled:opacity-40"
          >
            {exporting
              ? <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
              : <Download size={15} className="text-on-surface-variant" />}
            Export CSV
          </button>
          <Link
            href="/agent/properties/new"
            className="px-4 py-2.5 rounded-lg bg-secondary text-on-secondary text-sm font-semibold shadow-md hover:opacity-95 transition-all flex items-center gap-2"
          >
            <PlusCircle size={15} />
            Add Property
          </Link>
        </div>
      </div>

      {/* ── KPI strip ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((card, idx) => {
          const palettes = [
            { grad: 'from-primary-container/10', iconBg: 'bg-primary-container/15', iconCls: 'text-primary-container', valCls: 'text-primary-container', tagBg: 'bg-primary-container/10 text-primary-container', dot: 'bg-primary-container' },
            { grad: 'from-secondary/8',          iconBg: 'bg-secondary/15',         iconCls: 'text-secondary',         valCls: 'text-secondary',         tagBg: 'bg-secondary/10 text-secondary',         dot: 'bg-secondary' },
            { grad: 'from-emerald-500/8',        iconBg: 'bg-emerald-100',          iconCls: 'text-emerald-600',       valCls: 'text-emerald-700',       tagBg: 'bg-emerald-50 text-emerald-700',          dot: 'bg-emerald-500' },
            { grad: 'from-amber-500/8',          iconBg: 'bg-amber-100',            iconCls: 'text-amber-600',         valCls: 'text-amber-700',         tagBg: 'bg-amber-50 text-amber-700',              dot: 'bg-amber-500' },
          ];
          const p = palettes[idx];
          return (
            <Link
              key={card.label}
              href={card.href}
              className={`relative overflow-hidden flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-br ${p.grad} via-surface-container-lowest to-surface-container-lowest border border-outline-variant/20 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all group`}
            >
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-outline-variant/10 to-transparent pointer-events-none" />

              <div className="flex items-start justify-between relative">
                <div className={`w-11 h-11 rounded-2xl ${p.iconBg} flex items-center justify-center shadow-sm`}>
                  <card.icon size={20} className={p.iconCls} />
                </div>
                <ArrowUpRight size={15} className="text-on-surface-variant/30 group-hover:text-on-surface-variant/70 transition-opacity" />
              </div>

              <div className="mt-5 relative">
                {loading
                  ? <Sk w="w-20" h="h-9" cls="mb-1" />
                  : <span className={`font-bold leading-none font-display ${card.isString ? 'text-2xl' : 'text-3xl'} ${p.valCls}`}>{card.value}</span>
                }
                <p className="text-xs font-semibold text-on-surface-variant/70 mt-1">{card.label}</p>
                {!loading && card.sub && <p className="text-xs text-on-surface-variant/50 mt-0.5">{card.sub}</p>}
              </div>

              <div className="mt-4 pt-3 border-t border-outline-variant/15 relative">
                {loading
                  ? <Sk w="w-20" h="h-3" />
                  : (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${p.tagBg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                      {card.footer}
                    </div>
                  )
                }
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Pipeline + Quick Actions ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Pipeline */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-on-surface">Lead Pipeline</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {loading ? <Sk w="w-32" h="h-3" /> : `${totalLeads} total leads across all stages`}
              </p>
            </div>
            <Link href="/agent/leads" className="text-xs text-secondary hover:underline flex items-center gap-0.5 font-medium">
              Manage <ChevronRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Sk w="w-20" h="h-3" />
                  <div className="flex-1 h-2.5 bg-surface-container-high rounded-full animate-pulse" />
                  <Sk w="w-5" h="h-3" />
                </div>
              ))}
            </div>
          ) : totalLeads === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center mb-3">
                <GitBranch size={20} className="text-on-surface-variant" />
              </div>
              <p className="text-sm text-on-surface-variant">No leads yet</p>
              <Link href="/agent/leads/new" className="mt-2 text-xs text-secondary hover:underline font-medium">Add your first lead →</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {stageCounts.map((stage) => {
                const pct = totalLeads > 0 ? (stage.count / totalLeads) * 100 : 0;
                return (
                  <div key={stage.key} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-on-surface-variant w-[5.5rem] shrink-0">{stage.label}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-surface-container-high overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${stage.barCls}`}
                        style={{ width: `${Math.max(pct > 0 ? 3 : 0, pct)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold w-5 text-right shrink-0 ${stage.countCls}`}>{stage.count}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Property status breakdown */}
          {!loading && totalProperties > 0 && (
            <div className="mt-5 pt-4 border-t border-outline-variant/20 grid grid-cols-4 gap-2">
              {[
                { label: 'Available', count: availableCount, cls: 'text-emerald-700',                dot: 'bg-emerald-500' },
                { label: 'Reserved',  count: reservedCount,  cls: 'text-on-surface',                 dot: 'bg-secondary' },
                { label: 'Sold',      count: soldCount,      cls: 'text-primary-container',          dot: 'bg-primary-container' },
                { label: 'Rented',    count: rentedCount,    cls: 'text-on-secondary-fixed-variant',  dot: 'bg-secondary-container' },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center p-2.5 rounded-lg bg-surface-container-low/60">
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

        {/* Right column: Quick actions + deal status */}
        <div className="lg:col-span-5 flex flex-col gap-4">

          {/* Quick actions */}
          <div className="p-5 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
            <h2 className="text-sm font-semibold text-on-surface mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-2">
              {[
                { href: '/agent/leads/new',       icon: GitBranch, label: 'Add Walk-in Lead',    desc: 'Log a new client enquiry',    cls: 'text-on-tertiary-container' },
                { href: '/agent/properties/new',  icon: Building2, label: 'Upload Property',     desc: 'Add a new listing',           cls: 'text-primary-container' },
                { href: '/agent/clients',         icon: Users,     label: 'View Clients',        desc: 'Buyer & tenant roster',       cls: 'text-secondary' },
                { href: '/agent/deals',           icon: Handshake, label: 'My Deals',            desc: 'Track your transactions',     cls: 'text-emerald-600' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low/60 hover:bg-surface-container-low transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 shadow-sm">
                    <item.icon size={15} className={item.cls} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-on-surface leading-tight">{item.label}</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronRight size={13} className="text-outline opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Deal status mini-strip */}
          <div className="p-5 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-on-surface">Deal Status</h2>
              <Link href="/agent/deals" className="text-xs text-secondary hover:underline font-medium">View all</Link>
            </div>
            {loading ? (
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => <Sk key={i} w="flex-1" h="h-14" />)}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Pending',   count: pendingDeals,   icon: Clock,         cls: 'text-secondary',         bg: 'bg-secondary-fixed/30' },
                  { label: 'Completed', count: completedDeals, icon: CheckCircle2,  cls: 'text-emerald-700',       bg: 'bg-emerald-50' },
                  { label: 'Paid Out',  count: paidDeals,      icon: TrendingUp,    cls: 'text-primary-container', bg: 'bg-primary-container/10' },
                ].map((s) => (
                  <div key={s.label} className={`flex flex-col items-center p-2.5 rounded-lg ${s.bg}`}>
                    <s.icon size={14} className={`${s.cls} mb-1`} />
                    <span className={`text-lg font-bold font-display ${s.cls}`}>{s.count}</span>
                    <span className="text-[10px] text-on-surface-variant text-center leading-tight mt-0.5">{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Listings ─────────────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
          <div>
            <h2 className="text-sm font-semibold text-on-surface">My Listings</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {loading ? <Sk w="w-32" h="h-3" /> : `${totalProperties} total properties in your portfolio`}
            </p>
          </div>
          <Link href="/agent/properties" className="text-xs text-secondary hover:underline font-medium flex items-center gap-0.5">
            View all <ChevronRight size={12} />
          </Link>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1 px-5 py-3 border-b border-outline-variant/15 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const count = loading ? null : tabCounts[tab.key];
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
                {['Property', 'Type', 'Price', 'City', 'Status', 'Views', ''].map((h) => (
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
                        <Sk w="w-9" h="h-9" cls="rounded-lg shrink-0" />
                        <div className="flex flex-col gap-1.5">
                          <Sk w="w-36" h="h-3.5" />
                          <Sk w="w-16" h="h-2.5" />
                        </div>
                      </div>
                    </td>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-3.5"><Sk w="w-16" h="h-3" /></td>
                    ))}
                    <td className="px-5 py-3.5"><Sk w="w-8" h="h-7" cls="rounded-lg" /></td>
                  </tr>
                ))
              ) : filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center">
                        <Home size={20} className="text-on-surface-variant" />
                      </div>
                      <p className="text-sm text-on-surface-variant">
                        {activeTab === 'all' ? 'No properties yet' : `No ${activeTab} properties`}
                      </p>
                      {activeTab === 'all' && (
                        <Link
                          href="/agent/properties/new"
                          className="flex items-center gap-2 bg-secondary text-on-secondary font-semibold px-4 py-2 rounded-lg text-sm"
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
                          <div className="w-9 h-9 rounded-lg bg-surface-container overflow-hidden shrink-0">
                            {p.images?.[0]
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center"><Home size={13} className="text-on-surface-variant" /></div>}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-on-surface line-clamp-1">{p.title}</p>
                              {p.is_featured && <Star size={10} className="text-secondary fill-secondary shrink-0" />}
                            </div>
                            <p className="text-xs text-on-surface-variant">{p.purpose === 'sale' ? 'For Sale' : 'For Rent'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-on-surface-variant capitalize">{p.type}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-secondary whitespace-nowrap">{formatPrice(p.price, p.purpose)}</td>
                      <td className="px-5 py-3.5 text-sm text-on-surface-variant">{p.city}</td>
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

        {/* Recent Deals row */}
        {!loading && deals.length > 0 && (
          <div className="px-5 py-4 border-t border-outline-variant/15">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Recent Deals</h3>
              <Link href="/agent/deals" className="text-xs text-secondary hover:underline font-medium">View all</Link>
            </div>
            <div className="flex flex-col gap-2">
              {deals.slice(0, 3).map((d) => (
                <Link
                  key={d.id}
                  href={`/agent/deals/${d.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low/60 hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0">
                      <Handshake size={13} className="text-on-surface-variant" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-on-surface truncate">{d.property?.title ?? 'Unnamed Property'}</p>
                      <p className="text-[11px] text-on-surface-variant">{d.client?.name ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-secondary">
                      {d.commission_amount ? formatPKR(parseFloat(d.commission_amount)) : '—'}
                    </span>
                    {d.deal_status === 'completed'
                      ? <CheckCircle2 size={13} className="text-emerald-500" />
                      : d.deal_status === 'pending'
                      ? <Clock size={13} className="text-secondary" />
                      : <XCircle size={13} className="text-on-surface-variant" />}
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
