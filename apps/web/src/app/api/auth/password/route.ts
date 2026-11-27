import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { hashToken, requireUser, SESSION_COOKIE } from '@/lib/session';
import { ChangePasswordSchema } from '@/lib/validation';
import { parseBody, serverError } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;
    const parsed = await parseBody(request, ChangePasswordSchema);
    if (parsed.response) return parsed.response;

    const record = await prisma.user.findUniqueOrThrow({ where: { id: auth.user.id } });
    if (!(await bcrypt.compare(parsed.data.currentPassword, record.passwordHash))) {
      return NextResponse.json(
        { error: 'Current password is incorrect.', fields: { currentPassword: 'Incorrect password' } },
        { status: 400 }
      );
    }
    await prisma.user.update({
      where: { id: record.id },
      data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) },
    });
    // Sign out every other device; keep the current session.
    const current = request.cookies.get(SESSION_COOKIE)?.value;
    await prisma.session.deleteMany({
      where: { userId: record.id, ...(current ? { NOT: { token: hashToken(current) } } : {}) },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Change password error', error);
  }
}
