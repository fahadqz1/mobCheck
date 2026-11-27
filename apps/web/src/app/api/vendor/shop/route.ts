import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { ShopSchema } from '@/lib/validation';
import { parseBody, serverError } from '@/lib/api';
import { notifyMany } from '@/lib/notify';

const slugify = (name: string) =>
  name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'shop';

const TRIAL_DAYS = 30;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request, ['SHOP_OWNER']);
    if (auth.response) return auth.response;
    const parsed = await parseBody(request, ShopSchema);
    if (parsed.response) return parsed.response;

    const existing = await prisma.shop.findFirst({ where: { ownerId: auth.user.id }, select: { id: true } });
    if (existing) return NextResponse.json({ error: 'You already have a registered shop.' }, { status: 409 });

    const base = slugify(parsed.data.name);
    const taken = await prisma.shop.findUnique({ where: { slug: base }, select: { id: true } });
    const slug = taken ? `${base}-${crypto.randomBytes(3).toString('hex')}` : base;
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 86400000);

    const shop = await prisma.shop.create({
      data: {
        ...parsed.data,
        whatsapp: parsed.data.whatsapp || parsed.data.phone,
        ownerId: auth.user.id,
        slug,
        status: 'PENDING',
        trialStartsAt: new Date(),
        trialEndsAt,
        subscriptions: { create: { status: 'TRIAL', currentPeriodStart: new Date(), currentPeriodEnd: trialEndsAt, pricePkr: 1200, autoRenew: true } },
      },
      select: { id: true, slug: true },
    });
    const admins = await prisma.user.findMany({ where: { role: { in: ['SUPER_ADMIN', 'OPS_ADMIN'] }, status: 'ACTIVE' }, select: { id: true } });
    await notifyMany(admins.map((a) => a.id), 'New shop awaiting verification', parsed.data.name, `/admin/shops/${shop.id}`);
    return NextResponse.json({ data: shop }, { status: 201 });
  } catch (error) {
    return serverError('Create shop error', error, 'Could not register the shop.');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireUser(request, ['SHOP_OWNER']);
    if (auth.response) return auth.response;
    const parsed = await parseBody(request, ShopSchema);
    if (parsed.response) return parsed.response;
    const shop = await prisma.shop.findFirst({ where: { ownerId: auth.user.id }, select: { id: true } });
    if (!shop) return NextResponse.json({ error: 'Register your shop first.' }, { status: 404 });
    const updated = await prisma.shop.update({
      where: { id: shop.id },
      data: { ...parsed.data, whatsapp: parsed.data.whatsapp || parsed.data.phone },
      select: { id: true, slug: true },
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    return serverError('Update shop error', error, 'Could not save the shop.');
  }
}
