import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Stars({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <span className="inline-flex" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn(cls, i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200')} />
      ))}
    </span>
  );
}

export function Rating({ value, count }: { value: number | null; count: number }) {
  if (!value || count === 0) return <span className="text-sm text-slate-500">No reviews yet</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <Stars value={value} />
      <span className="font-semibold">{value.toFixed(1)}</span>
      <span className="text-slate-500">({count})</span>
      <span className="sr-only">{value.toFixed(1)} out of 5 from {count} reviews</span>
    </span>
  );
}

export function StarInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" role="radio" aria-checked={value === i} aria-label={`${i} star${i > 1 ? 's' : ''}`} onClick={() => onChange(i)} className="rounded p-0.5">
          <Star className={cn('h-7 w-7', i <= value ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-300 hover:text-amber-300')} />
        </button>
      ))}
    </div>
  );
}
