import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { serverError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({ where: { userId: auth.user.id }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.notification.count({ where: { userId: auth.user.id, readAt: null } }),
    ]);
    return NextResponse.json({ items, unread }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return serverError('Notifications error', error);
  }
}

// Body: { id } marks one as read; {} marks all as read.
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;
    const { id } = await request.json().catch(() => ({}));
    await prisma.notification.updateMany({ where: { userId: auth.user.id, readAt: null, ...(typeof id === 'string' ? { id } : {}) }, data: { readAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Mark notifications error', error);
  }
}
