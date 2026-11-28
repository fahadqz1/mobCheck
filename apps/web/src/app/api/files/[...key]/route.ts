import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { readFile } from '@/lib/storage';
import { ADMIN_ROLES, getCurrentUser } from '@/lib/session';

const MIME: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

// Listing and shop images are public; inspection evidence is limited to the booking's parties and admins.
async function canRead(request: NextRequest, key: string) {
  if (key.startsWith('listings/') || key.startsWith('shops/')) return true;
  if (key.startsWith('chat/')) {
    const user = await getCurrentUser(request);
    if (!user) return false;
    if (ADMIN_ROLES.includes(user.role) || user.role === 'SUPPORT') return true;
    const message = await prisma.message.findFirst({ where: { imageKey: key }, select: { senderId: true, status: true, conversation: { select: { starterId: true, recipientId: true } } } });
    if (!message) return false;
    if (message.senderId === user.id) return true;
    return message.status === 'DELIVERED' && [message.conversation.starterId, message.conversation.recipientId].includes(user.id);
  }
  if (key.startsWith('evidence/')) {
    const bookingId = key.split('/')[1];
    const user = await getCurrentUser(request);
    if (!user) return false;
    if (ADMIN_ROLES.includes(user.role)) return true;
    const booking = await prisma.inspectionBooking.findUnique({
      where: { id: bookingId },
      select: { customerId: true, shop: { select: { ownerId: true } }, inspector: { select: { userId: true } } },
    });
    return !!booking && [booking.customerId, booking.shop.ownerId, booking.inspector?.userId].includes(user.id);
  }
  return false;
}

export async function GET(request: NextRequest, { params }: { params: { key: string[] } }) {
  const key = params.key.join('/');
  try {
    if (!(await canRead(request, key))) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const data = await readFile(key);
    const ext = key.split('.').pop() || '';
    return new NextResponse(data, {
      headers: {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': key.startsWith('evidence/') || key.startsWith('chat/') ? 'private, max-age=3600' : 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
