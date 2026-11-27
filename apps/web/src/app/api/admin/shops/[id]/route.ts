import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ADMIN_ROLES, requireUser } from '@/lib/session';
import { AdminShopActionSchema } from '@/lib/validation';
import { parseBody, serverError } from '@/lib/api';
import { notify } from '@/lib/notify';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request, ADMIN_ROLES);
    if (auth.response) return auth.response;
    const parsed = await parseBody(request, AdminShopActionSchema);
    if (parsed.response) return parsed.response;
    const input = parsed.data;
    const shop = await prisma.shop.findUnique({ where: { id: params.id }, select: { id: true, name: true, status: true, ownerId: true } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const allowed: Record<string, string[]> = {
      verify: ['PENDING', 'REJECTED'],
      reject: ['PENDING'],
      suspend: ['VERIFIED'],
      reinstate: ['SUSPENDED', 'BLOCKED'],
    };
    if (!allowed[input.action].includes(shop.status)) {
      return NextResponse.json({ error: `A ${shop.status.toLowerCase()} shop cannot be ${input.action === 'verify' ? 'verified' : input.action + 'ed'}.` }, { status: 409 });
    }
    // Permanent bans are a super-admin decision.
    if (input.action === 'suspend' && input.banType === 'PERMANENT_BAN' && auth.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only a super admin can permanently ban a shop.' }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      if (input.action === 'verify') {
        await tx.shop.update({ where: { id: shop.id }, data: { status: 'VERIFIED', verifiedAt: new Date(), verifiedById: auth.user.id } });
      } else if (input.action === 'reject') {
        await tx.shop.update({ where: { id: shop.id }, data: { status: 'REJECTED' } });
      } else if (input.action === 'suspend') {
        await tx.shop.update({ where: { id: shop.id }, data: { status: input.banType === 'PERMANENT_BAN' ? 'BLOCKED' : 'SUSPENDED' } });
        await tx.shopBan.create({
          data: {
            shopId: shop.id,
            banType: input.banType,
            reason: input.reason,
            bannedById: auth.user.id,
            suspendedUntil: input.banType === 'TEMPORARY_SUSPENSION' ? new Date(Date.now() + (input.days || 7) * 86400000) : null,
          },
        });
      } else {
        await tx.shop.update({ where: { id: shop.id }, data: { status: 'VERIFIED' } });
      }
      await tx.adminAction.create({
        data: {
          adminId: auth.user.id,
          actionType: input.action === 'verify' || input.action === 'reinstate' ? 'SHOP_VERIFY' : input.action === 'suspend' ? (input.banType === 'PERMANENT_BAN' ? 'SHOP_BAN' : 'SHOP_SUSPEND') : 'OTHER',
          entityType: 'shop',
          entityId: shop.id,
          description: `${input.action} ${shop.name}${'reason' in input ? `: ${input.reason}` : ''}`,
        },
      });
    });

    const messages: Record<string, string> = {
      verify: 'Your shop is verified and now visible to customers.',
      reject: 'Your shop registration was not approved.',
      suspend: 'Your shop has been suspended on MobCheck.',
      reinstate: 'Your shop has been reinstated on MobCheck.',
    };
    await notify(shop.ownerId, messages[input.action], 'reason' in input ? input.reason : undefined, '/vendor/shop');
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Admin shop action error', error);
  }
}
