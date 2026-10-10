'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Phone, Mail, Home, User, Save, Loader2, CheckCircle2,
  Calendar, MessageSquare, UserCheck, GitBranch, Clock, AlertCircle,
} from 'lucide-react';
import { leadsApi, agentsApi, ApiError } from '@/lib/api';
import { ApiLead, ApiAgent } from '@/lib/api-types';
import { useToast } from '@/components/ui/Toast';

const InputCls = 'w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all';
const LabelCls = 'block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5';

const STATUS_CFG: Record<string, {
  label: string; bg: string; text: string; dot: string;
  pillBg: string; pillText: string;
}> = {
  new:         { label: 'New',         bg: 'bg-secondary/10',  text: 'text-secondary',   dot: 'bg-secondary',   pillBg: 'bg-secondary/90',   pillText: 'text-white' },
  contacted:   { label: 'Contacted',   bg: 'bg-sky-50',        text: 'text-sky-700',     dot: 'bg-sky-500',     pillBg: 'bg-sky-500/90',     pillText: 'text-white' },
  site_visit:  { label: 'Site Visit',  bg: 'bg-violet-50',     text: 'text-violet-700',  dot: 'bg-violet-500',  pillBg: 'bg-violet-500/90',  pillText: 'text-white' },
  negotiation: { label: 'Negotiation', bg: 'bg-amber-50',      text: 'text-amber-700',   dot: 'bg-amber-500',   pillBg: 'bg-amber-500/90',   pillText: 'text-white' },
  closed_won:  { label: 'Won',         bg: 'bg-emerald-50',    text: 'text-emerald-700', dot: 'bg-emerald-500', pillBg: 'bg-emerald-500/90', pillText: 'text-white' },
  closed_lost: { label: 'Lost',        bg: 'bg-rose-50',       text: 'text-rose-700',    dot: 'bg-rose-500',    pillBg: 'bg-rose-600/90',    pillText: 'text-white' },
};

const STATUS_ORDER = ['new', 'contacted', 'site_visit', 'negotiation', 'closed_won', 'closed_lost'] as const;

const SOURCE_CFG: Record<string, { bg: string; text: string }> = {
  website:      { bg: 'bg-secondary/10', text: 'text-secondary' },
  referral:     { bg: 'bg-emerald-50',   text: 'text-emerald-700' },
  social:       { bg: 'bg-violet-50',    text: 'text-violet-700' },
  walk_in:      { bg: 'bg-amber-50',     text: 'text-amber-700' },
  phone:        { bg: 'bg-sky-50',       text: 'text-sky-700' },
  call:         { bg: 'bg-sky-50',       text: 'text-sky-700' },
  contact_form: { bg: 'bg-violet-50',    text: 'text-violet-700' },
};

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-outline-variant/10 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={13} className="text-secondary" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">{label}</p>
        <p className="text-sm text-on-surface mt-0.5 break-all">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 border-b border-outline-variant/10 flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
          <Icon size={13} className="text-secondary" />
        </div>
        <h3 className="text-sm font-semibold text-on-surface">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

export default function AdminLeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [lead, setLead]             = useState<ApiLead | null>(null);
  const [agents, setAgents]         = useState<ApiAgent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [saveError, setSaveError]   = useState('');

  const [status, setStatus]               = useState('');
  const [notes, setNotes]                 = useState('');
  const [nextFollowup, setNextFollowup]   = useState('');
  const [assignedAgentId, setAssignedAgentId] = useState('');

  useEffect(() => {
    leadsApi.get(id)
      .then((res) => {
        const l = res.data;
        setLead(l);
        setStatus(l.status);
        setNotes(l.notes ?? '');
        setNextFollowup(l.next_followup_at ? l.next_followup_at.slice(0, 16) : '');
        setAssignedAgentId(l.agent?.id ?? '');
      })
      .catch(() => setError('Lead not found.'))
      .finally(() => setLoading(false));

    agentsApi.list({ per_page: 100 }).then((res) => setAgents(res.data.filter((a) => a.approval_status === 'approved'))).catch(() => {});
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      const res = await leadsApi.update(id, {
        status: status as ApiLead['status'],
        notes,
        next_followup_at: nextFollowup || null,
        assigned_agent_id: assignedAgentId || null,
      });
      setLead(res.data);
      toast('Lead updated successfully');
      router.push('/admin/leads');
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Error saving lead');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-outline-variant border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-4 bg-error-container border border-error/20 rounded-xl text-sm text-on-error-container flex items-center gap-2">
        <AlertCircle size={15} className="shrink-0" />
        {error || 'Lead not found'}
      </div>
    );
  }

  const cfg = STATUS_CFG[lead.status] ?? STATUS_CFG.new;
  const editCfg = STATUS_CFG[status] ?? STATUS_CFG.new;
  const src = SOURCE_CFG[lead.source] ?? { bg: 'bg-surface-container-high', text: 'text-on-surface-variant' };
  const isMarkingWon = status === 'closed_won' && lead.status !== 'closed_won' && !lead.client;
  const initials = lead.client_name.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span className="font-semibold uppercase tracking-wider">RMS Enterprise</span>
        <span className="text-outline-variant">/</span>
        <Link href="/admin/leads" className="font-semibold text-secondary/70 uppercase tracking-wider hover:text-secondary transition-colors">
          Leads
        </Link>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider truncate max-w-[160px]">{lead.client_name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-on-surface font-display">{lead.client_name}</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Lead Detail</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ${cfg.bg} ${cfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-7">

        {/* ── Left: detail card ─────────────────────────────────────── */}
        <div className="lg:col-span-2 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 p-6 flex flex-col shadow-sm gap-5">

          {/* Avatar + name */}
          <div>
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-on-secondary text-2xl font-bold shadow-md mb-4">
              {initials}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-0.5">Lead</p>
            <h2 className="text-xl font-bold text-on-surface tracking-tight leading-tight">{lead.client_name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${src.bg} ${src.text}`}>
                {lead.source.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Contact info rows */}
          <div>
            <InfoRow icon={Phone} label="Phone" value={lead.phone} />
            <InfoRow icon={Mail}  label="Email" value={lead.email} />
          </div>

          {/* Property interest */}
          {lead.property && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/10">
              <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                <Home size={13} className="text-secondary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">Interested In</p>
                <p className="text-sm font-medium text-on-surface mt-0.5 truncate">{lead.property.title}</p>
                {lead.property.city && <p className="text-xs text-on-surface-variant">{lead.property.city}</p>}
              </div>
            </div>
          )}

          {/* Assigned agent */}
          {lead.agent && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/10">
              <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                <UserCheck size={13} className="text-secondary" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">Assigned Agent</p>
                <p className="text-sm font-medium text-on-surface mt-0.5">{lead.agent.user?.full_name}</p>
                {lead.agent.user?.email && <p className="text-xs text-on-surface-variant">{lead.agent.user.email}</p>}
              </div>
            </div>
          )}

          {/* Visitor message */}
          {lead.visitor_message && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/10">
              <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                <MessageSquare size={13} className="text-secondary" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">Visitor Message</p>
                <p className="text-sm text-on-surface mt-0.5 leading-relaxed">{lead.visitor_message}</p>
              </div>
            </div>
          )}

          {/* Converted client */}
          {lead.client && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <p className="text-xs font-semibold text-emerald-800">Lead Converted</p>
              </div>
              <p className="text-sm font-medium text-on-surface">{lead.client.name}</p>
              <p className="text-xs text-on-surface-variant mb-2.5">{lead.client.phone}{lead.client.email ? ` · ${lead.client.email}` : ''}</p>
              <Link
                href={`/admin/clients/${lead.client.id}`}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors inline-block"
              >
                View Client
              </Link>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-4 mt-auto border-t border-outline-variant/20 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-on-surface-variant/60">
              <Calendar size={11} className="shrink-0" />
              <span>Created {new Date(lead.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            {lead.next_followup_at && (
              <div className="flex items-center gap-2 text-xs text-secondary">
                <Clock size={11} className="shrink-0" />
                <span>Follow-up {new Date(lead.next_followup_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: update form ────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">

          {saveError && (
            <div className="flex items-start gap-3 p-4 bg-error-container/60 border border-error/20 rounded-xl text-sm text-on-error-container">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />{saveError}
            </div>
          )}

          <Section title="Update Status" icon={GitBranch}>
            <div className="flex flex-wrap gap-2">
              {STATUS_ORDER.map((s) => {
                const c = STATUS_CFG[s];
                const active = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all ${
                      active
                        ? `${c.pillBg} ${c.pillText} shadow-sm`
                        : 'bg-surface-container border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            {isMarkingWon && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-medium text-emerald-700">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>A client record will be created automatically when saved</span>
              </div>
            )}
          </Section>

          <Section title="Assign Agent" icon={User}>
            <div>
              <label className={LabelCls}>Assigned Agent</label>
              <select
                value={assignedAgentId}
                onChange={(e) => setAssignedAgentId(e.target.value)}
                className={InputCls}
              >
                <option value="">— Unassigned —</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.user?.full_name ?? a.id}</option>
                ))}
              </select>
            </div>
          </Section>

          <Section title="Follow-up &amp; Notes" icon={Clock}>
            <div>
              <label className={LabelCls}><Calendar size={11} className="inline mr-1" />Next Follow-up</label>
              <input
                type="datetime-local"
                value={nextFollowup}
                onChange={(e) => setNextFollowup(e.target.value)}
                className={InputCls}
              />
            </div>
            <div>
              <label className={LabelCls}><MessageSquare size={11} className="inline mr-1" />Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="Add notes about this lead…"
                className={`${InputCls} resize-none`}
              />
            </div>
          </Section>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-7 py-2.5 text-sm font-semibold rounded-xl disabled:opacity-50 transition-all shadow-md ${
                isMarkingWon
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : `${editCfg.pillBg} ${editCfg.pillText} hover:opacity-90`
              }`}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving…' : isMarkingWon ? 'Mark as Won' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
