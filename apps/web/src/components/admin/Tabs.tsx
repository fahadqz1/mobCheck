import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/cn';

export function QueryTabs({ param = 'status', tabs }: { param?: string; tabs: { value: string; label: string; count?: number }[] }) {
  const router = useRouter();
  const current = (router.query[param] as string) || tabs[0].value;
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
      {tabs.map((t) => (
        <Link
          key={t.value}
          role="tab"
          aria-selected={current === t.value}
          href={{ pathname: router.pathname, query: t.value === tabs[0].value ? {} : { [param]: t.value } }}
          className={cn('-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-medium', current === t.value ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-600 hover:text-ink')}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 text-xs text-slate-600">{t.count}</span>}
        </Link>
      ))}
    </div>
  );
}
