import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

// Measure before paint in the browser; fall back silently during server rendering.
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

type Tab = { value: string; label: string; icon?: React.ComponentType<{ className?: string }> };

// Segmented control whose glass "drop" slides to the selected tab. Arrow keys move between tabs.
export function LiquidTabs({ tabs, value, onChange, label, className }: { tabs: Tab[]; value: string; onChange: (v: string) => void; label: string; className?: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  useIsoLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[tabs.findIndex((t) => t.value === value)];
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [value, tabs]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    onChange(tabs[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className={cn('no-scrollbar relative inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-ink/5 p-1', className)}>
      {pill && (
        <span
          aria-hidden
          className="glass-strong absolute top-1 bottom-1 rounded-full transition-[left,width] duration-500 ease-[cubic-bezier(0.3,1.4,0.5,1)]"
          style={{ left: pill.left, width: pill.width }}
        />
      )}
      {tabs.map((t, i) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn('relative z-10 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors', active ? 'text-ink' : 'text-slate-600 hover:text-ink')}
          >
            {t.icon && <t.icon className="h-4 w-4" />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
