import type { GetServerSideProps } from 'next';
import { DashboardLayout } from '@/components/layout/Layouts';
import { BookingList, BOOKING_TABS } from '@/components/bookings/BookingList';
import { bookingListProps } from '@/lib/booking-list';

const TABS = {
  attention: ['DISPUTE_RAISED', 'REFUND_PENDING', 'INSPECTION_SUBMITTED'] as const,
  active: BOOKING_TABS.active,
  completed: BOOKING_TABS.completed,
  closed: ['CANCELLED', 'REFUNDED'] as const,
  all: null,
};

export const getServerSideProps: GetServerSideProps = (ctx) => {
  // Dashboard links use ?status=DISPUTE_RAISED; map it to the matching tab.
  if (ctx.query.status === 'DISPUTE_RAISED') ctx.query.tab = 'attention';
  return bookingListProps(ctx, ['SUPER_ADMIN', 'OPS_ADMIN'], async () => ({}), TABS);
};

export default function AdminBookings({ bookings, counts, page, pages }: any) {
  return (
    <DashboardLayout title="Bookings" description="All inspection bookings across MobCheck.">
      <BookingList
        bookings={bookings}
        perspective="admin"
        page={page}
        pages={pages}
        tabs={[
          { key: 'attention', label: 'Disputes & refunds', count: counts.attention },
          { key: 'active', label: 'Active', count: counts.active },
          { key: 'completed', label: 'Completed', count: counts.completed },
          { key: 'closed', label: 'Cancelled & refunded', count: counts.closed },
          { key: 'all', label: 'All', count: counts.all },
        ]}
        empty={{ title: 'No bookings here', description: 'Bookings that need attention appear in the first tab.' }}
      />
    </DashboardLayout>
  );
}
