import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

export function Dropdown({
  trigger,
  label,
  children,
  align = 'right',
  triggerClassName,
  menuClassName = 'w-60',
}: {
  trigger: React.ReactNode;
  // Omit when the trigger has visible text; it then names the button itself.
  label?: string;
  children: (close: () => void) => React.ReactNode;
  align?: 'left' | 'right';
  triggerClassName?: string;
  menuClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus();
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className={cn(
            'absolute top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-raised',
            menuClassName,
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export const menuItemClass =
  'flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-ink focus:bg-slate-50 focus:outline-none';
