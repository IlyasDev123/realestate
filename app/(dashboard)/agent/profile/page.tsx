'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, CreditCard, BookOpen, Briefcase, Clock, CheckCircle2, XCircle, Calendar, Percent, Pencil } from 'lucide-react';

const statusConfig = {
  approved: { label: 'Approved',       icon: CheckCircle2, bg: 'bg-emerald-50',      text: 'text-emerald-700',        dot: 'bg-emerald-500' },
  pending:  { label: 'Pending Review', icon: Clock,        bg: 'bg-amber-500/10',    text: 'text-amber-700',          dot: 'bg-amber-500' },
  rejected: { label: 'Rejected',       icon: XCircle,      bg: 'bg-error-container', text: 'text-on-error-container', dot: 'bg-error' },
};

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-outline-variant/10 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-secondary" />
      </div>
      <div>
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{label}</p>
        <p className="text-sm text-on-surface mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function AgentProfilePage() {
  const { user } = useAuth();
  const agent = user?.agent;
  const approvalStatus = (agent?.approval_status ?? 'pending') as keyof typeof statusConfig;
  const status = statusConfig[approvalStatus] ?? statusConfig.pending;
  const StatusIcon = status.icon;

  const initials = user?.full_name
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'A';

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span className="font-semibold uppercase tracking-wider">RMS Enterprise</span>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider">My Profile</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface font-display">My Profile</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Your agent profile and account details.</p>
        </div>
        <Link
          href="/agent/profile/edit"
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-on-secondary text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-md shrink-0"
        >
          <Pencil size={13} />
          Edit Profile
        </Link>
      </div>

      {agent?.approval_status === 'rejected' && agent.rejection_reason && (
        <div className="p-4 bg-error-container/60 border border-error/20 rounded-xl text-sm text-on-error-container">
          <strong>Rejection reason:</strong> {agent.rejection_reason}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-7">
        {/* Left panel — identity card */}
        <div className="lg:col-span-2 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 p-7 flex flex-col shadow-sm">
          <div className="flex-1">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-on-secondary text-2xl font-bold shadow-md mb-5">
              {initials}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-1">Advisory Agent</p>
            <h2 className="text-xl font-bold text-on-surface tracking-tight">{user?.full_name}</h2>
            <p className="text-xs text-on-surface-variant/60 mt-0.5 mb-4">{user?.email}</p>

            {/* Status badge */}
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${status.bg} ${status.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              <StatusIcon size={12} />
              {status.label}
            </span>

            {/* Key stats */}
            <div className="mt-6 space-y-3">
              {agent?.joining_date && (
                <div className="flex items-center gap-2.5 text-sm text-on-surface-variant">
                  <Calendar size={13} className="text-secondary/70 shrink-0" />
                  <span className="text-xs">Joined {new Date(agent.joining_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
                </div>
              )}
              {agent?.commission_default_pct && (
                <div className="flex items-center gap-2.5 text-sm text-on-surface-variant">
                  <Percent size={13} className="text-secondary/70 shrink-0" />
                  <span className="text-xs">{agent.commission_default_pct}% commission rate</span>
                </div>
              )}
              {agent?.specialization && (
                <div className="flex items-center gap-2.5 text-sm text-on-surface-variant">
                  <Briefcase size={13} className="text-secondary/70 shrink-0" />
                  <span className="text-xs">{agent.specialization}</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-outline-variant/20">
            <p className="text-[11px] text-on-surface-variant/50 leading-relaxed">
              Contact your manager to update profile details.
            </p>
          </div>
        </div>

        {/* Right — detail cards */}
        <div className="lg:col-span-3 space-y-4">
          {/* Contact & identity */}
          <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-outline-variant/10 flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                <User size={13} className="text-secondary" />
              </div>
              <h3 className="text-sm font-semibold text-on-surface">Contact &amp; Identity</h3>
            </div>
            <div className="px-5 py-1">
              <InfoRow icon={Mail}       label="Email"          value={user?.email} />
              <InfoRow icon={Phone}      label="Phone"          value={user?.phone} />
              <InfoRow icon={CreditCard} label="CNIC"           value={agent?.cnic} />
              <InfoRow icon={Briefcase}  label="Specialization" value={agent?.specialization} />
              <InfoRow icon={BookOpen}   label="Bio"            value={agent?.bio} />
            </div>
          </div>

          {/* Account info */}
          <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-outline-variant/10 flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                <User size={13} className="text-secondary" />
              </div>
              <h3 className="text-sm font-semibold text-on-surface">Account Information</h3>
            </div>
            <div className="divide-y divide-outline-variant/10 px-5">
              <div className="flex justify-between py-3.5">
                <span className="text-sm text-on-surface-variant">Role</span>
                <span className="text-sm font-medium text-on-surface capitalize">{user?.role?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between py-3.5">
                <span className="text-sm text-on-surface-variant">Approval Status</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>
              {agent?.joining_date && (
                <div className="flex justify-between py-3.5">
                  <span className="text-sm text-on-surface-variant">Joining Date</span>
                  <span className="text-sm font-medium text-on-surface">{agent.joining_date}</span>
                </div>
              )}
              {agent?.commission_default_pct && (
                <div className="flex justify-between py-3.5">
                  <span className="text-sm text-on-surface-variant">Commission Rate</span>
                  <span className="text-sm font-medium text-secondary">{agent.commission_default_pct}%</span>
                </div>
              )}
              <div className="flex justify-between py-3.5">
                <span className="text-sm text-on-surface-variant">Account ID</span>
                <span className="text-xs font-mono text-on-surface-variant">{user?.id?.slice(0, 16)}…</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
