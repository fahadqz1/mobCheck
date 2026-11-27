import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { ServiceSchema } from '@/lib/validation';
import { parseBody, serverError } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request, ['SHOP_OWNER']);
    if (auth.response) return auth.response;
    const parsed = await parseBody(request, ServiceSchema);
    if (parsed.response) return parsed.response;
    const shop = await prisma.shop.findFirst({ where: { ownerId: auth.user.id }, select: { id: true } });
    if (!shop) return NextResponse.json({ error: 'Register your shop first.' }, { status: 404 });
    const service = await prisma.shopService.create({ data: { ...parsed.data, shopId: shop.id } });
    return NextResponse.json({ data: service }, { status: 201 });
  } catch (error) {
    return serverError('Create service error', error);
  }
}
