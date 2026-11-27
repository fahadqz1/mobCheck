import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Pagination({ page, pages }: { page: number; pages: number }) {
  const router = useRouter();
  if (pages <= 1) return null;
  const href = (p: number) => ({ pathname: router.pathname, query: { ...router.query, page: p } });
  const item = 'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium';
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(item, 'border-slate-300 bg-white hover:bg-slate-50')}><ChevronLeft className="h-4 w-4" aria-hidden /><span className="sr-only">Previous page</span></Link>
      ) : null}
      <span className="px-2 text-sm text-slate-600">Page {page} of {pages}</span>
      {page < pages ? (
        <Link href={href(page + 1)} className={cn(item, 'border-slate-300 bg-white hover:bg-slate-50')}><ChevronRight className="h-4 w-4" aria-hidden /><span className="sr-only">Next page</span></Link>
      ) : null}
    </nav>
  );
}
