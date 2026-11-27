import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import prisma from '@/lib/prisma';
import { requirePageAuth } from '@/lib/ssr-auth';
import { DashboardLayout } from '@/components/layout/Layouts';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Alert, Badge } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Field, Select, Textarea } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/client';
import { bookingRef, formatDate, fullName } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';

export const getServerSideProps: GetServerSideProps = (ctx) =>
  requirePageAuth(ctx, ['SUPER_ADMIN', 'OPS_ADMIN', 'SUPPORT'], async () => {
    const complaint = await prisma.complaint.findUnique({
      where: { id: String(ctx.params?.id) },
      include: {
        shop: { select: { id: true, name: true, status: true } },
        customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
        reviewedBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!complaint) return { notFound: true as const };
    return { complaint };
  });

export default function AdminComplaint({ complaint }: any) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState({ status: complaint.status === 'SUBMITTED' ? 'UNDER_REVIEW' : complaint.status, resolution: complaint.resolution || '', actionTaken: complaint.actionTaken });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isSupport = user?.role === 'SUPPORT';

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await api(`/api/admin/complaints/${complaint.id}`, { method: 'PATCH', body: { ...form, resolution: form.resolution || undefined } });
      toast('success', 'Complaint updated');
      router.replace(router.asPath, undefined, { scroll: false });
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title={`Complaint about ${complaint.shop.name}`} description={`Filed ${formatDate(complaint.createdAt, true)}`}>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader title={<span className="capitalize">{complaint.category.replace(/_/g, ' ').toLowerCase()}</span>} action={<Badge>{complaint.status.replace('_', ' ').toLowerCase()}</Badge>} />
          <CardBody className="space-y-4 text-sm">
            <p className="whitespace-pre-line text-slate-800">{complaint.description}</p>
            <dl className="grid grid-cols-[120px_1fr] gap-y-2 border-t border-slate-100 pt-4">
              <dt className="text-slate-600">Customer</dt><dd>{fullName(complaint.customer)} · <a href={`mailto:${complaint.customer.email}`} className="link">{complaint.customer.email}</a>{complaint.customer.phone ? ` · ${complaint.customer.phone}` : ''}</dd>
              <dt className="text-slate-600">Shop</dt><dd><Link href={`/admin/shops/${complaint.shop.id}`} className="link">{complaint.shop.name}</Link> ({complaint.shop.status.toLowerCase()})</dd>
              <dt className="text-slate-600">Booking</dt><dd>{complaint.bookingId ? <Link href={`/admin/bookings/${complaint.bookingId}`} className="link">{bookingRef(complaint.bookingId)}</Link> : 'Not linked'}</dd>
              {complaint.reviewedBy && (<><dt className="text-slate-600">Reviewed by</dt><dd>{fullName(complaint.reviewedBy)} on {formatDate(complaint.reviewedAt)}</dd></>)}
            </dl>
          </CardBody>
        </Card>
        <Card className="self-start">
          <CardHeader title="Decision" />
          <CardBody className="space-y-4">
            {error && <Alert tone="danger" title={error} />}
            <Field label="Status">
              {(p) => (
                <Select {...p} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="UNDER_REVIEW">Under review</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="DISMISSED">Dismissed</option>
                </Select>
              )}
            </Field>
            <Field label="Action against shop" hint={isSupport ? 'Support staff can only record the outcome; escalate actions to an admin.' : 'Suspensions are applied from the shop page.'}>
              {(p) => (
                <Select {...p} value={form.actionTaken} onChange={(e) => setForm({ ...form, actionTaken: e.target.value })} disabled={isSupport}>
                  <option value="NONE">None</option>
                  <option value="WARNING">Warning</option>
                  <option value="TEMPORARY_SUSPENSION">Temporary suspension</option>
                  <option value="PERMANENT_BAN">Permanent ban</option>
                </Select>
              )}
            </Field>
            <Field label="Resolution note" hint="Sent to the customer when resolved or dismissed.">{(p) => <Textarea {...p} rows={4} value={form.resolution} onChange={(e) => setForm({ ...form, resolution: e.target.value })} />}</Field>
            <Button className="w-full" loading={saving} onClick={save}>Save decision</Button>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}
