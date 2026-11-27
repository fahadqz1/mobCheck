import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import type { ComplaintStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { requirePageAuth } from '@/lib/ssr-auth';
import { DashboardLayout } from '@/components/layout/Layouts';
import { Card } from '@/components/ui/Card';
import { Badge, EmptyState } from '@/components/ui/Feedback';
import { Table, Td, Th } from '@/components/ui/Table';
import { QueryTabs } from '@/components/admin/Tabs';
import { formatDate, fullName } from '@/lib/format';

const OPEN: ComplaintStatus[] = ['SUBMITTED', 'UNDER_REVIEW'];
const COMPLAINT_TONE: Record<string, 'warning' | 'info' | 'success' | 'neutral'> = { SUBMITTED: 'warning', UNDER_REVIEW: 'info', RESOLVED: 'success', DISMISSED: 'neutral' };

export const getServerSideProps: GetServerSideProps = (ctx) =>
  requirePageAuth(ctx, ['SUPER_ADMIN', 'OPS_ADMIN', 'SUPPORT'], async () => {
    const closed = ctx.query.status === 'closed';
    const [complaints, openCount] = await Promise.all([
      prisma.complaint.findMany({
        where: { status: closed ? { in: ['RESOLVED', 'DISMISSED'] } : { in: OPEN } },
        orderBy: { createdAt: closed ? 'desc' : 'asc' },
        take: 100,
        include: { shop: { select: { name: true } }, customer: { select: { firstName: true, lastName: true } } },
      }),
      prisma.complaint.count({ where: { status: { in: OPEN } } }),
    ]);
    return { complaints, openCount };
  });

export default function AdminComplaints({ complaints, openCount }: any) {
  return (
    <DashboardLayout title="Complaints" description="Customer complaints about shops, oldest first.">
      <QueryTabs tabs={[{ value: 'open', label: 'Open', count: openCount }, { value: 'closed', label: 'Closed' }]} />
      {complaints.length === 0 ? (
        <EmptyState title="No complaints here" description="New complaints from customers appear in the Open tab." />
      ) : (
        <Card>
          <Table>
            <thead><tr><Th>Complaint</Th><Th>Shop</Th><Th>Customer</Th><Th>Filed</Th><Th>Status</Th></tr></thead>
            <tbody>
              {complaints.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <Td><Link href={`/admin/complaints/${c.id}`} className="font-medium capitalize text-ink hover:text-brand-800">{c.category.replace(/_/g, ' ').toLowerCase()}</Link><p className="max-w-sm truncate text-xs text-slate-600">{c.description}</p></Td>
                  <Td>{c.shop.name}</Td>
                  <Td>{fullName(c.customer)}</Td>
                  <Td>{formatDate(c.createdAt)}</Td>
                  <Td><Badge tone={COMPLAINT_TONE[c.status]}>{c.status.replace('_', ' ').toLowerCase()}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </DashboardLayout>
  );
}
