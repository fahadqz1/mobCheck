import { useState } from 'react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { Check } from 'lucide-react';
import prisma from '@/lib/prisma';
import { requirePageAuth } from '@/lib/ssr-auth';
import { getSubscriptionPrice } from '@/lib/settings';
import { DashboardLayout } from '@/components/layout/Layouts';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Alert, Badge } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { NeedsShop } from '@/components/vendor/NeedsShop';
import { api, ApiError } from '@/lib/client';
import { formatDate, formatPKR } from '@/lib/format';

export const getServerSideProps: GetServerSideProps = (ctx) =>
  requirePageAuth(ctx, ['SHOP_OWNER'], async (user) => {
    const shop = await prisma.shop.findFirst({ where: { ownerId: user.id }, include: { subscriptions: true } });
    return {
      hasShop: !!shop,
      sub: shop?.subscriptions[0] ?? null,
      price: await getSubscriptionPrice(),
      sandbox: process.env.NODE_ENV !== 'production' || process.env.ENABLE_SANDBOX_PAYMENTS === 'true',
    };
  });

const TONE: Record<string, 'brand' | 'success' | 'danger' | 'neutral'> = { TRIAL: 'brand', ACTIVE: 'success', EXPIRED: 'danger', CANCELLED: 'neutral' };

export default function VendorSubscription({ hasShop, sub, price, sandbox }: any) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const expired = sub && new Date(sub.currentPeriodEnd) < new Date();
  const status = sub ? (expired && sub.status !== 'CANCELLED' ? 'EXPIRED' : sub.status) : null;

  const act = async (body: Record<string, unknown>, message: string) => {
    setPending(String(body.action));
    try {
      await api('/api/vendor/subscription', { body });
      toast('success', message);
      setCancelOpen(false);
      router.replace(router.asPath, undefined, { scroll: false });
    } catch (err) {
      toast('error', (err as ApiError).message);
    } finally {
      setPending(null);
    }
  };

  return (
    <DashboardLayout title="Subscription" description="Your MobCheck shop plan.">
      {!hasShop ? (
        <NeedsShop />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Card>
            <CardHeader title="Shop plan" action={status && <Badge tone={TONE[status]}>{status === 'TRIAL' ? 'Free trial' : status.toLowerCase()}</Badge>} />
            <CardBody className="space-y-5">
              <p className="text-3xl font-semibold">{formatPKR(price)}<span className="text-base font-normal text-slate-500"> / month</span></p>
              <ul className="space-y-2 text-sm text-slate-700">
                {['Listed in the MobCheck shop directory', 'Accept paid inspection bookings', 'Unlimited inspectors and services', 'Verified badge and customer reviews'].map((f) => (
                  <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-brand-700" aria-hidden />{f}</li>
                ))}
              </ul>
              {sub && (
                <dl className="grid grid-cols-[160px_1fr] gap-y-2 border-t border-slate-100 pt-4 text-sm">
                  <dt className="text-slate-500">Current period</dt><dd>{formatDate(sub.currentPeriodStart)} – {formatDate(sub.currentPeriodEnd)}</dd>
                  <dt className="text-slate-500">Last payment</dt><dd>{sub.lastPaymentDate ? formatDate(sub.lastPaymentDate) : 'None (trial)'}</dd>
                </dl>
              )}
              {sub && status !== 'CANCELLED' && (
                <Checkbox label="Renew automatically at the end of each period" checked={sub.autoRenew} disabled={!!pending} onChange={(e) => act({ action: 'auto_renew', autoRenew: e.target.checked }, e.target.checked ? 'Auto-renew turned on' : 'Auto-renew turned off')} />
              )}
            </CardBody>
          </Card>
          <Card className="self-start">
            <CardBody className="space-y-3">
              {status === 'EXPIRED' && <Alert tone="danger" title="Your plan has expired">Renew to keep receiving bookings.</Alert>}
              {sandbox ? (
                <>
                  <Button className="w-full" loading={pending === 'renew'} onClick={() => act({ action: 'renew' }, 'Subscription renewed for 30 days')}>{status === 'TRIAL' ? 'Start paid plan' : 'Renew for 30 days'} · {formatPKR(price)}</Button>
                  <p className="text-xs text-slate-500">Sandbox mode: no payment gateway is connected, so renewal is simulated.</p>
                </>
              ) : (
                <Alert tone="info" title="Online renewal coming soon">Contact MobCheck support to renew your plan.</Alert>
              )}
              {sub && status !== 'CANCELLED' && <Button variant="ghost" className="w-full" onClick={() => setCancelOpen(true)}>Cancel plan</Button>}
            </CardBody>
          </Card>
          <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} size="sm" title="Cancel your plan?" description="Your shop stays live until the end of the current period." footer={<><Button variant="outline" onClick={() => setCancelOpen(false)}>Keep plan</Button><Button variant="danger" loading={pending === 'cancel'} onClick={() => act({ action: 'cancel' }, 'Plan cancelled')}>Cancel plan</Button></>}>
            <p className="text-sm text-slate-600">You can start a new plan at any time.</p>
          </Modal>
        </div>
      )}
    </DashboardLayout>
  );
}
