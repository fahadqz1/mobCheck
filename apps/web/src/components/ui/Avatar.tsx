import { cn } from '@/lib/cn';

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const sizes = { sm: 'h-7 w-7 text-xs', md: 'h-8 w-8 text-xs', lg: 'h-11 w-11 text-sm', xl: 'h-16 w-16 text-lg' };
  return (
    <span aria-hidden className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800', sizes[size], className)}>
      {initials(name)}
    </span>
  );
}
