import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import type { UserRole } from '@prisma/client';
import { getUserFromToken, SESSION_COOKIE, SessionUser } from './session';
import { serialize } from './serialize';

export type AuthedProps = { user: SessionUser };

export async function getSsrUser(ctx: GetServerSidePropsContext) {
  return getUserFromToken(ctx.req.cookies[SESSION_COOKIE]);
}

export async function requirePageAuth<P extends Record<string, unknown> = Record<string, never>>(
  ctx: GetServerSidePropsContext,
  roles?: UserRole[],
  load?: (user: SessionUser) => Promise<P | { notFound: true }>
): Promise<GetServerSidePropsResult<AuthedProps & P>> {
  const user = await getSsrUser(ctx);
  if (!user) {
    const hadCookie = Boolean(ctx.req.cookies[SESSION_COOKIE]);
    const next = encodeURIComponent(ctx.resolvedUrl);
    return { redirect: { destination: `/auth/login?next=${next}${hadCookie ? '&expired=1' : ''}`, permanent: false } };
  }
  if (roles && !roles.includes(user.role)) {
    return { redirect: { destination: '/dashboard?denied=1', permanent: false } };
  }
  const extra = load ? await load(user) : ({} as P);
  if ('notFound' in extra && extra.notFound) return { notFound: true };
  return { props: serialize({ user, ...(extra as P) }) };
}
