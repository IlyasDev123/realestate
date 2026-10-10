'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Building2, Home, PlusCircle, GitBranch,
  Handshake, Bell, Settings, UserCircle, LogOut, Menu, X,
  UserCheck, Users2, UserCog, Activity, TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';

// ── Nav data ──────────────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: number;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const adminSections: NavSection[] = [
  {
    items: [
      { label: 'Dashboard',          href: '/admin',             icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: 'Properties',
    items: [
      { label: 'All Properties',     href: '/admin/properties',  icon: Home },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Agent Applications', href: '/admin/agents',      icon: UserCheck },
      { label: 'Manage Users',       href: '/admin/users',       icon: UserCog },
    ],
  },
  {
    title: 'CRM',
    items: [
      { label: 'Leads',              href: '/admin/leads',       icon: GitBranch },
      { label: 'Clients',            href: '/admin/clients',     icon: Users2 },
      { label: 'Deals',              href: '/admin/deals',       icon: Handshake },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Notifications',      href: '/admin/notifications', icon: Bell },
      { label: 'Settings',           href: '/admin/settings',    icon: Settings },
      { label: 'My Profile',         href: '/profile',           icon: UserCircle },
    ],
  },
];

const agentSections: NavSection[] = [
  {
    items: [
      { label: 'Dashboard',          href: '/agent',             icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: 'Properties',
    items: [
      { label: 'My Properties',      href: '/agent/properties',  icon: Home },
      { label: 'Add Property',       href: '/agent/properties/new', icon: PlusCircle, exact: true },
    ],
  },
  {
    title: 'CRM',
    items: [
      { label: 'Leads Pipeline',     href: '/agent/leads',       icon: GitBranch },
      { label: 'Add Lead',           href: '/agent/leads/new',   icon: Activity, exact: true },
      { label: 'My Deals',           href: '/agent/deals',       icon: Handshake },
      { label: 'New Deal',           href: '/agent/deals/new',   icon: TrendingUp, exact: true },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Notifications',      href: '/agent/notifications', icon: Bell },
      { label: 'My Profile',         href: '/agent/profile',     icon: UserCircle },
      { label: 'Settings',           href: '/profile',           icon: Settings },
    ],
  },
];

// ── Nav link ──────────────────────────────────────────────────────────────────
function NavLink({
  item,
  pathname,
  allItems,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  allItems: NavItem[];
  onClick?: () => void;
}) {
  const active = item.exact
    ? pathname === item.href
    : pathname === item.href ||
      (pathname.startsWith(item.href + '/') &&
        !allItems.some(other => other !== item && other.exact && pathname === other.href));

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
        active
          ? 'bg-secondary/10 text-secondary font-semibold'
          : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
      }`}
    >
      {/* Left accent bar */}
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full transition-all duration-150 ${
          active ? 'h-5 bg-secondary' : 'h-0 bg-secondary'
        }`}
      />

      <div className="flex items-center gap-3 pl-1">
        <item.icon
          size={16}
          className={`shrink-0 transition-colors ${active ? 'text-secondary' : 'text-on-surface-variant/70 group-hover:text-on-surface'}`}
        />
        <span className="leading-none tracking-[-0.01em]">{item.label}</span>
      </div>

      {item.badge != null && item.badge > 0 && (
        <span className="ml-auto px-1.5 py-0.5 rounded-full bg-secondary text-on-secondary text-[10px] font-bold leading-none">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// ── Shared brand mark ─────────────────────────────────────────────────────────
function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center shadow-sm shrink-0">
        <Building2 size={15} className="text-on-secondary" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[15px] font-bold tracking-tight text-on-surface">EstateLux</span>
        <span className="text-[9px] font-semibold text-on-surface-variant/50 uppercase tracking-[0.12em] mt-0.5">
          RMS Enterprise
        </span>
      </div>
    </div>
  );
}

// ── Shared nav renderer ───────────────────────────────────────────────────────
function NavSections({
  sections,
  pathname,
  onLinkClick,
}: {
  sections: NavSection[];
  pathname: string;
  onLinkClick?: () => void;
}) {
  const allItems = sections.flatMap(s => s.items);
  return (
    <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-5">
      {sections.map((section, i) => (
        <div key={i}>
          {section.title && (
            <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant/40 select-none">
              {section.title}
            </p>
          )}
          <div className="space-y-0.5">
            {section.items.map(item => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                allItems={allItems}
                onClick={onLinkClick}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

// ── Desktop sidebar ───────────────────────────────────────────────────────────
export default function Sidebar() {
  const { isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const sections = isAdmin ? adminSections : agentSections;

  async function handleLogout() {
    setLoggingOut(true);
    try { await authApi.logout(); } catch { /* ignore */ }
    logout();
    router.push('/login');
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-lowest border-r border-outline-variant/20 z-50 flex flex-col select-none">
      {/* Brand */}
      <div className="h-16 px-5 flex items-center shrink-0 border-b border-outline-variant/20">
        <BrandMark />
      </div>

      {/* Navigation */}
      <NavSections sections={sections} pathname={pathname} />

      {/* Footer */}
      <div className="px-4 py-4 shrink-0 border-t border-outline-variant/20">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:text-error hover:bg-error-container/15 transition-colors disabled:opacity-40"
        >
          <LogOut size={16} className="shrink-0" />
          <span>{loggingOut ? 'Signing out…' : 'Sign Out'}</span>
        </button>
      </div>
    </aside>
  );
}

// ── Mobile sidebar ────────────────────────────────────────────────────────────
export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const { isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const sections = isAdmin ? adminSections : agentSections;

  async function handleLogout() {
    try { await authApi.logout(); } catch { /* ignore */ }
    logout();
    router.push('/login');
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors rounded-lg"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-inverse-surface/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <aside className="relative w-72 bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col shadow-2xl">
            {/* Brand */}
            <div className="h-16 px-5 flex items-center justify-between shrink-0 border-b border-outline-variant/20">
              <BrandMark />
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav */}
            <NavSections sections={sections} pathname={pathname} onLinkClick={() => setOpen(false)} />

            {/* Footer */}
            <div className="px-4 py-4 shrink-0 border-t border-outline-variant/20">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:text-error hover:bg-error-container/15 transition-colors"
              >
                <LogOut size={16} className="shrink-0" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
