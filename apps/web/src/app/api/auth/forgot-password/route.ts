import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashToken } from '@/lib/session';
import { ForgotPasswordSchema } from '@/lib/validation';
import { parseBody, serverError } from '@/lib/api';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, ForgotPasswordSchema);
    if (parsed.response) return parsed.response;
    const { email } = parsed.data;

    if (!rateLimit(`forgot:${clientIp(request)}`, 5, 15 * 60 * 1000).ok) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    // Same response whether or not the account exists, so emails cannot be enumerated.
    const message = 'If an account exists for this email, a reset link has been sent.';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ message });

    const token = crypto.randomBytes(32).toString('base64url');
    await prisma.emailToken.create({
      data: {
        userId: user.id,
        token: hashToken(token),
        type: 'RESET_PASSWORD',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const resetUrl = `${request.nextUrl.origin}/auth/reset-password?token=${token}`;

    // No email provider is configured yet; in development the link is logged and returned instead.
    console.log(`[password-reset] ${email}: ${resetUrl}`);
    return NextResponse.json({
      message,
      ...(process.env.NODE_ENV !== 'production' ? { devResetUrl: resetUrl } : {}),
    });
  } catch (error) {
    return serverError('Forgot password error', error);
  }
}
