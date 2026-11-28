import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { ImageOff, ShieldCheck } from 'lucide-react';
import prisma from '@/lib/prisma';
import { requirePageAuth } from '@/lib/ssr-auth';
import { DashboardLayout } from '@/components/layout/Layouts';
import { Card, CardHeader } from '@/components/ui/Card';
import { Alert, Badge, EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Table, Td, Th } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/client';
import { fileUrl, formatDate, fullName } from '@/lib/format';
import { aiEnabled } from '@/lib/ai';

export const getServerSideProps: GetServerSideProps = (ctx) =>
  requirePageAuth(ctx, ['SUPER_ADMIN', 'OPS_ADMIN', 'SUPPORT'], async () => {
    const [pending, blocked, offenders] = await Promise.all([
      prisma.message.findMany({ where: { status: 'PENDING_REVIEW' }, orderBy: { createdAt: 'asc' }, take: 50, include: { sender: { select: { firstName: true, lastName: true, email: true } } } }),
      prisma.message.findMany({ where: { status: 'BLOCKED' }, orderBy: { createdAt: 'desc' }, take: 50, include: { sender: { select: { id: true, firstName: true, lastName: true, email: true } } } }),
      prisma.message.groupBy({ by: ['senderId'], where: { status: 'BLOCKED' }, _count: true, orderBy: { _count: { senderId: 'desc' } }, take: 10 }),
    ]);
    const offenderUsers = await prisma.user.findMany({ where: { id: { in: offenders.map((o) => o.senderId) } }, select: { id: true, firstName: true, lastName: true, email: true, status: true } });
    return {
      aiOn: aiEnabled(),
      pending: pending.map((m) => ({ id: m.id, imageUrl: fileUrl(m.imageKey), body: m.body, createdAt: m.createdAt, sender: fullName(m.sender), email: m.sender.email })),
      blocked: blocked.map((m) => ({ id: m.id, body: m.body, note: m.moderationNote, createdAt: m.createdAt, sender: fullName(m.sender), email: m.sender.email })),
      offenders: offenders.map((o) => ({ ...offenderUsers.find((u) => u.id === o.senderId)!, count: o._count })),
    };
  });

export default function Moderation({ aiOn, pending, blocked, offenders }: any) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const decide = async (id: string, decision: 'approve' | 'reject') => {
    setBusy(id + decision);
    try {
      await api(`/api/admin/messages/${id}`, { method: 'PATCH', body: { decision } });
      toast('success', decision === 'approve' ? 'Photo delivered' : 'Photo rejected');
      router.replace(router.asPath, undefined, { scroll: false });
    } catch (err) {
      toast('error', (err as ApiError).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <DashboardLayout title="Chat moderation" description="Photos waiting for review and blocked attempts to share contact details.">
      {!aiOn && (
        <Alert tone="info" title="Automatic photo checks are off" className="mb-6">
          Add an Anthropic API key (ANTHROPIC_API_KEY) to check chat photos automatically. Until then every chat photo waits here for a quick manual review. Text messages are always checked automatically.
        </Alert>
      )}
      <Card className="mb-6">
        <CardHeader title={`Photos to review (${pending.length})`} description="Approve only photos of a phone, its box, accessories or screens, with no contact details." />
        {pending.length === 0 ? (
          <div className="p-5"><EmptyState icon={ShieldCheck} title="Nothing waiting" description="New chat photos that need a check appear here." className="border-0 py-6" /></div>
        ) : (
          <ul className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((m: any) => (
              <li key={m.id} className="overflow-hidden rounded-2xl border border-slate-200">
                {m.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.imageUrl} alt="Photo waiting for review" className="aspect-[4/3] w-full bg-slate-100 object-cover" />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-slate-100"><ImageOff className="h-6 w-6 text-slate-400" /></div>
                )}
                <div className="space-y-2 p-3 text-sm">
                  <p className="font-medium">{m.sender}</p>
                  <p className="text-xs text-slate-600">{m.email} · {formatDate(m.createdAt, true)}</p>
                  {m.body && <p className="text-slate-700">“{m.body}”</p>}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" loading={busy === m.id + 'approve'} onClick={() => decide(m.id, 'approve')}>Approve</Button>
                    <Button size="sm" variant="danger" loading={busy === m.id + 'reject'} onClick={() => decide(m.id, 'reject')}>Reject</Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader title="Recently blocked messages" description="Not delivered. The sender saw a safety warning." />
          {blocked.length === 0 ? (
            <p className="p-5 text-sm text-slate-600">No blocked messages.</p>
          ) : (
            <Table>
              <thead><tr><Th>Sender</Th><Th>Message</Th><Th>Reason</Th><Th>When</Th></tr></thead>
              <tbody>
                {blocked.map((m: any) => (
                  <tr key={m.id}>
                    <Td>{m.sender}<p className="text-xs text-slate-600">{m.email}</p></Td>
                    <Td className="max-w-xs break-words">{m.body || '(photo)'}</Td>
                    <Td><Badge tone="danger">{(m.note || '').replace(/^Not sent: |^Photo not sent: /, '')}</Badge></Td>
                    <Td>{formatDate(m.createdAt, true)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
        <Card className="self-start">
          <CardHeader title="Repeat offenders" description="Most blocked attempts" />
          {offenders.length === 0 ? (
            <p className="p-5 text-sm text-slate-600">None.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {offenders.map((o: any) => (
                <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{fullName(o)}</p>
                    <Link href={`/admin/users?q=${encodeURIComponent(o.email)}`} className="link truncate text-xs">{o.email}</Link>
                  </div>
                  <Badge tone={o.count >= 3 ? 'danger' : 'warning'}>{o.count} blocked</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
