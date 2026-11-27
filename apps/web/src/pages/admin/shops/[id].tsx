import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { ExternalLink } from 'lucide-react';
import prisma from '@/lib/prisma';
import { requirePageAuth } from '@/lib/ssr-auth';
import { DashboardLayout } from '@/components/layout/Layouts';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Alert, Badge } from '@/components/ui/Feedback';
import { Button, LinkButton } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select, Textarea } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/client';
import { formatDate, fullName, SHOP_STATUS } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';

export const getServerSideProps: GetServerSideProps = (ctx) =>
  requirePageAuth(ctx, ['SUPER_ADMIN', 'OPS_ADMIN'], async () => {
    const shop = await prisma.shop.findUnique({
      where: { id: String(ctx.params?.id) },
      include: {
        owner: { select: { firstName: true, lastName: true, email: true, phone: true, createdAt: true } },
        documents: true,
        bans: { orderBy: { bannedAt: 'desc' }, take: 5, include: { bannedBy: { select: { firstName: true, lastName: true } } } },
        complaints: { orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, category: true, status: true, createdAt: true } },
        _count: { select: { inspectors: true, services: true, inspectionBookings: true } },
      },
    });
    if (!shop) return { notFound: true as const };
    return { shop };
  });

export default function AdminShop({ shop }: any) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const [dialog, setDialog] = useState<null | 'reject' | 'suspend'>(null);
  const [reason, setReason] = useState('');
  const [banType, setBanType] = useState('TEMPORARY_SUSPENSION');
  const [days, setDays] = useState('7');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<string | null>(null);
  const status = SHOP_STATUS[shop.status];

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    setPending(action);
    setFields({});
    try {
      await api(`/api/admin/shops/${shop.id}`, { body: { action, ...extra } });
      toast('success', `Shop ${action === 'verify' ? 'verified' : action === 'reinstate' ? 'reinstated' : action === 'reject' ? 'rejected' : 'suspended'}`);
      setDialog(null);
      router.replace(router.asPath, undefined, { scroll: false });
    } catch (err) {
      setFields((err as ApiError).fields || {});
      if (!(err as ApiError).fields) toast('error', (err as ApiError).message);
    } finally {
      setPending(null);
    }
  };

  return (
    <DashboardLayout
      title={shop.name}
      description={<span className="inline-flex items-center gap-2"><Badge tone={status.tone}>{status.label}</Badge> registered {formatDate(shop.createdAt)}</span>}
      actions={
        <>
          <LinkButton href={`/shops/${shop.slug}`} variant="outline"><ExternalLink className="h-4 w-4" aria-hidden />Profile</LinkButton>
          {['PENDING', 'REJECTED'].includes(shop.status) && <Button loading={pending === 'verify'} onClick={() => act('verify')}>Verify shop</Button>}
          {shop.status === 'PENDING' && <Button variant="outline" onClick={() => setDialog('reject')}>Reject</Button>}
          {shop.status === 'VERIFIED' && <Button variant="danger" onClick={() => setDialog('suspend')}>Suspend</Button>}
          {['SUSPENDED', 'BLOCKED'].includes(shop.status) && <Button loading={pending === 'reinstate'} onClick={() => act('reinstate')}>Reinstate</Button>}
        </>
      }
    >
      {shop.status === 'PENDING' && <Alert tone="info" title="Verification checklist" className="mb-6">Confirm the owner&apos;s CNIC and business registration by phone or in person, and that the address exists, before verifying. Uploaded documents appear below.</Alert>}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Shop details" />
          <CardBody>
            <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
              <dt className="text-slate-600">Address</dt><dd>{shop.addressLine1}{shop.addressLine2 ? `, ${shop.addressLine2}` : ''}, {shop.area}, {shop.city}</dd>
              <dt className="text-slate-600">Phone</dt><dd>{shop.phone}</dd>
              <dt className="text-slate-600">Email</dt><dd className="break-all">{shop.email}</dd>
              <dt className="text-slate-600">Hours</dt><dd>{shop.openingHour}–{shop.closingHour}</dd>
              <dt className="text-slate-600">Inspectors</dt><dd>{shop._count.inspectors}</dd>
              <dt className="text-slate-600">Services</dt><dd>{shop._count.services}</dd>
              <dt className="text-slate-600">Bookings</dt><dd>{shop._count.inspectionBookings}</dd>
              <dt className="text-slate-600">Verified</dt><dd>{shop.verifiedAt ? formatDate(shop.verifiedAt) : '—'}</dd>
            </dl>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Owner" />
          <CardBody>
            <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
              <dt className="text-slate-600">Name</dt><dd>{fullName(shop.owner)}</dd>
              <dt className="text-slate-600">Email</dt><dd className="break-all">{shop.owner.email}</dd>
              <dt className="text-slate-600">Phone</dt><dd>{shop.owner.phone || '—'}</dd>
              <dt className="text-slate-600">Joined</dt><dd>{formatDate(shop.owner.createdAt)}</dd>
            </dl>
            <h3 className="mt-5 text-sm font-semibold">Documents</h3>
            {shop.documents.length === 0 ? <p className="mt-1 text-sm text-slate-600">No documents uploaded. Collect them offline before verifying.</p> : (
              <ul className="mt-2 space-y-1 text-sm">{shop.documents.map((d: any) => <li key={d.id}>{d.documentType.replace('_', ' ').toLowerCase()} · {d.status.toLowerCase()}</li>)}</ul>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Recent complaints" action={<Link href="/admin/complaints" className="link text-sm">All complaints</Link>} />
          {shop.complaints.length === 0 ? <CardBody><p className="text-sm text-slate-600">No complaints.</p></CardBody> : (
            <ul className="divide-y divide-slate-100">
              {shop.complaints.map((c: any) => (
                <li key={c.id}><Link href={`/admin/complaints/${c.id}`} className="flex justify-between px-5 py-3 text-sm hover:bg-slate-50"><span>{c.category.replace(/_/g, ' ').toLowerCase()}</span><span className="text-slate-600">{c.status.toLowerCase()} · {formatDate(c.createdAt)}</span></Link></li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Suspension history" />
          {shop.bans.length === 0 ? <CardBody><p className="text-sm text-slate-600">Never suspended.</p></CardBody> : (
            <ul className="divide-y divide-slate-100">
              {shop.bans.map((b: any) => (
                <li key={b.id} className="px-5 py-3 text-sm">
                  <p className="font-medium">{b.banType === 'PERMANENT_BAN' ? 'Permanent ban' : `Suspended until ${formatDate(b.suspendedUntil)}`}</p>
                  <p className="text-slate-600">{b.reason}</p>
                  <p className="text-xs text-slate-600">by {fullName(b.bannedBy)} on {formatDate(b.bannedAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal open={dialog === 'reject'} onClose={() => setDialog(null)} title="Reject this shop?" description="The owner is notified with your reason." footer={<><Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button><Button variant="danger" loading={pending === 'reject'} onClick={() => act('reject', { reason })}>Reject shop</Button></>}>
        <Field label="Reason" error={fields.reason} required>{(p) => <Textarea {...p} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
      </Modal>
      <Modal open={dialog === 'suspend'} onClose={() => setDialog(null)} title="Suspend this shop?" description="The shop disappears from search and cannot take new bookings." footer={<><Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button><Button variant="danger" loading={pending === 'suspend'} onClick={() => act('suspend', { reason, banType, days: banType === 'TEMPORARY_SUSPENSION' ? Number(days) : undefined })}>Suspend</Button></>}>
        <div className="space-y-4">
          <Field label="Type">
            {(p) => (
              <Select {...p} value={banType} onChange={(e) => setBanType(e.target.value)}>
                <option value="TEMPORARY_SUSPENSION">Temporary suspension</option>
                {user?.role === 'SUPER_ADMIN' && <option value="PERMANENT_BAN">Permanent ban</option>}
              </Select>
            )}
          </Field>
          {banType === 'TEMPORARY_SUSPENSION' && <Field label="Days">{(p) => <Input {...p} type="number" min={1} max={365} value={days} onChange={(e) => setDays(e.target.value)} />}</Field>}
          <Field label="Reason" error={fields.reason} required>{(p) => <Textarea {...p} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
