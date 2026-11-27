import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { InspectorUpdateSchema } from '@/lib/validation';
import { parseBody, serverError } from '@/lib/api';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request, ['SHOP_OWNER']);
    if (auth.response) return auth.response;
    const parsed = await parseBody(request, InspectorUpdateSchema);
    if (parsed.response) return parsed.response;
    const inspector = await prisma.inspector.findUnique({ where: { id: params.id }, include: { shop: { select: { ownerId: true } } } });
    if (!inspector || inspector.shop.ownerId !== auth.user.id) return NextResponse.json({ error: 'Inspector not found' }, { status: 404 });

    await prisma.$transaction([
      prisma.inspector.update({ where: { id: inspector.id }, data: parsed.data }),
      // Deactivated inspectors lose access immediately.
      prisma.user.update({ where: { id: inspector.userId }, data: { status: parsed.data.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE' } }),
      ...(parsed.data.status === 'INACTIVE' ? [prisma.session.deleteMany({ where: { userId: inspector.userId } })] : []),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Update inspector error', error);
  }
}
