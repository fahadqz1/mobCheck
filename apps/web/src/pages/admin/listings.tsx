import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import prisma from '@/lib/prisma';
import { requirePageAuth } from '@/lib/ssr-auth';
import { DashboardLayout } from '@/components/layout/Layouts';
import { Card } from '@/components/ui/Card';
import { Badge, EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Table, Td, Th } from '@/components/ui/Table';
import { QueryTabs } from '@/components/admin/Tabs';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/client';
import { formatDate, formatPKR, fullName } from '@/lib/format';

const REASON: Record<string, string> = {
  SUSPECTED_SCAM: 'Suspected scam',
  STOLEN_DEVICE: 'Possibly stolen',
  MISLEADING_DETAILS: 'Misleading details',
  WRONG_PRICE: 'Wrong price',
  ALREADY_SOLD: 'Already sold',
  OFFENSIVE: 'Offensive',
  OTHER: 'Other',
};

export const getServerSideProps: GetServerSideProps = (ctx) =>
  requirePageAuth(ctx, ['SUPER_ADMIN', 'OPS_ADMIN'], async () => {
    const view = ctx.query.status === 'all' ? 'all' : ctx.query.status === 'removed' ? 'removed' : 'reported';
    const where =
      view === 'reported' ? { reports: { some: { status: 'OPEN' as const } } } : view === 'removed' ? { status: 'REMOVED' as const } : {};
    const [listings, reported] = await Promise.all([
      prisma.phoneListing.findMany({
        where,
        orderBy: { listedAt: 'desc' },
        take: 100,
        select: {
          id: true,
          title: true,
          status: true,
          pricePkr: true,
          locationCity: true,
          listedAt: true,
          user: { select: { firstName: true, lastName: true, email: true } },
          reports: { where: { status: 'OPEN' }, select: { id: true, reason: true, details: true } },
        },
      }),
      prisma.phoneListing.count({ where: { reports: { some: { status: 'OPEN' } } } }),
    ]);
    return { listings, reported };
  });

export default function AdminListings({ listings, reported }: any) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState<string | null>(null);
  const refresh = () => router.replace(router.asPath, undefined, { scroll: false });

  const resolve = async (reportId: string, status: 'ACTIONED' | 'DISMISSED', removeListing: boolean) => {
    setPending(reportId + status);
    try {
      await api(`/api/admin/listing-reports/${reportId}`, { method: 'PATCH', body: { status, removeListing } });
      toast('success', removeListing ? 'Listing removed' : 'Reports dismissed');
      refresh();
    } catch (err) {
      toast('error', (err as ApiError).message);
    } finally {
      setPending(null);
    }
  };
  const setStatus = async (id: string, status: 'ACTIVE' | 'REMOVED') => {
    setPending(id + status);
    try {
      await api(`/api/listings/${id}`, { method: 'PATCH', body: { status } });
      toast('success', status === 'REMOVED' ? 'Listing removed' : 'Listing restored');
      refresh();
    } catch (err) {
      toast('error', (err as ApiError).message);
    } finally {
      setPending(null);
    }
  };

  return (
    <DashboardLayout title="Listings" description="Moderate phone listings and review reports from users.">
      <QueryTabs tabs={[{ value: 'reported', label: 'Reported', count: reported }, { value: 'removed', label: 'Removed' }, { value: 'all', label: 'All listings' }]} />
      {listings.length === 0 ? (
        <EmptyState title="Nothing to review" description="Listings reported by users appear here." />
      ) : (
        <Card>
          <Table>
            <thead><tr><Th>Listing</Th><Th>Seller</Th><Th>Price</Th><Th>Reports</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead>
            <tbody>
              {listings.map((l: any) => (
                <tr key={l.id} className="align-top">
                  <Td><Link href={`/listings/${l.id}`} className="font-medium text-ink hover:text-brand-800">{l.title}</Link><p className="text-xs text-slate-500">{l.locationCity} · {formatDate(l.listedAt)}</p></Td>
                  <Td>{fullName(l.user)}<p className="text-xs text-slate-500">{l.user.email}</p></Td>
                  <Td>{formatPKR(l.pricePkr)}</Td>
                  <Td>
                    {l.reports.length === 0 ? '—' : (
                      <ul className="space-y-1">{l.reports.map((r: any) => <li key={r.id}><Badge tone="danger">{REASON[r.reason]}</Badge>{r.details && <p className="mt-0.5 max-w-xs text-xs text-slate-600">{r.details}</p>}</li>)}</ul>
                    )}
                  </Td>
                  <Td><Badge tone={l.status === 'ACTIVE' ? 'success' : l.status === 'REMOVED' ? 'danger' : 'neutral'}>{l.status.toLowerCase()}</Badge></Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      {l.reports.length > 0 ? (
                        <>
                          <Button size="sm" variant="danger" loading={pending === l.reports[0].id + 'ACTIONED'} onClick={() => resolve(l.reports[0].id, 'ACTIONED', true)}>Remove</Button>
                          <Button size="sm" variant="outline" loading={pending === l.reports[0].id + 'DISMISSED'} onClick={() => resolve(l.reports[0].id, 'DISMISSED', false)}>Dismiss</Button>
                        </>
                      ) : l.status === 'REMOVED' ? (
                        <Button size="sm" variant="outline" loading={pending === l.id + 'ACTIVE'} onClick={() => setStatus(l.id, 'ACTIVE')}>Restore</Button>
                      ) : l.status === 'ACTIVE' ? (
                        <Button size="sm" variant="outline" loading={pending === l.id + 'REMOVED'} onClick={() => setStatus(l.id, 'REMOVED')}>Remove</Button>
                      ) : null}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </DashboardLayout>
  );
}
