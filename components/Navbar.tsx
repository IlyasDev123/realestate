'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, Home, LogIn, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const NAV_LINKS = [
  { label: 'Buy',     href: '/properties?purpose=sale' },
  { label: 'Rent',    href: '/properties?purpose=rent' },
  { label: 'Agents',  href: '/agents' },
  { label: 'Compare', href: '/compare' },
  { label: 'About',   href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const pathname  = usePathname();
  const { user, logout, isLoading } = useAuth();

  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled,     setScrolled]     = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    const base = href.split('?')[0];
    return base === '/' ? pathname === '/' : pathname.startsWith(base);
  }

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 bg-surface/95 backdrop-blur-xl transition-all duration-300 ${
        scrolled ? 'shadow-[0_1px_8px_rgba(0,0,0,0.06)]' : ''
      }`}
    >
      <div className="h-20 max-w-[1360px] mx-auto px-6 lg:px-8 flex items-center justify-between">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
            <Home size={16} className="text-on-primary" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-on-surface font-display">
            EstateLux
          </span>
        </Link>

        {/* ── Desktop Nav ── */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm py-1 transition-colors relative group ${
                isActive(href)
                  ? 'text-on-surface font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface font-medium'
              }`}
            >
              {label}
              <span
                className={`absolute -bottom-0.5 left-0 h-px bg-secondary transition-all duration-300 ${
                  isActive(href) ? 'w-full' : 'w-0 group-hover:w-full'
                }`}
              />
            </Link>
          ))}
        </nav>

        {/* ── Right Actions ── */}
        <div className="hidden md:flex items-center gap-3">
          {isLoading ? (
            <div className="w-24 h-9 bg-surface-container rounded-lg skeleton" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-medium transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                  <span className="text-on-primary text-xs font-bold">
                    {user.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="max-w-28 truncate">{user.full_name}</span>
                <ChevronDown
                  size={14}
                  className={`shrink-0 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/20 py-1.5 z-50">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    <LayoutDashboard size={15} />
                    Dashboard
                  </Link>
                  <div className="border-t border-outline-variant/10 my-1" />
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-error-container/20 transition-colors"
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <LogIn size={15} />
                Sign In
              </Link>
              <Link
                href="/add-property"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-surface-container-highest text-on-surface hover:bg-surface-container-high transition-all"
              >
                List Property
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile Toggle ── */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── Mobile Menu ── */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="glass border-t border-outline-variant/10 px-6 py-4 flex flex-col gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive(href)
                  ? 'bg-surface-container text-on-surface font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              {label}
            </Link>
          ))}

          <div className="border-t border-outline-variant/10 my-2" />

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2"
              >
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error-container/20 transition-colors flex items-center gap-2 text-left"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/add-property"
                className="mt-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-surface-container-highest text-on-surface text-center hover:bg-surface-container-high transition-colors"
              >
                List Property
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
