import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { CalendarDays, Check, ExternalLink, Flag, MapPin, Phone, Mail, Smartphone, User } from 'lucide-react';
import type { BookingView } from '@/lib/booking-page';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Alert, Badge } from '@/components/ui/Feedback';
import { Gallery } from '@/components/media/Gallery';
import { Stars } from '@/components/ui/Rating';
import { ComplaintModal } from '@/components/shops/ComplaintModal';
import { ASSESSMENT, BOOKING_STATUS, bookingRef, CHECK_RESULT, formatDate, formatPKR, fullName, PTA_LABEL } from '@/lib/format';
import { cn } from '@/lib/cn';
import { CustomerActions } from './CustomerActions';
import { ShopActions } from './ShopActions';
import { InspectorActions } from './InspectorActions';
import { AdminActions } from './AdminActions';

const STEPS = [
  { key: 'booked', label: 'Booked' },
  { key: 'paid', label: 'Paid' },
  { key: 'accepted', label: 'Shop accepted' },
  { key: 'assigned', label: 'Inspector assigned' },
  { key: 'inspecting', label: 'Inspecting' },
  { key: 'report', label: 'Report ready' },
  { key: 'done', label: 'Completed' },
];

const STEP_INDEX: Record<string, number> = {
  AWAITING_PAYMENT: 0,
  PAYMENT_CONFIRMED: 1,
  AWAITING_SHOP_CONFIRMATION: 1,
  BOOKING_ACCEPTED: 2,
  INSPECTOR_ASSIGNED: 3,
  INSPECTION_IN_PROGRESS: 4,
  INSPECTION_SUBMITTED: 4,
  REPORT_UNDER_REVIEW: 4,
  REPORT_DELIVERED: 5,
  REVIEW_WINDOW_OPEN: 5,
  DISPUTE_RAISED: 5,
  COMPLETED: 6,
};

export function useBookingAction(bookingId: string) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const run = async (action: string, extra: Record<string, unknown> = {}, onDone?: (data: any) => void) => {
    setPending(action);
    setError('');
    setFields({});
    try {
      const { api } = await import('@/lib/client');
      const data = await api(`/api/bookings/${bookingId}/actions`, { body: { action, ...extra } });
      if (onDone) onDone(data);
      else await router.replace(router.asPath, undefined, { scroll: false });
      return true;
    } catch (err: any) {
      setError(err.message);
      setFields(err.fields || {});
      return false;
    } finally {
      setPending(null);
    }
  };
  return { run, pending, error, fields, setError };
}

export function BookingDetail({ booking }: { booking: BookingView }) {
  const status = BOOKING_STATUS[booking.status];
  const [complaintOpen, setComplaintOpen] = useState(false);
  const step = STEP_INDEX[booking.status];
  const closed = ['CANCELLED', 'REFUND_PENDING', 'REFUNDED'].includes(booking.status);
  const grouped = useMemo(() => {
    const map = new Map<string, BookingView['results']>();
    booking.results.forEach((r) => map.set(r.category, [...(map.get(r.category) || []), r]));
    return Array.from(map.entries());
  }, [booking.results]);
  const counts = useMemo(() => booking.results.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.result]: (acc[r.result] || 0) + 1 }), {}), [booking.results]);

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Booking {bookingRef(booking.id)} · created {formatDate(booking.createdAt)}</p>
            <h2 className="mt-1 text-xl font-semibold">{booking.device.brand} {booking.device.model}</h2>
          </div>
          <Badge tone={status.tone} className="text-sm">{status.label}</Badge>
        </div>
        {!closed && step !== undefined && (
          <ol className="mt-6 grid grid-cols-7 gap-1" aria-label="Booking progress">
            {STEPS.map((s, i) => {
              const done = i < step || booking.status === 'COMPLETED';
              const current = i === step && booking.status !== 'COMPLETED';
              return (
                <li key={s.key} className="flex flex-col items-center text-center" aria-current={current ? 'step' : undefined}>
                  <span className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold', done ? 'bg-brand-700 text-white' : current ? 'bg-brand-100 text-brand-800 ring-2 ring-brand-600' : 'bg-slate-100 text-slate-400')}>
                    {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
                  </span>
                  <span className={cn('mt-1.5 hidden text-xs sm:block', done || current ? 'text-slate-700' : 'text-slate-400')}>{s.label}</span>
                </li>
              );
            })}
          </ol>
        )}
        {booking.status === 'DISPUTE_RAISED' && <Alert tone="warning" title="Dispute under review" className="mt-5">{booking.dispute?.reason}</Alert>}
        {booking.status === 'CANCELLED' && <Alert tone="info" title="This booking was cancelled" className="mt-5" />}
        {['REFUND_PENDING', 'REFUNDED'].includes(booking.status) && (
          <Alert tone={booking.status === 'REFUNDED' ? 'success' : 'info'} title={booking.status === 'REFUNDED' ? 'Refund paid' : 'Refund in progress'} className="mt-5">
            {booking.refunds[0]?.reason}
            {booking.refunds[0] ? ` · ${formatPKR(booking.refunds[0].amountPkr)}` : ''}
          </Alert>
        )}
        {booking.dispute?.resolution && booking.status !== 'DISPUTE_RAISED' && <p className="mt-3 text-sm text-slate-600">Resolution: {booking.dispute.resolution}</p>}
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card as="section">
            <CardHeader title="Appointment" />
            <CardBody className="grid gap-4 text-sm sm:grid-cols-2">
              <Info icon={CalendarDays} label="When" value={formatDate(booking.inspectionDate, true)} />
              <Info icon={MapPin} label="Where" value={<><Link href={`/shops/${booking.shop.slug}`} className="link">{booking.shop.name}</Link><br />{booking.shop.addressLine1}, {booking.shop.area}, {booking.shop.city}</>} />
              <Info icon={Smartphone} label="Device" value={[`${booking.device.brand} ${booking.device.model}`, booking.device.storageGb && `${booking.device.storageGb} GB`, booking.device.color, PTA_LABEL[booking.device.pta]].filter(Boolean).join(' · ')} />
              <Info icon={User} label={booking.party === 'customer' ? 'Inspector' : 'Customer'} value={booking.party === 'customer' ? booking.inspectorName || 'Not assigned yet' : fullName(booking.customer)} />
              {booking.party !== 'customer' && booking.customer.phone && <Info icon={Phone} label="Customer phone" value={<a className="link" href={`tel:${booking.customer.phone}`}>{booking.customer.phone}</a>} />}
              {booking.party !== 'customer' && booking.customer.email && <Info icon={Mail} label="Customer email" value={<a className="link break-all" href={`mailto:${booking.customer.email}`}>{booking.customer.email}</a>} />}
              {booking.party === 'customer' && <Info icon={Phone} label="Shop phone" value={<a className="link" href={`tel:${booking.shop.phone}`}>{booking.shop.phone}</a>} />}
              {booking.party !== 'customer' && booking.inspectorName && <Info icon={User} label="Inspector" value={booking.inspectorName} />}
            </CardBody>
          </Card>

          {booking.report && (
            <Card as="section" aria-labelledby="report-title">
              <CardHeader
                title={<span id="report-title">Inspection report</span>}
                description={`Report ${booking.report.reportNumber} · issued ${formatDate(booking.report.createdAt, true)}`}
                action={<Link href={`/reports/${booking.report.reportNumber}`} className="link inline-flex items-center gap-1 text-sm">Public verification page<ExternalLink className="h-3.5 w-3.5" aria-hidden /></Link>}
              />
              <CardBody className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone={ASSESSMENT[booking.report.overallAssessment].tone} className="px-3 py-1 text-sm">Overall: {ASSESSMENT[booking.report.overallAssessment].label}</Badge>
                  <span className="text-sm text-slate-600">{counts.PASS || 0} passed · {counts.FAIL || 0} failed · {counts.NEEDS_ATTENTION || 0} need attention</span>
                </div>
                <p className="text-sm text-slate-700">{booking.report.assessmentSummary}</p>
              </CardBody>
            </Card>
          )}

          {booking.results.length > 0 && (
            <Card as="section">
              <CardHeader title="Checklist results" />
              <div className="divide-y divide-slate-100">
                {grouped.map(([category, items]) => (
                  <div key={category} className="px-5 py-4">
                    <h3 className="text-sm font-semibold">{category}</h3>
                    <ul className="mt-2 space-y-2">
                      {items.map((r) => (
                        <li key={r.id} className="flex items-start justify-between gap-4 text-sm">
                          <div>
                            <p>{r.checkName}</p>
                            {r.notes && <p className="text-slate-500">{r.notes}</p>}
                          </div>
                          <Badge tone={CHECK_RESULT[r.result].tone}>{CHECK_RESULT[r.result].label}</Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {booking.evidence.length > 0 && booking.status !== 'INSPECTION_IN_PROGRESS' && (
            <Card as="section">
              <CardHeader title="Photo evidence" description={`${booking.evidence.length} photos taken by the inspector`} />
              <CardBody>
                <Gallery images={booking.evidence.map((e, i) => ({ id: e.id, url: e.url, alt: e.annotationText || `Evidence photo ${i + 1}` }))} />
              </CardBody>
            </Card>
          )}

          {booking.review && (
            <Card as="section">
              <CardHeader title="Customer review" />
              <CardBody>
                <Stars value={booking.review.overallRating} size="md" />
                {booking.review.reviewText && <p className="mt-2 text-sm text-slate-700">{booking.review.reviewText}</p>}
                <p className="mt-2 text-xs text-slate-500">{formatDate(booking.review.createdAt)}</p>
              </CardBody>
            </Card>
          )}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          {booking.party === 'customer' && <CustomerActions booking={booking} />}
          {booking.party === 'shop' && <ShopActions booking={booking} />}
          {booking.party === 'inspector' && <InspectorActions booking={booking} />}
          {booking.party === 'admin' && <AdminActions booking={booking} />}

          <Card className="p-5 text-sm">
            <h3 className="font-semibold">Payment</h3>
            <dl className="mt-3 space-y-2">
              <Row label="Inspection fee" value={formatPKR(booking.fee)} />
              <Row label="Status" value={booking.payment ? booking.payment.status.toLowerCase() : 'not paid'} />
              {booking.payment?.transactionId && <Row label="Transaction" value={<span className="font-mono text-xs">{booking.payment.transactionId}</span>} />}
              {booking.payout && (
                <>
                  <Row label="Shop payout" value={formatPKR(booking.payout.shopPayout)} />
                  <Row label="MobCheck fee" value={formatPKR(booking.payout.margin)} />
                  <Row label="Payout" value={booking.payout.onHold ? 'on hold (dispute)' : booking.payout.eligible ? `eligible · ${booking.payout.status.toLowerCase()}` : 'pending'} />
                </>
              )}
            </dl>
          </Card>

          {booking.party === 'customer' && !['AWAITING_PAYMENT', 'CANCELLED'].includes(booking.status) && (
            <>
              <button type="button" onClick={() => setComplaintOpen(true)} className="flex w-full items-center justify-center gap-1.5 py-1 text-sm text-slate-500 hover:text-red-700">
                <Flag className="h-4 w-4" aria-hidden />Report a problem with this shop
              </button>
              <ComplaintModal open={complaintOpen} onClose={() => setComplaintOpen(false)} shopId={booking.shop.id} shopName={booking.shop.name} bookingId={booking.id} />
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <div className="mt-0.5 text-slate-800">{value}</div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium capitalize text-ink">{value}</dd>
    </div>
  );
}

export function ActionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-3 space-y-3 text-sm">{children}</div>
    </Card>
  );
}
