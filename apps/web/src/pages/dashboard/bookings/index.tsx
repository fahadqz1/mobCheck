import type { GetServerSideProps } from 'next';
import { DashboardLayout } from '@/components/layout/Layouts';
import { BookingList, BOOKING_TABS } from '@/components/bookings/BookingList';
import { LinkButton } from '@/components/ui/Button';
import { bookingListProps } from '@/lib/booking-list';

const TABS = { active: BOOKING_TABS.active, completed: BOOKING_TABS.completed, closed: BOOKING_TABS.closed, all: null };

export const getServerSideProps: GetServerSideProps = (ctx) => bookingListProps(ctx, ['CUSTOMER', 'SELLER'], async (user) => ({ customerId: user.id }), TABS);

export default function MyBookings({ bookings, counts, page, pages }: any) {
  return (
    <DashboardLayout title="My inspections" description="Inspections you have booked at MobCheck shops." actions={<LinkButton href="/shops">Book an inspection</LinkButton>}>
      <BookingList
        bookings={bookings}
        perspective="customer"
        page={page}
        pages={pages}
        tabs={[
          { key: 'active', label: 'Active', count: counts.active },
          { key: 'completed', label: 'Completed', count: counts.completed },
          { key: 'closed', label: 'Cancelled & disputes', count: counts.closed },
          { key: 'all', label: 'All', count: counts.all },
        ]}
        empty={{ title: 'No inspections here', description: 'Book an inspection to have a phone checked before you buy it.', action: <LinkButton href="/shops">Find a shop</LinkButton> }}
      />
    </DashboardLayout>
  );
}
