import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { AdminComplaintSchema } from '@/lib/validation';
import { parseBody, serverError } from '@/lib/api';
import { notify } from '@/lib/notify';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request, ['SUPER_ADMIN', 'OPS_ADMIN', 'SUPPORT']);
    if (auth.response) return auth.response;
    const parsed = await parseBody(request, AdminComplaintSchema);
    if (parsed.response) return parsed.response;
    const complaint = await prisma.complaint.findUnique({ where: { id: params.id }, include: { shop: { select: { name: true } } } });
    if (!complaint) return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    const { status, resolution, actionTaken } = parsed.data;
    if (actionTaken !== 'NONE' && auth.user.role === 'SUPPORT') {
      return NextResponse.json({ error: 'Support staff cannot take action against shops. Escalate to an admin.' }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.complaint.update({
        where: { id: complaint.id },
        data: { status, resolution, actionTaken, reviewedById: auth.user.id, reviewedAt: new Date(), ...(actionTaken !== 'NONE' ? { actionTakenAt: new Date() } : {}) },
      }),
      prisma.adminAction.create({ data: { adminId: auth.user.id, actionType: 'OTHER', entityType: 'complaint', entityId: complaint.id, description: `Complaint ${status.toLowerCase()} (${actionTaken.toLowerCase()})` } }),
    ]);
    if (status === 'RESOLVED' || status === 'DISMISSED') {
      await notify(complaint.customerId, `Update on your complaint about ${complaint.shop.name}`, resolution || `Your complaint was ${status.toLowerCase()}.`);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Admin complaint error', error);
  }
}
