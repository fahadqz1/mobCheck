import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import type { PaymentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { requirePageAuth } from '@/lib/ssr-auth';
import { DashboardLayout } from '@/components/layout/Layouts';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge, EmptyState } from '@/components/ui/Feedback';
import { Table, Td, Th } from '@/components/ui/Table';
import { QueryTabs } from '@/components/admin/Tabs';
import { bookingRef, formatDate, formatPKR, fullName } from '@/lib/format';

const STATUSES: PaymentStatus[] = ['SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'];
const TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = { SUCCESS: 'success', PENDING: 'warning', PROCESSING: 'warning', FAILED: 'danger', CANCELLED: 'neutral', REFUNDED: 'neutral' };

export const getServerSideProps: GetServerSideProps = (ctx) =>
  requirePageAuth(ctx, ['SUPER_ADMIN', 'OPS_ADMIN'], async () => {
    const status = STATUSES.includes(ctx.query.status as PaymentStatus) ? (ctx.query.status as PaymentStatus) : 'SUCCESS';
    const [payments, totals, payouts] = await Promise.all([
      prisma.payment.findMany({ where: { status }, orderBy: { createdAt: 'desc' }, take: 100, include: { customer: { select: { firstName: true, lastName: true } }, booking: { select: { shop: { select: { name: true } } } } } }),
      prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amountPkr: true, gatewayFeePkr: true }, _count: true }),
      prisma.payoutLedger.aggregate({ where: { payoutEligible: true, payoutStatus: 'PENDING' }, _sum: { shopPayoutPkr: true, mobcheckMarginPkr: true } }),
    ]);
    return { payments, totals, payouts };
  });

export default function AdminPayments({ payments, totals, payouts }: any) {
  return (
    <DashboardLayout title="Payments" description="Inspection payments and shop payouts.">
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Collected" value={formatPKR(totals._sum.amountPkr || 0)} hint={`${totals._count} successful payments`} />
        <StatCard label="Gateway fees" value={formatPKR(totals._sum.gatewayFeePkr || 0)} />
        <StatCard label="Payouts due to shops" value={formatPKR(payouts._sum.shopPayoutPkr || 0)} hint="Eligible, not yet paid" />
        <StatCard label="MobCheck margin (due)" value={formatPKR(payouts._sum.mobcheckMarginPkr || 0)} />
      </div>
      <QueryTabs tabs={STATUSES.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() }))} />
      {payments.length === 0 ? (
        <EmptyState title="No payments" description="Payments in this state appear here." />
      ) : (
        <Card>
          <Table>
            <thead><tr><Th>Booking</Th><Th>Customer</Th><Th>Shop</Th><Th>Amount</Th><Th>Transaction</Th><Th>Date</Th><Th>Status</Th></tr></thead>
            <tbody>
              {payments.map((p: any) => (
                <tr key={p.id}>
                  <Td><Link href={`/admin/bookings/${p.bookingId}`} className="link">{bookingRef(p.bookingId)}</Link></Td>
                  <Td>{fullName(p.customer)}</Td>
                  <Td>{p.booking.shop.name}</Td>
                  <Td>{formatPKR(p.amountPkr)}</Td>
                  <Td className="font-mono text-xs">{p.gatewayTransactionId || '—'}</Td>
                  <Td>{formatDate(p.createdAt, true)}</Td>
                  <Td><Badge tone={TONE[p.status]}>{p.status.toLowerCase()}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </DashboardLayout>
  );
}
