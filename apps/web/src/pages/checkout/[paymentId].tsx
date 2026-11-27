import { useState } from 'react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { CreditCard, Lock } from 'lucide-react';
import prisma from '@/lib/prisma';
import { requirePageAuth } from '@/lib/ssr-auth';
import { SiteLayout } from '@/components/layout/Layouts';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Feedback';
import { Button, LinkButton } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/client';
import { bookingRef, formatDate, formatPKR } from '@/lib/format';

type Props = { payment: { id: string; status: string; amount: number; bookingId: string; device: string; shop: string; when: string }; sandbox: boolean };

export const getServerSideProps: GetServerSideProps = (ctx) =>
  requirePageAuth(ctx, ['CUSTOMER', 'SELLER'], async (user) => {
    const p = await prisma.payment.findUnique({
      where: { id: String(ctx.params?.paymentId) },
      include: { booking: { include: { brand: true, model: true, shop: { select: { name: true } } } } },
    });
    if (!p || p.customerId !== user.id) return { notFound: true as const };
    return {
      sandbox: process.env.NODE_ENV !== 'production' || process.env.ENABLE_SANDBOX_PAYMENTS === 'true',
      payment: {
        id: p.id,
        status: p.status,
        amount: Number(p.amountPkr),
        bookingId: p.bookingId,
        device: `${p.booking.brand.name} ${p.booking.model.name}`,
        shop: p.booking.shop.name,
        when: p.booking.inspectionDate.toISOString(),
      },
    };
  });

export default function Checkout({ payment, sandbox }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const pay = async (outcome: 'success' | 'failure') => {
    setPending(outcome);
    setError('');
    try {
      await api(`/api/payments/sandbox/${payment.id}`, { body: { outcome } });
      if (outcome === 'success') router.replace(`/dashboard/bookings/${payment.bookingId}?paid=1`);
      else {
        // Open a fresh attempt so the customer can retry from this page.
        await api(`/api/bookings/${payment.bookingId}/actions`, { body: { action: 'pay' } });
        setError('The payment was declined. No money was taken. You can try again.');
        setPending(null);
      }
    } catch (err) {
      setError((err as ApiError).message);
      setPending(null);
    }
  };

  return (
    <SiteLayout title="Checkout" footer={false}>
      <div className="page-container max-w-md py-12">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm text-slate-500"><Lock className="h-4 w-4" aria-hidden />Secure checkout</div>
          <h1 className="mt-2 text-xl font-semibold">Pay for your inspection</h1>
          <dl className="mt-5 space-y-2 border-y border-slate-100 py-4 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Booking</dt><dd>{bookingRef(payment.bookingId)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Device</dt><dd>{payment.device}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Shop</dt><dd>{payment.shop}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Appointment</dt><dd>{formatDate(payment.when, true)}</dd></div>
          </dl>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-sm text-slate-600">Total</span>
            <span className="text-2xl font-semibold" data-testid="checkout-total">{formatPKR(payment.amount)}</span>
          </div>

          {payment.status !== 'PENDING' ? (
            <Alert tone="info" title={`This payment is ${payment.status.toLowerCase()}`} className="mt-6">
              <LinkButton href={`/dashboard/bookings/${payment.bookingId}`} variant="outline" size="sm" className="mt-2">Back to booking</LinkButton>
            </Alert>
          ) : sandbox ? (
            <div className="mt-6 space-y-3">
              <Alert tone="warning" title="Sandbox payments">No payment gateway is connected yet. These buttons simulate the gateway&apos;s response through the signed webhook.</Alert>
              {error && <Alert tone="danger" title={error} />}
              <Button size="lg" className="w-full" loading={pending === 'success'} disabled={!!pending} onClick={() => pay('success')}><CreditCard className="h-4 w-4" aria-hidden />Pay {formatPKR(payment.amount)}</Button>
              <Button variant="ghost" className="w-full" disabled={!!pending} loading={pending === 'failure'} onClick={() => pay('failure')}>Simulate a declined payment</Button>
            </div>
          ) : (
            <Alert tone="warning" title="Online payment is not available yet" className="mt-6">Please try again later.</Alert>
          )}
        </Card>
      </div>
    </SiteLayout>
  );
}
