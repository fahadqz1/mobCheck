import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import type { UserRole } from '@prisma/client';
import prisma from './prisma';

export const SESSION_COOKIE = 'mc_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'OPS_ADMIN'];

export const publicUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

export type SessionUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: string;
  createdAt: Date;
};

// Only a SHA-256 digest of the token is stored, so a leaked Session table cannot be replayed.
export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export async function createSession(userId: string, request: NextRequest) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({
    data: {
      userId,
      token: hashToken(token),
      expiresAt,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.ip || null,
      userAgent: request.headers.get('user-agent')?.slice(0, 255) || null,
    },
  });
  return { token, expiresAt };
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function getUserFromToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token: hashToken(token) },
    include: { user: { select: publicUserSelect } },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (session.user.status !== 'ACTIVE') return null;
  return session.user;
}

export async function destroySession(token: string | undefined | null) {
  if (!token) return;
  await prisma.session.deleteMany({ where: { token: hashToken(token) } });
}

export function getCurrentUser(request: NextRequest) {
  return getUserFromToken(request.cookies.get(SESSION_COOKIE)?.value);
}

// Cookies are SameSite=Lax; rejecting cross-origin writes closes the remaining CSRF gap.
function isCrossOriginWrite(request: NextRequest) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return false;
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host !== request.headers.get('host');
  } catch {
    return true;
  }
}

type AuthResult = { user: SessionUser; response?: undefined } | { user?: undefined; response: NextResponse };

export async function requireUser(request: NextRequest, roles?: UserRole[]): Promise<AuthResult> {
  if (isCrossOriginWrite(request)) {
    return { response: NextResponse.json({ error: 'Cross-origin request rejected' }, { status: 403 }) };
  }
  const user = await getCurrentUser(request);
  if (!user) {
    return { response: NextResponse.json({ error: 'Your session has expired. Please log in again.' }, { status: 401 }) };
  }
  if (roles && !roles.includes(user.role)) {
    return { response: NextResponse.json({ error: 'You do not have permission to do this.' }, { status: 403 }) };
  }
  return { user };
}
