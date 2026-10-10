'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, User, Save, Loader2, AlertTriangle, AlertCircle, CheckCircle2, Home } from 'lucide-react';
import { dealsApi, ApiError } from '@/lib/api';
import { ApiDeal } from '@/lib/api-types';
import { useToast } from '@/components/ui/Toast';

const InputCls = 'w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface focus:border-secondary focus:ring-2 focus:ring-secondary/10 outline-none transition-all';

const dealStatusStyle: Record<ApiDeal['deal_status'], { bg: string; text: string; dot: string; label: string }> = {
  pending:   { bg: 'bg-secondary-fixed/40',     text: 'text-on-secondary-fixed-variant', dot: 'bg-secondary',           label: 'Pending' },
  confirmed: { bg: 'bg-surface-container-high',  text: 'text-primary-container',          dot: 'bg-primary-container',   label: 'Confirmed' },
  completed: { bg: 'bg-emerald-50',              text: 'text-emerald-700',                dot: 'bg-emerald-500',         label: 'Completed' },
};

const paymentStatusStyle: Record<ApiDeal['payment_status'], { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-error-container',     text: 'text-on-error-container',         label: 'Payment Pending' },
  partial: { bg: 'bg-secondary-fixed/40',  text: 'text-on-secondary-fixed-variant', label: 'Partial Payment' },
  paid:    { bg: 'bg-emerald-50',          text: 'text-emerald-700',                label: 'Paid' },
};

const propertyStatusStyle: Record<string, { bg: string; text: string; dot: string }> = {
  available: { bg: 'bg-emerald-50',               text: 'text-emerald-700',                dot: 'bg-emerald-500' },
  reserved:  { bg: 'bg-secondary-fixed/40',        text: 'text-on-secondary-fixed-variant', dot: 'bg-secondary' },
  sold:      { bg: 'bg-surface-container-highest', text: 'text-primary-container',          dot: 'bg-primary-container' },
  rented:    { bg: 'bg-surface-container-high',    text: 'text-on-surface-variant',         dot: 'bg-outline' },
  draft:     { bg: 'bg-surface-container',         text: 'text-on-surface-variant',         dot: 'bg-outline' },
};

function formatPrice(value: string | number) {
  const n = Number(value);
  if (n >= 10_000_000) return `PKR ${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `PKR ${(n / 100_000).toFixed(2)} L`;
  return `PKR ${n.toLocaleString()}`;
}

function Row({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-outline-variant/20 last:border-0">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-secondary font-semibold' : 'text-on-surface'}`}>{value}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  );
}

function getPropertyImpact(dealStatus: ApiDeal['deal_status'], dealType: 'sale' | 'rent') {
  if (dealStatus === 'confirmed') return { label: 'Property will be marked Reserved', icon: AlertTriangle, isCompletion: false };
  if (dealStatus === 'completed') return { label: `Property will be marked ${dealType === 'sale' ? 'Sold' : 'Rented'}`, icon: CheckCircle2, isCompletion: true };
  if (dealStatus === 'pending') return { label: 'Property will be set back to Available', icon: Home, isCompletion: false };
  return null;
}

export default function AgentDealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [deal, setDeal] = useState<ApiDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [edit, setEdit] = useState({
    deal_status: '' as ApiDeal['deal_status'],
    payment_status: '' as ApiDeal['payment_status'],
    notes: '',
  });

  useEffect(() => {
    dealsApi.get(id)
      .then((res) => {
        setDeal(res.data);
        setEdit({
          deal_status: res.data.deal_status,
          payment_status: res.data.payment_status,
          notes: res.data.notes ?? '',
        });
      })
      .catch(() => setError('Deal not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      const res = await dealsApi.update(id, {
        deal_status: edit.deal_status,
        payment_status: edit.payment_status,
        notes: edit.notes || undefined,
      });
      setDeal(res.data);
      const completedMsg = edit.deal_status === 'completed'
        ? ` · Property marked as ${deal?.deal_type === 'sale' ? 'Sold' : 'Rented'}`
        : edit.deal_status === 'confirmed' ? ' · Property marked as Reserved' : '';
      toast(`Deal updated successfully${completedMsg}`);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Error updating deal');
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

  if (error || !deal) {
    return (
      <div className="p-4 bg-error-container border border-error/20 rounded-xl text-sm text-on-error-container">
        {error || 'Not found'}
      </div>
    );
  }

  const ds = dealStatusStyle[deal.deal_status];
  const ps = paymentStatusStyle[deal.payment_status];
  const propStatus = deal.property?.status ?? '';
  const pss = propertyStatusStyle[propStatus] ?? propertyStatusStyle.draft;

  const statusChanged = edit.deal_status !== deal.deal_status;
  const impact = statusChanged ? getPropertyImpact(edit.deal_status, deal.deal_type) : null;
  const isCompletionAction = edit.deal_status === 'completed' && deal.deal_status !== 'completed';

  return (
    <div className="max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span className="font-semibold uppercase tracking-wider">RMS Enterprise</span>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider">My Deals</span>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider">Detail</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => router.back()} className="p-2 mt-0.5 text-on-surface-variant hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container-high shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-on-surface font-display">
            {deal.property?.title ?? 'Deal Detail'}
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${ds.bg} ${ds.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${ds.dot}`} />
              {ds.label}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ps.bg} ${ps.text}`}>
              {ps.label}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant capitalize">
              {deal.deal_type} Deal
            </span>
          </div>
        </div>
      </div>

      {/* Completed state banner */}
      {deal.deal_status === 'completed' && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-700">Deal Completed</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Property has been marked as {deal.deal_type === 'sale' ? 'Sold' : 'Rented'}
            </p>
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <SectionCard title="Financial Summary">
        <Row label="Deal Type" value={<span className="capitalize">{deal.deal_type}</span>} />
        <Row label="Amount" value={formatPrice(deal.amount)} highlight />
        <Row label="Commission %" value={`${deal.commission_pct}%`} />
        <Row label="Your Commission" value={formatPrice(deal.commission_amount)} highlight />
        {deal.payment_date && <Row label="Payment Date" value={new Date(deal.payment_date).toLocaleDateString()} />}
      </SectionCard>

      {/* Property with current status */}
      {deal.property && (
        <SectionCard title="Property">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                <Building2 size={16} className="text-on-surface-variant" />
              </div>
              <div>
                <p className="text-sm font-medium text-on-surface">{deal.property.title}</p>
                <p className="text-xs text-on-surface-variant">{deal.property.city}</p>
              </div>
            </div>
            {propStatus && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize shrink-0 ${pss.bg} ${pss.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pss.dot}`} />
                {propStatus}
              </span>
            )}
          </div>
        </SectionCard>
      )}

      {deal.client && (
        <SectionCard title="Client">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
              <User size={16} className="text-on-surface-variant" />
            </div>
            <div>
              <p className="text-sm font-medium text-on-surface">{deal.client.name}</p>
              <p className="text-xs text-on-surface-variant">{deal.client.phone}</p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Update Deal — only show if not completed */}
      {deal.deal_status !== 'completed' && (
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] space-y-4">
          <h3 className="text-base font-semibold text-on-surface">Update Deal</h3>

          {saveError && (
            <div className="flex items-start gap-3 p-4 bg-error-container/60 border border-error/20 rounded-xl text-sm text-on-error-container">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />{saveError}
            </div>
          )}

          {/* Property impact banner */}
          {impact && (
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm font-medium ${
              impact.isCompletion
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : edit.deal_status === 'confirmed'
                ? 'bg-secondary-fixed/40 border-secondary-container text-on-secondary-fixed-variant'
                : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant'
            }`}>
              <impact.icon size={15} className="shrink-0" />
              <span>{impact.label}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Deal Status</label>
              <select value={edit.deal_status} onChange={(e) => setEdit((f) => ({ ...f, deal_status: e.target.value as ApiDeal['deal_status'] }))} className={InputCls}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Payment Status</label>
              <select value={edit.payment_status} onChange={(e) => setEdit((f) => ({ ...f, payment_status: e.target.value as ApiDeal['payment_status'] }))} className={InputCls}>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Notes</label>
            <textarea value={edit.notes} onChange={(e) => setEdit((f) => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Notes about this deal…" className={`${InputCls} resize-none`} />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button onClick={handleSave} disabled={saving}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl disabled:opacity-50 transition-all shadow-md ${
                isCompletionAction
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-secondary text-on-secondary hover:opacity-95'
              }`}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving…' : isCompletionAction ? 'Complete Deal' : 'Save Changes'}
            </button>
            {statusChanged && (
              <button onClick={() => setEdit((f) => ({ ...f, deal_status: deal.deal_status }))}
                className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* Completed state — allow updating payment/notes only */}
      {deal.deal_status === 'completed' && (
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] space-y-4">
          <h3 className="text-base font-semibold text-on-surface">Update Payment & Notes</h3>

          {saveError && (
            <div className="flex items-start gap-3 p-4 bg-error-container/60 border border-error/20 rounded-xl text-sm text-on-error-container">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />{saveError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Payment Status</label>
            <select value={edit.payment_status} onChange={(e) => setEdit((f) => ({ ...f, payment_status: e.target.value as ApiDeal['payment_status'] }))} className={InputCls}>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Notes</label>
            <textarea value={edit.notes} onChange={(e) => setEdit((f) => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Notes about this deal…" className={`${InputCls} resize-none`} />
          </div>

          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-on-secondary text-sm font-semibold rounded-xl hover:opacity-95 disabled:opacity-50 transition-all shadow-md">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
