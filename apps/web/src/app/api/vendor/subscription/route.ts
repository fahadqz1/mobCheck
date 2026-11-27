import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { parseBody, serverError } from '@/lib/api';
import { getSubscriptionPrice } from '@/lib/settings';

const Schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('auto_renew'), autoRenew: z.boolean() }),
  z.object({ action: z.literal('cancel') }),
  z.object({ action: z.literal('renew') }),
]);

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request, ['SHOP_OWNER']);
    if (auth.response) return auth.response;
    const parsed = await parseBody(request, Schema);
    if (parsed.response) return parsed.response;
    const shop = await prisma.shop.findFirst({ where: { ownerId: auth.user.id }, include: { subscriptions: true } });
    if (!shop) return NextResponse.json({ error: 'Register your shop first.' }, { status: 404 });
    const sub = shop.subscriptions[0];
    const input = parsed.data;

    if (input.action === 'renew') {
      // Payment rows require a booking in the current schema, so subscription billing cannot go through
      // the payment table yet; renewal is only simulated outside production.
      if (process.env.NODE_ENV === 'production' && process.env.ENABLE_SANDBOX_PAYMENTS !== 'true') {
        return NextResponse.json({ error: 'Online subscription payments are not available yet. Contact MobCheck to renew.' }, { status: 501 });
      }
      const start = sub && sub.currentPeriodEnd > new Date() && sub.status !== 'CANCELLED' && sub.status !== 'EXPIRED' ? sub.currentPeriodEnd : new Date();
      const end = new Date(start.getTime() + 30 * 86400000);
      const price = await getSubscriptionPrice();
      await prisma.shopSubscription.upsert({
        where: { shopId: shop.id },
        create: { shopId: shop.id, status: 'ACTIVE', currentPeriodStart: start, currentPeriodEnd: end, pricePkr: price, autoRenew: true, lastPaymentDate: new Date() },
        update: { status: 'ACTIVE', currentPeriodStart: start, currentPeriodEnd: end, pricePkr: price, lastPaymentDate: new Date() },
      });
      return NextResponse.json({ ok: true });
    }
    if (!sub) return NextResponse.json({ error: 'No subscription found.' }, { status: 404 });
    if (input.action === 'auto_renew') {
      await prisma.shopSubscription.update({ where: { id: sub.id }, data: { autoRenew: input.autoRenew } });
    } else {
      await prisma.shopSubscription.update({ where: { id: sub.id }, data: { status: 'CANCELLED', autoRenew: false } });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Subscription error', error);
  }
}
