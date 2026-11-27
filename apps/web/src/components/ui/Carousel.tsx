import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

// Horizontal snap carousel with round arrow controls that disable at either end.
export function Carousel({
  title,
  action,
  children,
  itemClassName = 'w-[78%] sm:w-[46%] lg:w-[23.5%]',
  label,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode[];
  itemClassName?: string;
  label: string;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    el?.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update, children]);

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  const arrow = 'flex h-10 w-10 items-center justify-center rounded-full transition disabled:cursor-default';
  return (
    <section aria-label={label}>
      <div className="mb-4 flex items-end justify-between gap-4">
        {title && <h2 className="text-2xl font-bold sm:text-[28px]">{title}</h2>}
        <div className="ml-auto flex items-center gap-3">
          {action}
          <div className="hidden gap-2 sm:flex">
            <button type="button" onClick={() => scroll(-1)} disabled={edges.start} aria-label={`Scroll ${label} back`} className={cn(arrow, edges.start ? 'bg-slate-200/70 text-slate-400' : 'bg-white text-ink shadow-card ring-1 ring-ink/10 hover:ring-ink/30')}>
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => scroll(1)} disabled={edges.end} aria-label={`Scroll ${label} forward`} className={cn(arrow, edges.end ? 'bg-slate-200/70 text-slate-400' : 'bg-ink text-white hover:bg-slate-800')}>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {/* Focusable so keyboard users can scroll it with the arrow keys. */}
      <ul ref={track} tabIndex={0} aria-label={label} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth rounded-3xl px-4 pb-2 focus-visible:ring-offset-[#f6f7f4] sm:-mx-0 sm:px-0">
        {children.map((child, i) => (
          // `relative` keeps absolutely positioned descendants (e.g. sr-only text) inside the scroll area.
          <li key={i} className={cn('relative shrink-0 snap-start', itemClassName)}>{child}</li>
        ))}
      </ul>
    </section>
  );
}
