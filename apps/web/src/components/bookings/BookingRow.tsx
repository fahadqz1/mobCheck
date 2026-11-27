import Link from 'next/link';
import { ChevronRight, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/Feedback';
import { BOOKING_STATUS, formatDate, fullName } from '@/lib/format';

export type BookingSummary = {
  id: string;
  status: string;
  inspectionDate: string;
  createdAt: string;
  brand: { name: string };
  model: { name: string };
  shop: { name: string; slug: string; city: string; area: string };
  customer: { firstName: string | null; lastName: string | null };
  inspector?: { user: { firstName: string | null; lastName: string | null } } | null;
  inspectionReport?: { reportNumber: string; overallAssessment: string } | null;
};

const hrefFor = (perspective: string, id: string) =>
  ({ customer: `/dashboard/bookings/${id}`, shop: `/vendor/bookings/${id}`, inspector: `/inspector/bookings/${id}`, admin: `/admin/bookings/${id}` } as Record<string, string>)[perspective];

export function BookingRow({ booking, perspective }: { booking: BookingSummary; perspective: 'customer' | 'shop' | 'inspector' | 'admin' }) {
  const status = BOOKING_STATUS[booking.status] || { label: booking.status, tone: 'neutral' as const };
  const secondary =
    perspective === 'customer'
      ? `${booking.shop.name} · ${booking.shop.area}, ${booking.shop.city}`
      : perspective === 'admin'
        ? `${fullName(booking.customer)} → ${booking.shop.name}`
        : `Customer: ${fullName(booking.customer)}`;
  return (
    <li>
      <Link href={hrefFor(perspective, booking.id)} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Smartphone className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{booking.brand.name} {booking.model.name}</p>
          <p className="truncate text-sm text-slate-600">{secondary}</p>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-sm text-slate-700">{formatDate(booking.inspectionDate, true)}</p>
          <p className="text-xs text-slate-600">Ref {booking.id.slice(-8).toUpperCase()}</p>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      </Link>
    </li>
  );
}
