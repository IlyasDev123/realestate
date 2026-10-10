'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Phone, Mail, MapPin, CreditCard, StickyNote,
  Handshake, GitBranch, CheckCircle2, ExternalLink, Calendar,
  TrendingUp, Pencil, Trash2,
} from 'lucide-react';
import { clientsApi, ApiError } from '@/lib/api';
import type { ApiClient } from '@/lib/api-types';
import { useToast } from '@/components/ui/Toast';

// ── Config ────────────────────────────────────────────────────────────────────
const TYPE_CFG: Record<ApiClient['type'], { label: string; bg: string; text: string; grad: string; dot: string; avatar: string }> = {
  buyer:    { label: 'Buyer',    bg: 'bg-emerald-50',  text: 'text-emerald-700',  grad: 'from-emerald-500/8',  dot: 'bg-emerald-500',  avatar: 'bg-emerald-100 text-emerald-700' },
  seller:   { label: 'Seller',   bg: 'bg-blue-50',     text: 'text-blue-700',     grad: 'from-blue-500/8',     dot: 'bg-blue-500',     avatar: 'bg-blue-100 text-blue-700' },
  tenant:   { label: 'Tenant',   bg: 'bg-purple-50',   text: 'text-purple-700',   grad: 'from-purple-500/8',   dot: 'bg-purple-500',   avatar: 'bg-purple-100 text-purple-700' },
  landlord: { label: 'Landlord', bg: 'bg-amber-50',    text: 'text-amber-700',    grad: 'from-amber-500/8',    dot: 'bg-amber-500',    avatar: 'bg-amber-100 text-amber-700' },
};

const DEAL_STATUS_CFG: Record<string, { bg: string; text: string }> = {
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  confirmed: { bg: 'bg-blue-50',    text: 'text-blue-700' },
  pending:   { bg: 'bg-amber-50',   text: 'text-amber-700' },
  cancelled: { bg: 'bg-red-50',     text: 'text-red-700' },
};

const LEAD_STATUS_CFG: Record<string, { bg: string; text: string }> = {
  new:         { bg: 'bg-blue-50',                  text: 'text-blue-700' },
  contacted:   { bg: 'bg-surface-container-high',   text: 'text-on-surface' },
  site_visit:  { bg: 'bg-purple-50',                text: 'text-purple-700' },
  negotiation: { bg: 'bg-amber-50',                 text: 'text-amber-700' },
  closed_won:  { bg: 'bg-emerald-50',               text: 'text-emerald-700' },
  closed_lost: { bg: 'bg-red-50',                   text: 'text-red-700' },
};

// ── Sub-components ────────────────────────────────────────────────────────────
function ContactRow({
  icon: Icon, label, value, href,
}: { icon: React.ElementType; label: string; value?: string | null; href?: string }) {
  if (!value) return null;
  const inner = (
    <div className={`flex items-center gap-3 py-3 group ${href ? 'cursor-pointer' : ''}`}>
      <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
        <Icon size={14} className="text-on-surface-variant" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">{label}</p>
        <p className={`text-sm text-on-surface mt-0.5 break-words ${href ? 'group-hover:text-secondary transition-colors' : ''}`}>{value}</p>
      </div>
      {href && <ExternalLink size={12} className="text-on-surface-variant/30 group-hover:text-secondary transition-colors shrink-0" />}
    </div>
  );
  return href ? <a href={href} className="block">{inner}</a> : <div>{inner}</div>;
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon, iconBg, iconColor, title, count, extra,
}: {
  icon: React.ElementType; iconBg: string; iconColor: string;
  title: string; count?: number; extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon size={14} className={iconColor} />
        </div>
        <h3 className="text-sm font-bold text-on-surface">{title}</h3>
        {count !== undefined && (
          <span className="text-xs bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full font-semibold">{count}</span>
        )}
      </div>
      {extra}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-5xl">
      <div className="h-8 w-32 bg-surface-container-low rounded-lg" />
      <div className="h-44 rounded-2xl bg-surface-container-low" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="h-56 rounded-2xl bg-surface-container-low" />
          <div className="h-24 rounded-2xl bg-surface-container-low" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="h-48 rounded-2xl bg-surface-container-low" />
          <div className="h-48 rounded-2xl bg-surface-container-low" />
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const toast   = useToast();
  const [client,   setClient]   = useState<ApiClient | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    clientsApi.get(id)
      .then(res => setClient(res.data))
      .catch(() => setError('Client not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm('Delete this client? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await clientsApi.delete(id);
      toast('Client deleted');
      router.push('/admin/clients');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Error deleting client', 'error');
      setDeleting(false);
    }
  }

  if (loading) return <Skeleton />;

  if (error || !client) {
    return (
      <div className="p-4 bg-error-container border border-error/20 rounded-xl text-sm text-on-error-container">
        {error || 'Not found'}
      </div>
    );
  }

  const tc         = TYPE_CFG[client.type];
  const initials   = client.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const dealsTotal = (client.deals ?? []).reduce((s, d) => s + Number(d.amount ?? 0), 0);
  const wonLeads   = (client.leads ?? []).filter(l => l.status === 'closed_won').length;

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Clients
      </button>

      {/* ── Hero banner ── */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${tc.grad} via-surface-container-lowest to-surface-container-lowest border border-outline-variant/20 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]`}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-gradient-to-br from-outline-variant/8 to-transparent pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-gradient-to-tr from-outline-variant/5 to-transparent pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-2xl ${tc.avatar} border-2 border-white/50 flex items-center justify-center text-2xl font-bold shrink-0 shadow-sm`}>
            {initials}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-2xl font-bold text-on-surface font-display tracking-tight">{client.name}</h1>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${tc.bg} ${tc.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                {tc.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-on-surface-variant">
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 hover:text-secondary transition-colors">
                  <Phone size={13} /> {client.phone}
                </a>
              )}
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-secondary transition-colors">
                  <Mail size={13} /> {client.email}
                </a>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                Client since {new Date(client.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Actions + stats */}
          <div className="flex flex-col items-end gap-4 shrink-0">
            {/* Admin action buttons */}
            <div className="flex gap-2">
              <Link href={`/admin/clients/${id}/edit`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/20 text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:border-outline transition-colors shadow-sm">
                <Pencil size={13} /> Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-error-container/80 border border-error/20 text-xs font-semibold text-on-error-container hover:bg-error/10 transition-colors shadow-sm disabled:opacity-50"
              >
                <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-5 sm:pl-4 sm:border-l sm:border-outline-variant/30">
              {[
                { label: 'Deals',  value: client.deals?.length ?? 0,   icon: Handshake, color: 'text-secondary' },
                { label: 'Leads',  value: client.leads?.length ?? 0,   icon: GitBranch, color: 'text-primary-container' },
                { label: 'Won',    value: wonLeads,                    icon: TrendingUp, color: 'text-emerald-600' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <s.icon size={14} className={`${s.color} mx-auto mb-1`} />
                  <p className={`text-2xl font-bold font-display leading-none ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Contact card */}
        <div className="space-y-4">
          <SectionCard>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 mb-3">Contact Information</h3>
            <div className="divide-y divide-outline-variant/15">
              <ContactRow icon={Phone}      label="Phone"   value={client.phone}   href={client.phone ? `tel:${client.phone}` : undefined} />
              <ContactRow icon={Mail}       label="Email"   value={client.email}   href={client.email ? `mailto:${client.email}` : undefined} />
              <ContactRow icon={CreditCard} label="CNIC"    value={client.cnic} />
              <ContactRow icon={MapPin}     label="Address" value={client.address} />
            </div>
          </SectionCard>

          {client.notes && (
            <div className="rounded-2xl bg-amber-50/70 border border-amber-200/50 p-5">
              <div className="flex items-center gap-2 mb-2">
                <StickyNote size={13} className="text-amber-600" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-amber-700/70">Notes</h3>
              </div>
              <p className="text-sm text-on-surface leading-relaxed">{client.notes}</p>
            </div>
          )}

          {dealsTotal > 0 && (
            <div className="rounded-2xl bg-secondary/8 border border-secondary/15 p-5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-secondary/70 mb-1">Total Deal Value</p>
              <p className="text-2xl font-bold text-secondary font-display">PKR {dealsTotal.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Right: Activity */}
        <div className="lg:col-span-2 space-y-5">

          {/* Deals */}
          <SectionCard>
            <SectionHeader
              icon={Handshake} iconBg="bg-secondary/10" iconColor="text-secondary"
              title="Deals" count={client.deals?.length ?? 0}
              extra={dealsTotal > 0 ? <span className="text-xs font-semibold text-secondary">PKR {dealsTotal.toLocaleString()}</span> : undefined}
            />
            {!(client.deals?.length) ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center mx-auto mb-3">
                  <Handshake size={20} className="text-on-surface-variant/40" />
                </div>
                <p className="text-sm text-on-surface-variant">No deals yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {client.deals!.map(deal => {
                  const sc = DEAL_STATUS_CFG[deal.deal_status] ?? DEAL_STATUS_CFG.pending;
                  return (
                    <Link key={deal.id} href={`/admin/deals/${deal.id}`}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low/60 hover:bg-surface-container-low border border-transparent hover:border-outline-variant/20 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-surface-container-lowest flex items-center justify-center shrink-0 shadow-sm border border-outline-variant/15">
                          <Handshake size={14} className="text-on-surface-variant" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">{deal.property?.title ?? 'Property Deal'}</p>
                          <p className="text-xs text-on-surface-variant capitalize">{deal.deal_type} · {new Date(deal.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <p className="text-sm font-bold text-secondary hidden sm:block">PKR {Number(deal.amount).toLocaleString()}</p>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize whitespace-nowrap ${sc.bg} ${sc.text}`}>{deal.deal_status}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* Leads */}
          <SectionCard>
            <SectionHeader
              icon={GitBranch} iconBg="bg-primary-container/10" iconColor="text-primary-container"
              title="Leads" count={client.leads?.length ?? 0}
            />
            {!(client.leads?.length) ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center mx-auto mb-3">
                  <GitBranch size={20} className="text-on-surface-variant/40" />
                </div>
                <p className="text-sm text-on-surface-variant">No leads yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {client.leads!.map(lead => {
                  const lc = LEAD_STATUS_CFG[lead.status] ?? LEAD_STATUS_CFG.new;
                  return (
                    <Link key={lead.id} href={`/admin/leads/${lead.id}`}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low/60 hover:bg-surface-container-low border border-transparent hover:border-outline-variant/20 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-surface-container-lowest flex items-center justify-center shrink-0 shadow-sm border border-outline-variant/15">
                          <GitBranch size={14} className="text-on-surface-variant" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">{lead.client_name}</p>
                          <p className="text-xs text-on-surface-variant capitalize">{lead.source} · {new Date(lead.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {lead.status === 'closed_won' && <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />}
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize whitespace-nowrap ${lc.bg} ${lc.text}`}>
                          {lead.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
