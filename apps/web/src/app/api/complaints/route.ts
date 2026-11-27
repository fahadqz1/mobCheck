import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { ComplaintSchema } from '@/lib/validation';
import { parseBody, serverError } from '@/lib/api';
import { notifyMany } from '@/lib/notify';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;
    if (!rateLimit(`complaint:${auth.user.id}`, 5, 24 * 60 * 60 * 1000).ok) {
      return NextResponse.json({ error: 'You have submitted several complaints today. Our team will be in touch.' }, { status: 429 });
    }
    const parsed = await parseBody(request, ComplaintSchema);
    if (parsed.response) return parsed.response;
    const { shopId, bookingId, category, description } = parsed.data;

    const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { id: true, name: true, ownerId: true } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    if (shop.ownerId === auth.user.id) return NextResponse.json({ error: 'You cannot complain about your own shop.' }, { status: 400 });
    if (bookingId) {
      const booking = await prisma.inspectionBooking.findUnique({ where: { id: bookingId }, select: { customerId: true, shopId: true } });
      if (!booking || booking.customerId !== auth.user.id || booking.shopId !== shopId) {
        return NextResponse.json({ error: 'That booking is not yours or belongs to another shop.' }, { status: 400 });
      }
    }

    const complaint = await prisma.complaint.create({
      data: { shopId, bookingId, customerId: auth.user.id, category, description, evidenceUrls: [], status: 'SUBMITTED' },
      select: { id: true },
    });
    const staff = await prisma.user.findMany({ where: { role: { in: ['SUPER_ADMIN', 'OPS_ADMIN', 'SUPPORT'] }, status: 'ACTIVE' }, select: { id: true } });
    await notifyMany(staff.map((s) => s.id), `New complaint about ${shop.name}`, category.replace(/_/g, ' ').toLowerCase(), `/admin/complaints/${complaint.id}`);
    return NextResponse.json({ data: complaint }, { status: 201 });
  } catch (error) {
    return serverError('Create complaint error', error, 'Could not submit the complaint.');
  }
}
