import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import type { ShopStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { requirePageAuth } from '@/lib/ssr-auth';
import { DashboardLayout } from '@/components/layout/Layouts';
import { Card } from '@/components/ui/Card';
import { Badge, EmptyState } from '@/components/ui/Feedback';
import { Table, Td, Th } from '@/components/ui/Table';
import { QueryTabs } from '@/components/admin/Tabs';
import { formatDate, fullName, SHOP_STATUS } from '@/lib/format';

const STATUSES: ShopStatus[] = ['PENDING', 'VERIFIED', 'SUSPENDED', 'REJECTED', 'BLOCKED'];

export const getServerSideProps: GetServerSideProps = (ctx) =>
  requirePageAuth(ctx, ['SUPER_ADMIN', 'OPS_ADMIN'], async () => {
    const status = STATUSES.includes(ctx.query.status as ShopStatus) ? (ctx.query.status as ShopStatus) : 'PENDING';
    const [shops, counts] = await Promise.all([
      prisma.shop.findMany({
        where: { status },
        orderBy: { createdAt: status === 'PENDING' ? 'asc' : 'desc' },
        take: 100,
        select: { id: true, name: true, city: true, area: true, status: true, createdAt: true, owner: { select: { firstName: true, lastName: true, email: true } }, _count: { select: { inspectors: true, complaints: true } } },
      }),
      prisma.shop.groupBy({ by: ['status'], _count: true }),
    ]);
    return { shops, counts: Object.fromEntries(counts.map((c) => [c.status, c._count])) };
  });

export default function AdminShops({ shops, counts }: any) {
  return (
    <DashboardLayout title="Shops" description="Verify new shops and manage existing ones.">
      <QueryTabs tabs={STATUSES.map((s) => ({ value: s, label: SHOP_STATUS[s].label, count: counts[s] || 0 }))} />
      {shops.length === 0 ? (
        <EmptyState title="No shops in this state" description="Nothing to review here." />
      ) : (
        <Card>
          <Table>
            <thead><tr><Th>Shop</Th><Th>Owner</Th><Th>Location</Th><Th>Inspectors</Th><Th>Complaints</Th><Th>Registered</Th><Th>Status</Th></tr></thead>
            <tbody>
              {shops.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <Td><Link href={`/admin/shops/${s.id}`} className="font-medium text-ink hover:text-brand-800">{s.name}</Link></Td>
                  <Td>{fullName(s.owner)}<br /><span className="text-xs text-slate-500">{s.owner.email}</span></Td>
                  <Td>{s.area}, {s.city}</Td>
                  <Td>{s._count.inspectors}</Td>
                  <Td>{s._count.complaints}</Td>
                  <Td>{formatDate(s.createdAt)}</Td>
                  <Td><Badge tone={SHOP_STATUS[s.status].tone}>{SHOP_STATUS[s.status].label}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </DashboardLayout>
  );
}
