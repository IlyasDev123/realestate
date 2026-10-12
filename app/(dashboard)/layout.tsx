'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { ToastProvider } from '@/components/ui/Toast';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { prefs } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-outline-variant border-t-secondary-container rounded-full animate-spin" />
          <p className="text-on-surface-variant text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const sidebarSpacer = prefs.compact ? 'lg:w-16' : 'lg:w-72';

  return (
    <div className="min-h-screen bg-surface flex font-sans">
      {/* Sidebar spacer — keeps flex-1 from sliding under the fixed sidebar */}
      <div className={`hidden lg:flex ${sidebarSpacer} lg:shrink-0 transition-all duration-300`}>
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 pt-16 overflow-y-auto bg-surface">
          <div className="p-8 max-w-[1400px] w-full mx-auto">
            <ToastProvider>{children}</ToastProvider>
          </div>
        </main>
      </div>
    </div>
  );
}
