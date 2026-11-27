import type { GetServerSideProps } from 'next';
import prisma from '@/lib/prisma';
import { DashboardLayout } from '@/components/layout/Layouts';
import { BookingList, BOOKING_TABS } from '@/components/bookings/BookingList';
import { NeedsShop } from '@/components/vendor/NeedsShop';
import { bookingListProps } from '@/lib/booking-list';

const TABS = {
  attention: ['AWAITING_SHOP_CONFIRMATION', 'PAYMENT_CONFIRMED', 'BOOKING_ACCEPTED'] as const,
  progress: ['INSPECTOR_ASSIGNED', 'INSPECTION_IN_PROGRESS', 'INSPECTION_SUBMITTED', 'REPORT_DELIVERED'] as const,
  completed: BOOKING_TABS.completed,
  closed: ['CANCELLED', 'REFUND_PENDING', 'REFUNDED', 'DISPUTE_RAISED'] as const,
};

export const getServerSideProps: GetServerSideProps = (ctx) =>
  bookingListProps(
    ctx,
    ['SHOP_OWNER'],
    async (user) => {
      const shop = await prisma.shop.findFirst({ where: { ownerId: user.id }, select: { id: true } });
      // Unpaid bookings are not shown to shops: they are not confirmed yet.
      return shop ? { shopId: shop.id, status: { not: 'AWAITING_PAYMENT' } } : null;
    },
    TABS
  );

export default function VendorBookings({ scoped, bookings, counts, page, pages }: any) {
  return (
    <DashboardLayout title="Bookings" description="Paid inspection bookings at your shop.">
      {!scoped ? (
        <NeedsShop />
      ) : (
        <BookingList
          bookings={bookings}
          perspective="shop"
          page={page}
          pages={pages}
          tabs={[
            { key: 'attention', label: 'Needs action', count: counts.attention },
            { key: 'progress', label: 'In progress', count: counts.progress },
            { key: 'completed', label: 'Completed', count: counts.completed },
            { key: 'closed', label: 'Cancelled & disputes', count: counts.closed },
          ]}
          empty={{ title: 'Nothing here', description: 'Paid bookings from customers appear here.' }}
        />
      )}
    </DashboardLayout>
  );
}
