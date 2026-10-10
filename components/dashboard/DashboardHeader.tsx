'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, LogOut, UserCircle, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MobileSidebar } from './Sidebar';
import NotificationDropdown from './NotificationDropdown';
import { authApi } from '@/lib/api';

// ── Route progress bar ────────────────────────────────────────────────────────
function RouteProgress() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setVisible(true);
    setWidth(0);
    timers.current.push(setTimeout(() => setWidth(40), 30));
    timers.current.push(setTimeout(() => setWidth(70), 150));
    timers.current.push(setTimeout(() => setWidth(90), 400));
    timers.current.push(setTimeout(() => setWidth(100), 600));
    timers.current.push(setTimeout(() => setVisible(false), 900));
    return () => timers.current.forEach(clearTimeout);
  }, [pathname]);

  if (!visible) return null;
  return (
    <div
      className="fixed top-0 left-0 h-0.5 bg-secondary z-[200] transition-all ease-out"
      style={{ width: `${width}%`, transitionDuration: width === 100 ? '200ms' : '300ms' }}
    />
  );
}

// ── User menu ─────────────────────────────────────────────────────────────────
function UserMenu() {
  const { user, isAdmin, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const roleLabel = user?.role === 'super_admin'
    ? 'Managing Partner'
    : user?.role === 'manager'
    ? 'Manager'
    : 'Advisory Agent';

  const initials = user?.full_name
    ?.split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'U';

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try { await authApi.logout(); } catch { /* ignore */ }
    logout();
    router.push('/login');
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-xl hover:bg-surface-container-high transition-colors group"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-on-secondary text-xs font-bold shrink-0 shadow-sm">
          {initials}
        </div>
        {/* Name + role */}
        <div className="hidden md:flex flex-col text-left">
          <span className="text-[13px] font-semibold text-on-surface leading-tight">{user?.full_name}</span>
          <span className="text-[11px] text-on-surface-variant leading-none mt-0.5">{roleLabel}</span>
        </div>
        <ChevronDown
          size={13}
          className={`hidden md:block text-on-surface-variant/60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/20 overflow-hidden z-50">
          {/* Identity header */}
          <div className="px-4 py-3 bg-surface-container-low/60 border-b border-outline-variant/20">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-on-secondary text-sm font-bold shrink-0">
                {initials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-semibold text-on-surface truncate leading-tight">{user?.full_name}</span>
                <span className="text-[11px] text-on-surface-variant truncate mt-0.5">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
            >
              <UserCircle size={15} />
              My Profile
            </Link>
            <Link
              href={isAdmin ? '/admin/settings' : '/profile'}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
            >
              <Settings size={15} />
              Settings
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-outline-variant/20 py-1">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors disabled:opacity-50"
            >
              <LogOut size={15} />
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main header ───────────────────────────────────────────────────────────────
export default function DashboardHeader() {
  return (
    <>
      <RouteProgress />
      <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] z-40 px-6 flex items-center gap-4">
        {/* Mobile menu */}
        <div className="lg:hidden">
          <MobileSidebar />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Live pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-secondary" />
            </span>
            <span className="text-xs text-on-surface-variant font-medium">Live</span>
          </div>

          {/* Notifications */}
          <NotificationDropdown />

          {/* Divider */}
          <div className="hidden md:block w-px h-6 bg-outline-variant/30 mx-1" />

          {/* User menu */}
          <UserMenu />
        </div>
      </header>
    </>
  );
}
