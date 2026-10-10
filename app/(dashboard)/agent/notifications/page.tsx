'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, CheckCheck, ChevronLeft, ChevronRight,
  UserPlus, Clock, TrendingUp, DollarSign, RefreshCw, Settings,
} from 'lucide-react';
import { notificationsApi, ApiError } from '@/lib/api';
import { ApiNotification } from '@/lib/api-types';
import { useToast } from '@/components/ui/Toast';

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const TYPE_CFG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  new_lead:         { icon: UserPlus,   color: 'text-blue-600',           bg: 'bg-blue-50' },
  followup_due:     { icon: Clock,      color: 'text-amber-600',          bg: 'bg-amber-50' },
  deal_closed:      { icon: TrendingUp, color: 'text-emerald-600',        bg: 'bg-emerald-50' },
  payment_received: { icon: DollarSign, color: 'text-secondary',          bg: 'bg-secondary/10' },
  status_change:    { icon: RefreshCw,  color: 'text-purple-600',         bg: 'bg-purple-50' },
  system:           { icon: Settings,   color: 'text-on-surface-variant', bg: 'bg-surface-container' },
};

function NotifIcon({ type }: { type: string }) {
  const cfg = TYPE_CFG[type] ?? TYPE_CFG.system;
  const Icon = cfg.icon;
  return (
    <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
      <Icon size={17} className={cfg.color} />
    </div>
  );
}

function getNotificationUrl(notif: ApiNotification): string | null {
  if (!notif.related_id || !notif.related_type) return null;
  switch (notif.related_type) {
    case 'lead':     return `/agent/leads/${notif.related_id}`;
    case 'deal':     return `/agent/deals/${notif.related_id}`;
    case 'property': return `/agent/properties/${notif.related_id}/edit`;
    default:         return null;
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AgentNotificationsPage() {
  const router = useRouter();
  const toast  = useToast();

  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [markingAll, setMarkingAll]       = useState(false);
  const [page, setPage]                   = useState(1);
  const [lastPage, setLastPage]           = useState(1);
  const [total, setTotal]                 = useState(0);
  const [unreadOnly, setUnreadOnly]       = useState(false);

  const load = useCallback(async (p = 1, onlyUnread = unreadOnly) => {
    setLoading(true);
    try {
      const res = await notificationsApi.list({ page: p, per_page: 15, unread: onlyUnread || undefined });
      setNotifications(res.data);
      setTotal(res.meta.total);
      setLastPage(res.meta.last_page);
      setPage(p);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => { load(1); }, [load]);

  function handleFilterChange(onlyUnread: boolean) {
    setUnreadOnly(onlyUnread);
    load(1, onlyUnread);
  }

  function markReadOptimistic(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    notificationsApi.markRead(id).catch(() => {});
  }

  function handleNotifClick(notif: ApiNotification) {
    if (!notif.is_read) markReadOptimistic(notif.id);
    const url = getNotificationUrl(notif);
    if (url) router.push(url);
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Error marking notifications', 'error');
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  function renderPageButtons() {
    if (lastPage <= 1) return null;
    const pages: (number | '...')[] = [];
    if (lastPage <= 7) {
      for (let i = 1; i <= lastPage; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(lastPage - 1, page + 1); i++) pages.push(i);
      if (page < lastPage - 2) pages.push('...');
      pages.push(lastPage);
    }
    return pages;
  }

  const pageButtons = renderPageButtons();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span className="font-semibold uppercase tracking-wider">RMS Enterprise</span>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider">Notifications</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface font-display">Notifications</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {total > 0 ? `${total} notification${total !== 1 ? 's' : ''} total` : 'No notifications yet'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-on-secondary text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-md shrink-0"
          >
            {markingAll
              ? <span className="w-4 h-4 border-2 border-on-secondary/30 border-t-on-secondary rounded-full animate-spin" />
              : <CheckCheck size={14} />
            }
            Mark all read
          </button>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total',  value: total,                                      dot: 'bg-outline-variant' },
          { label: 'Unread', value: notifications.filter(n => !n.is_read).length, dot: 'bg-secondary' },
          { label: 'Read',   value: notifications.filter(n => n.is_read).length,  dot: 'bg-emerald-500' },
        ].map(({ label, value, dot }) => (
          <div key={label} className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{label}</p>
            </div>
            <p className="text-2xl font-bold text-on-surface">{value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {[
          { label: 'All notifications', value: false },
          { label: 'Unread only',       value: true  },
        ].map(({ label, value }) => (
          <button
            key={label}
            onClick={() => handleFilterChange(value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              unreadOnly === value
                ? 'bg-secondary text-on-secondary shadow-sm'
                : 'bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-2 border-outline-variant border-t-secondary rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center">
              <Bell size={24} className="text-secondary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-on-surface">
                {unreadOnly ? 'No unread notifications' : 'No notifications'}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">You&apos;re all caught up!</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {notifications.map(notif => {
              const url = getNotificationUrl(notif);
              return (
                <button
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`w-full text-left flex items-start gap-4 px-5 py-4 transition-colors group ${
                    !notif.is_read
                      ? 'bg-secondary/[0.04] hover:bg-secondary/[0.07]'
                      : 'hover:bg-surface-container-low/40'
                  } ${url ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <NotifIcon type={notif.type} />
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${!notif.is_read ? 'font-semibold text-on-surface' : 'font-medium text-on-surface/80'}`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-secondary shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{notif.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-[11px] text-outline">{timeAgo(notif.created_at)}</p>
                      {url && (
                        <span className="text-[11px] text-secondary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          View →
                        </span>
                      )}
                    </div>
                  </div>
                  {url && (
                    <ChevronRight size={15} className="text-outline-variant opacity-0 group-hover:opacity-60 transition-opacity self-center shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-on-surface-variant">Page {page} of {lastPage}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => load(page - 1)} disabled={page <= 1}
              className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface disabled:opacity-40 transition-colors">
              <ChevronLeft size={16} />
            </button>
            {pageButtons?.map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-on-surface-variant text-sm">…</span>
              ) : (
                <button key={p} onClick={() => load(p as number)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    page === p ? 'bg-secondary text-on-secondary' : 'border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button onClick={() => load(page + 1)} disabled={page >= lastPage}
              className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface disabled:opacity-40 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
