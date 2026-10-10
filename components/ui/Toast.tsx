'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: string; type: ToastType; message: string; }
type ToastFn = (message: string, type?: ToastType) => void;

const ToastCtx = createContext<ToastFn>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

function ToastBubble({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 16); return () => clearTimeout(t); }, []);

  const cfg = {
    success: { bg: 'bg-emerald-600', Icon: CheckCircle2 },
    error:   { bg: 'bg-red-600',     Icon: XCircle },
    info:    { bg: 'bg-primary-container', Icon: Info },
  }[item.type];

  return (
    <div className={`pointer-events-auto flex items-center gap-3 min-w-[260px] max-w-sm px-4 py-3 rounded-xl shadow-lg text-white transition-all duration-300 ${cfg.bg} ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
      <cfg.Icon size={16} className="shrink-0" />
      <span className="text-sm font-medium flex-1">{item.message}</span>
      <button onClick={onClose} className="shrink-0 opacity-75 hover:opacity-100 transition-opacity ml-1">
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast: ToastFn = useCallback((message, type = 'success') => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  function close(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastBubble key={t.id} item={t} onClose={() => close(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
