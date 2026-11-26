import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, publicUserSelect, requireUser } from '@/lib/session';
import { ProfileSchema } from '@/lib/validation';
import { parseBody, serverError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  return NextResponse.json({ user }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;
    const parsed = await parseBody(request, ProfileSchema);
    if (parsed.response) return parsed.response;
    const { firstName, lastName, phone, city, area } = parsed.data;

    const user = await prisma.user.update({
      where: { id: auth.user.id },
      data: { firstName, lastName, phone },
      select: publicUserSelect,
    });
    if (auth.user.role === 'CUSTOMER') {
      await prisma.customerProfile.upsert({
        where: { userId: user.id },
        update: { city, area, displayName: `${firstName} ${lastName}` },
        create: { userId: user.id, city, area, displayName: `${firstName} ${lastName}` },
      });
    }
    return NextResponse.json({ user });
  } catch (error) {
    return serverError('Update profile error', error);
  }
}
