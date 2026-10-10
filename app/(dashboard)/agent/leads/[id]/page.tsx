'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Phone, Mail, Home, Calendar, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { leadsApi, ApiError } from '@/lib/api';
import { ApiLead } from '@/lib/api-types';
import { useToast } from '@/components/ui/Toast';

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  new:          { label: 'New',         bg: 'bg-surface-container-high',    text: 'text-primary-container' },
  contacted:    { label: 'Contacted',   bg: 'bg-secondary-fixed/40',        text: 'text-on-secondary-fixed-variant' },
  site_visit:   { label: 'Site Visit',  bg: 'bg-surface-container-highest',  text: 'text-on-surface' },
  negotiation:  { label: 'Negotiation', bg: 'bg-secondary-fixed/30',        text: 'text-secondary' },
  closed_won:   { label: 'Won',         bg: 'bg-emerald-50',                text: 'text-emerald-700' },
  closed_lost:  { label: 'Lost',        bg: 'bg-error-container',           text: 'text-on-error-container' },
};

const statusOrder = ['new', 'contacted', 'site_visit', 'negotiation', 'closed_won', 'closed_lost'];

const InputCls = 'w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-secondary focus:ring-2 focus:ring-secondary/10 outline-none transition-all';

export default function AgentLeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [lead, setLead] = useState<ApiLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [nextFollowup, setNextFollowup] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    leadsApi.get(id)
      .then((res) => {
        setLead(res.data);
        setNotes(res.data.notes ?? '');
        setStatus(res.data.status);
        setNextFollowup(res.data.next_followup_at ? res.data.next_followup_at.slice(0, 16) : '');
      })
      .catch(() => setError('Lead not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      const res = await leadsApi.update(id, {
        status: status as ApiLead['status'],
        notes,
        next_followup_at: nextFollowup || null,
      });
      setLead(res.data);
      toast('Lead updated successfully');
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
      <div className="p-4 bg-error-container border border-error/20 rounded-xl text-sm text-on-error-container">
        {error || 'Not found'}
      </div>
    );
  }

  const cfg = statusConfig[lead.status] ?? statusConfig.new;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span className="font-semibold uppercase tracking-wider">RMS Enterprise</span>
        <span className="text-outline-variant">/</span>
        <Link href="/agent/leads" className="font-semibold text-secondary/70 uppercase tracking-wider hover:text-secondary transition-colors">
          My Leads
        </Link>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider truncate max-w-[160px]">{lead.client_name}</span>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 text-on-surface-variant hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container-high">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-on-surface font-display">{lead.client_name}</h1>
          <span className={`mt-1 inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
          </span>
        </div>
      </div>

      {saveError && (
        <div className="flex items-start gap-3 p-4 bg-error-container/60 border border-error/20 rounded-xl text-sm text-on-error-container">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />{saveError}
        </div>
      )}

      {/* Contact Info */}
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 space-y-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <h2 className="text-base font-semibold text-on-surface">Contact Info</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Phone</p>
            <p className="text-on-surface flex items-center gap-1.5">
              <Phone size={13} className="text-on-surface-variant" />{lead.phone}
            </p>
          </div>
          {lead.email && (
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Email</p>
              <p className="text-on-surface flex items-center gap-1.5">
                <Mail size={13} className="text-on-surface-variant" />{lead.email}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Source</p>
            <p className="text-on-surface capitalize">{lead.source}</p>
          </div>
        </div>
        {lead.visitor_message && (
          <div className="p-3 bg-surface-container-low rounded-lg">
            <p className="text-xs text-on-surface-variant mb-1">Visitor Message</p>
            <p className="text-sm text-on-surface">{lead.visitor_message}</p>
          </div>
        )}
        {lead.property && (
          <div className="flex items-center gap-2 p-3 bg-surface-container-low rounded-lg">
            <Home size={14} className="text-on-surface-variant shrink-0" />
            <div>
              <p className="text-xs text-on-surface-variant">Interested in</p>
              <p className="text-sm text-on-surface font-medium">{lead.property.title}</p>
            </div>
          </div>
        )}
      </div>

      {/* Converted client card */}
      {lead.client && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <h2 className="text-sm font-semibold text-emerald-800">Lead Converted — Client Created</h2>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-on-surface">{lead.client.name}</p>
              <p className="text-xs text-on-surface-variant">{lead.client.phone}{lead.client.email ? ` · ${lead.client.email}` : ''}</p>
            </div>
            <Link href={`/agent/clients/${lead.client.id}`}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0">
              View Client
            </Link>
          </div>
        </div>
      )}

      {/* Update Lead */}
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 space-y-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <h2 className="text-base font-semibold text-on-surface">Update Lead</h2>

        <div>
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Status</label>
          <div className="flex flex-wrap gap-2">
            {statusOrder.map((s) => {
              const c = statusConfig[s];
              return (
                <button key={s} onClick={() => setStatus(s)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                    status === s ? `${c.bg} ${c.text}` : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                  }`}>
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
            <Calendar size={11} className="inline mr-1" />Next Follow-up
          </label>
          <input
            type="datetime-local"
            value={nextFollowup}
            onChange={(e) => setNextFollowup(e.target.value)}
            className={InputCls}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Add notes about this lead…"
            className={`${InputCls} resize-none`}
          />
        </div>

        {status === 'closed_won' && lead.status !== 'closed_won' && !lead.client && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>Lead will be marked Won — a client record will be created automatically</span>
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-md ${
            status === 'closed_won' && lead.status !== 'closed_won'
              ? 'bg-emerald-600 text-white'
              : 'bg-secondary text-on-secondary'
          }`}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Saving…' : status === 'closed_won' && lead.status !== 'closed_won' ? 'Mark as Won' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
