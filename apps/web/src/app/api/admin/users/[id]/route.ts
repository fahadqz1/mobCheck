import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ADMIN_ROLES, requireUser } from '@/lib/session';
import { AdminUserSchema } from '@/lib/validation';
import { parseBody, serverError } from '@/lib/api';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request, ADMIN_ROLES);
    if (auth.response) return auth.response;
    const parsed = await parseBody(request, AdminUserSchema);
    if (parsed.response) return parsed.response;
    if (params.id === auth.user.id) return NextResponse.json({ error: 'You cannot change your own account status.' }, { status: 400 });
    const target = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true, role: true, email: true } });
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (ADMIN_ROLES.includes(target.role) && auth.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only a super admin can change another admin.' }, { status: 403 });
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id: target.id }, data: { status: parsed.data.status } }),
      ...(parsed.data.status === 'SUSPENDED' ? [prisma.session.deleteMany({ where: { userId: target.id } })] : []),
      prisma.adminAction.create({ data: { adminId: auth.user.id, actionType: 'USER_SUSPEND', entityType: 'user', entityId: target.id, description: `${parsed.data.status === 'SUSPENDED' ? 'Suspended' : 'Reactivated'} ${target.email}` } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Admin user error', error);
  }
}
