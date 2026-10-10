'use client';

import { ShieldCheck, UserCog, Users, Trash2, Mail, Phone } from 'lucide-react';
import { ApiUser } from '@/lib/api-types';

const roleStyle: Record<string, { bg: string; text: string; dot: string }> = {
  super_admin: { bg: 'bg-primary-container/20',   text: 'text-primary-container',  dot: 'bg-primary-container' },
  manager:     { bg: 'bg-secondary/10',            text: 'text-secondary',          dot: 'bg-secondary' },
  agent:       { bg: 'bg-surface-container-high',  text: 'text-on-surface-variant', dot: 'bg-outline' },
};

const roleLabel: Record<string, string> = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  agent: 'Agent',
};

const roleIcon: Record<string, React.ElementType> = {
  super_admin: ShieldCheck,
  manager: UserCog,
  agent: Users,
};

const agentStatusStyle: Record<string, { bg: string; text: string; dot: string }> = {
  approved: { bg: 'bg-emerald-50',      text: 'text-emerald-700',        dot: 'bg-emerald-500' },
  pending:  { bg: 'bg-amber-500/10',    text: 'text-amber-700',          dot: 'bg-amber-500' },
  rejected: { bg: 'bg-error-container', text: 'text-on-error-container', dot: 'bg-error' },
};

export function UserAvatar({ user, size = 'md' }: { user: ApiUser; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';
  const text = size === 'sm' ? 'text-sm' : 'text-base';
  return (
    <div className={`${dim} rounded-full bg-secondary/10 flex items-center justify-center shrink-0 overflow-hidden`}>
      {user.avatar_url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
        : <span className={`${text} font-bold text-secondary`}>
            {user.full_name?.charAt(0)?.toUpperCase() ?? '?'}
          </span>
      }
    </div>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const s = roleStyle[role] ?? roleStyle.agent;
  const Icon = roleIcon[role] ?? Users;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      <Icon size={10} />
      {roleLabel[role] ?? role}
    </span>
  );
}

export function AgentStatusBadge({ status }: { status: string }) {
  const s = agentStatusStyle[status] ?? agentStatusStyle.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

interface UserCardProps {
  user: ApiUser;
  onDelete: (id: string) => void;
  deleting: string | null;
}

export function UserCard({ user, onDelete, deleting }: UserCardProps) {
  const roleName = user.role ?? 'agent';

  return (
    <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden shadow-[0_2px_12px_rgba(13,28,50,0.06)]">

      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-outline-variant/10">
        <UserAvatar user={user} size="md" />
        <div className="min-w-0">
          <p className="text-base font-bold text-on-surface truncate">{user.full_name}</p>
          <div className="mt-1">
            <RoleBadge role={roleName} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col gap-2.5 flex-1">
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <Mail size={13} className="shrink-0 text-secondary/70" />
          <span className="truncate">{user.email}</span>
        </div>
        {user.phone && (
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Phone size={13} className="shrink-0 text-secondary/70" />
            {user.phone}
          </div>
        )}
        {roleName === 'agent' && user.agent && (
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="p-2.5 rounded-lg bg-surface-container-low/60 flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Agent Status</span>
              <AgentStatusBadge status={user.agent.approval_status} />
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container-low/60 flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Specialization</span>
              <span className="text-xs font-medium text-on-surface truncate mt-0.5">{user.agent.specialization ?? '—'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-outline-variant/10 flex items-center justify-between gap-2">
        <p className="text-xs text-on-surface-variant font-mono truncate">ID: {user.id.slice(0, 8)}…</p>
        {roleName !== 'super_admin' && (
          <button
            onClick={() => onDelete(user.id)}
            disabled={deleting === user.id}
            className="flex items-center gap-1 px-3 py-1.5 bg-error-container hover:bg-error/10 text-on-error-container rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Trash2 size={12} />
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
