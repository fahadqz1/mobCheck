import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { RegisterSchema } from '@/lib/validation';
import { createSession, publicUserSelect, setSessionCookie } from '@/lib/session';
import { parseBody, serverError } from '@/lib/api';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(`register:${clientIp(request)}`, 20, 60 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json({ error: 'Too many sign-ups from this network. Try again later.' }, { status: 429 });
    }

    const parsed = await parseBody(request, RegisterSchema);
    if (parsed.response) return parsed.response;
    const { email, password, firstName, lastName, phone, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.', fields: { email: 'This email is already registered' } },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role,
        status: 'ACTIVE',
        ...(role === 'CUSTOMER'
          ? { customerProfile: { create: { displayName: `${firstName} ${lastName}` } } }
          : { shopOwnerProfile: { create: {} } }),
      },
      select: publicUserSelect,
    });

    const { token, expiresAt } = await createSession(user.id, request);
    const response = NextResponse.json({ user }, { status: 201 });
    setSessionCookie(response, token, expiresAt);
    return response;
  } catch (error) {
    return serverError('Registration error', error, 'Registration failed. Please try again.');
  }
}
