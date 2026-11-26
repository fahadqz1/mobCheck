import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { hashToken } from '@/lib/session';
import { ResetPasswordSchema } from '@/lib/validation';
import { parseBody, serverError } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, ResetPasswordSchema);
    if (parsed.response) return parsed.response;

    const record = await prisma.emailToken.findUnique({ where: { token: hashToken(parsed.data.token) } });
    if (!record || record.type !== 'RESET_PASSWORD' || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired. Request a new one.' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) },
      }),
      prisma.emailToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.session.deleteMany({ where: { userId: record.userId } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Reset password error', error);
  }
}
