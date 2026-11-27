import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { ServiceSchema } from '@/lib/validation';
import { parseBody, serverError } from '@/lib/api';

async function ownService(request: NextRequest, id: string) {
  const auth = await requireUser(request, ['SHOP_OWNER']);
  if (auth.response) return { response: auth.response };
  const service = await prisma.shopService.findUnique({ where: { id }, include: { shop: { select: { ownerId: true } } } });
  if (!service || service.shop.ownerId !== auth.user.id) return { response: NextResponse.json({ error: 'Service not found' }, { status: 404 }) };
  return { service };
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const r = await ownService(request, params.id);
    if (r.response) return r.response;
    const parsed = await parseBody(request, ServiceSchema);
    if (parsed.response) return parsed.response;
    const service = await prisma.shopService.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json({ data: service });
  } catch (error) {
    return serverError('Update service error', error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const r = await ownService(request, params.id);
    if (r.response) return r.response;
    await prisma.shopService.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Delete service error', error);
  }
}
