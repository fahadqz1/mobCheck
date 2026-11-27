import type { GetServerSidePropsContext } from 'next';
import type { BookingStatus, Prisma, UserRole } from '@prisma/client';
import prisma from './prisma';
import { requirePageAuth } from './ssr-auth';
import { bookingListInclude } from './queries';
import { settleExpiredReviewWindows } from './bookings';
import type { SessionUser } from './session';

const PAGE_SIZE = 20;

export function bookingListProps(
  ctx: GetServerSidePropsContext,
  roles: UserRole[],
  scope: (user: SessionUser) => Promise<Prisma.InspectionBookingWhereInput | null>,
  tabs: Record<string, readonly BookingStatus[] | null>
) {
  return requirePageAuth(ctx, roles, async (user) => {
    await settleExpiredReviewWindows();
    const base = await scope(user);
    if (!base) return { scoped: false, bookings: [], counts: {}, page: 1, pages: 1 };
    const tabKey = typeof ctx.query.tab === 'string' && ctx.query.tab in tabs ? ctx.query.tab : Object.keys(tabs)[0];
    const statuses = tabs[tabKey];
    const page = Math.max(1, parseInt(String(ctx.query.page || '1')) || 1);
    const where = { ...base, ...(statuses ? { status: { in: [...statuses] } } : {}) };
    const [bookings, total, ...counts] = await Promise.all([
      prisma.inspectionBooking.findMany({ where, include: bookingListInclude, orderBy: { inspectionDate: 'desc' }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
      prisma.inspectionBooking.count({ where }),
      ...Object.values(tabs).map((s) => prisma.inspectionBooking.count({ where: { ...base, ...(s ? { status: { in: [...s] } } : {}) } })),
    ]);
    return {
      scoped: true,
      bookings,
      counts: Object.fromEntries(Object.keys(tabs).map((k, i) => [k, counts[i]])),
      page,
      pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    };
  });
}
