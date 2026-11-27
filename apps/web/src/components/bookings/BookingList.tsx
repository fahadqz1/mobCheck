import Link from 'next/link';
import { useRouter } from 'next/router';
import { CalendarCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { cn } from '@/lib/cn';
import { BookingRow, type BookingSummary } from './BookingRow';

export const BOOKING_TABS = {
  active: ['AWAITING_PAYMENT', 'PAYMENT_CONFIRMED', 'AWAITING_SHOP_CONFIRMATION', 'BOOKING_ACCEPTED', 'INSPECTOR_ASSIGNED', 'INSPECTION_IN_PROGRESS', 'INSPECTION_SUBMITTED', 'REPORT_DELIVERED'],
  attention: ['AWAITING_SHOP_CONFIRMATION', 'PAYMENT_CONFIRMED', 'BOOKING_ACCEPTED', 'DISPUTE_RAISED', 'REFUND_PENDING', 'INSPECTION_SUBMITTED'],
  completed: ['COMPLETED'],
  closed: ['CANCELLED', 'REFUND_PENDING', 'REFUNDED', 'DISPUTE_RAISED'],
} as const;

export function BookingList({
  bookings,
  perspective,
  tabs,
  page,
  pages,
  empty,
}: {
  bookings: BookingSummary[];
  perspective: 'customer' | 'shop' | 'inspector' | 'admin';
  tabs: { key: string; label: string; count?: number }[];
  page: number;
  pages: number;
  empty: { title: string; description: string; action?: React.ReactNode };
}) {
  const router = useRouter();
  const current = (router.query.tab as string) || tabs[0].key;
  return (
    <>
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
        {tabs.map((t) => (
          <Link
            key={t.key}
            role="tab"
            aria-selected={current === t.key}
            href={{ pathname: router.pathname, query: t.key === tabs[0].key ? {} : { tab: t.key } }}
            className={cn('-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-medium', current === t.key ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500 hover:text-ink')}
          >
            {t.label}
            {t.count !== undefined && <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 text-xs text-slate-600">{t.count}</span>}
          </Link>
        ))}
      </div>
      {bookings.length === 0 ? (
        <EmptyState icon={CalendarCheck} title={empty.title} description={empty.description} action={empty.action} />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">{bookings.map((b) => <BookingRow key={b.id} booking={b} perspective={perspective} />)}</ul>
        </Card>
      )}
      <Pagination page={page} pages={pages} />
    </>
  );
}
