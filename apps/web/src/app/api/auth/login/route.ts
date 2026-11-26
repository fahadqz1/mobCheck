import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { LoginSchema } from '@/lib/validation';
import { createSession, publicUserSelect, setSessionCookie } from '@/lib/session';
import { parseBody, serverError } from '@/lib/api';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, LoginSchema);
    if (parsed.response) return parsed.response;
    const { email, password } = parsed.data;

    const limit = rateLimit(`login:${clientIp(request)}:${email}`, 10, 15 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${Math.ceil(limit.retryAfterSec / 60)} minutes.` },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !valid) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
    }
    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'This account is not active. Contact MobCheck support.' }, { status: 403 });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    const { token, expiresAt } = await createSession(user.id, request);
    const safeUser = await prisma.user.findUnique({ where: { id: user.id }, select: publicUserSelect });

    const response = NextResponse.json({ user: safeUser });
    setSessionCookie(response, token, expiresAt);
    return response;
  } catch (error) {
    return serverError('Login error', error, 'Login failed. Please try again.');
  }
}
