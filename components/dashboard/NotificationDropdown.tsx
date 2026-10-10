'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell, Check, CheckCheck, X,
  UserPlus, Clock, TrendingUp, DollarSign, RefreshCw, Settings,
} from 'lucide-react';
import { notificationsApi } from '@/lib/api';
import { ApiNotification } from '@/lib/api-types';
import { useAuth } from '@/contexts/AuthContext';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  new_lead:         { icon: UserPlus,    color: 'text-blue-600',          bg: 'bg-blue-50' },
  followup_due:     { icon: Clock,       color: 'text-amber-600',         bg: 'bg-amber-50' },
  deal_closed:      { icon: TrendingUp,  color: 'text-emerald-600',       bg: 'bg-emerald-50' },
  payment_received: { icon: DollarSign,  color: 'text-secondary',         bg: 'bg-secondary-fixed/30' },
  status_change:    { icon: RefreshCw,   color: 'text-purple-600',        bg: 'bg-purple-50' },
  system:           { icon: Settings,    color: 'text-on-surface-variant', bg: 'bg-surface-container' },
};

function NotifIcon({ type }: { type: string }) {
  const cfg = typeConfig[type] ?? typeConfig.system;
  const Icon = cfg.icon;
  return (
    <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
      <Icon size={16} className={cfg.color} />
    </div>
  );
}

function getNotificationUrl(notif: ApiNotification, role: string | null): string | null {
  if (!notif.related_id || !notif.related_type) return null;
  const isAdmin = role === 'super_admin' || role === 'manager';
  const prefix = isAdmin ? '/admin' : '/agent';
  switch (notif.related_type) {
    case 'lead':     return `${prefix}/leads/${notif.related_id}`;
    case 'deal':     return `${prefix}/deals/${notif.related_id}`;
    case 'property': return `${prefix}/properties/${notif.related_id}/edit`;
    case 'agent':    return '/admin/agents';
    default:         return null;
  }
}

export default function NotificationDropdown() {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen]                   = useState(false);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading]             = useState(false);
  const [markingAll, setMarkingAll]       = useState(false);
  const [unreadTotal, setUnreadTotal]     = useState(0);
  const panelRef                          = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.list({ per_page: 5 });
      setNotifications(res.data);
      setUnreadTotal(res.unread_count);
    } catch {
      // silently fail — bell is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  // Defer initial load by 1.5s so page-critical API calls get through first.
  useEffect(() => {
    const t = setTimeout(load, 1500);
    return () => clearTimeout(t);
  }, [load]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function toggle() {
    if (!open) load();
    setOpen(v => !v);
  }

  function markReadOptimistic(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadTotal(prev => Math.max(0, prev - 1));
    notificationsApi.markRead(id).catch(() => {});
  }

  async function handleNotifClick(notif: ApiNotification) {
    if (!notif.is_read) markReadOptimistic(notif.id);
    const url = getNotificationUrl(notif, user?.role ?? null);
    if (url) {
      setOpen(false);
      router.push(url);
    }
  }

  async function markAll() {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadTotal(0);
    } catch { /* ignore */ } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={toggle}
        aria-label="Notifications"
        aria-expanded={open}
        className={`relative p-2 rounded-lg transition-colors ${
          open
            ? 'bg-surface-container-high text-on-surface'
            : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
        }`}
      >
        <Bell size={19} />
        {unreadTotal > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary text-on-secondary text-[10px] font-bold flex items-center justify-center leading-none shadow-sm">
            {unreadTotal > 99 ? '99+' : unreadTotal}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[360px] max-h-[520px] bg-surface-container-lowest rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-outline-variant/20 flex flex-col z-50 overflow-hidden animate-scale-in origin-top-right">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-outline-variant/10 shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-on-surface">Notifications</h3>
              {unreadTotal > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-secondary-fixed/40 text-secondary text-xs font-semibold">
                  {unreadTotal} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadTotal > 0 && (
                <button
                  onClick={markAll}
                  disabled={markingAll}
                  title="Mark all as read"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-40"
                >
                  <CheckCheck size={13} />
                  <span className="hidden sm:inline">All read</span>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 overscroll-contain">
            {loading ? (
              <div className="flex items-center justify-center py-14">
                <div className="w-6 h-6 border-2 border-outline-variant border-t-secondary rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center">
                  <Bell size={22} className="text-on-surface-variant/40" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-on-surface">All caught up</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">No new notifications</p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-outline-variant/10">
                {notifications.map(notif => {
                  const url = getNotificationUrl(notif, user?.role ?? null);
                  return (
                    <li key={notif.id}>
                      <button
                        onClick={() => handleNotifClick(notif)}
                        className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors group ${
                          !notif.is_read
                            ? 'bg-secondary-fixed/[0.07] hover:bg-secondary-fixed/[0.12]'
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
                              <span className="w-2 h-2 rounded-full bg-secondary shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[11px] text-outline">{timeAgo(notif.created_at)}</p>
                            {url && (
                              <span className="text-[11px] text-secondary font-medium">Tap to view →</span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="shrink-0 border-t border-outline-variant/10 px-4 py-3">
              <Link
                href={user?.role === 'agent' ? '/agent/notifications' : '/admin/notifications'}
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold text-secondary hover:bg-secondary-fixed/20 transition-colors"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
