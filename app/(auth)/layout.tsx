import Link from 'next/link';
import { Building2 } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col relative overflow-x-hidden">
      {/* Ambient gradient backgrounds */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(13,28,50,0.12),rgba(248,249,255,0))]" />
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_bottom_left,rgba(254,147,44,0.04),transparent_40%)]" />

      {/* Header */}
      <header className="relative z-20 w-full px-6 lg:px-12 py-4 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 w-fit group">
            <div className="w-8 h-8 rounded-lg bg-surface-container-low border border-outline-variant/40 flex items-center justify-center">
              <Building2 size={16} className="text-primary-container" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-base font-semibold tracking-tight text-on-surface leading-none">EstateLux</span>
              <span className="text-[10px] font-semibold text-secondary uppercase tracking-widest mt-0.5">RMS Enterprise</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-2 text-on-surface-variant text-xs bg-surface-container-low px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span>256-Bit Encrypted Portal</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>

      {/* Footer */}
      <footer className="relative z-20 w-full px-6 py-4 bg-surface-container-lowest/60 backdrop-blur-md shadow-[0_-1px_6px_rgba(0,0,0,0.02)]">
        <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center gap-4 text-on-surface-variant text-xs">
            <span>Discreet Fiduciary Portal</span>
            <span className="text-outline-variant">•</span>
            <span>ISO 27001 Certified</span>
          </div>
          <p className="text-on-surface-variant text-xs">© 2025 EstateLux Premier Realty Inc.</p>
        </div>
      </footer>
    </div>
  );
}
