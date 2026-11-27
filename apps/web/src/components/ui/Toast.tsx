import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/cn';

type Toast = { id: number; tone: 'success' | 'error'; message: string };
const ToastContext = createContext<(tone: Toast['tone'], message: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((tone: Toast['tone'], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, tone, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6">
        {toasts.map((t) => (
          <div key={t.id} data-testid="toast" className={cn('pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white p-3.5 text-sm shadow-overlay', t.tone === 'success' ? 'border-emerald-200' : 'border-red-200')}>
            {t.tone === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />}
            <p className="flex-1 text-slate-800">{t.message}</p>
            <button type="button" aria-label="Dismiss" onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))} className="text-slate-400 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
