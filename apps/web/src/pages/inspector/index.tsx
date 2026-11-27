import type { GetServerSideProps } from 'next';
import prisma from '@/lib/prisma';
import { DashboardLayout } from '@/components/layout/Layouts';
import { BookingList } from '@/components/bookings/BookingList';
import { bookingListProps } from '@/lib/booking-list';

const TABS = {
  todo: ['INSPECTOR_ASSIGNED', 'INSPECTION_IN_PROGRESS', 'INSPECTION_SUBMITTED'] as const,
  done: ['REPORT_DELIVERED', 'COMPLETED', 'DISPUTE_RAISED'] as const,
};

export const getServerSideProps: GetServerSideProps = (ctx) =>
  bookingListProps(
    ctx,
    ['INSPECTOR'],
    async (user) => {
      const inspector = await prisma.inspector.findUnique({ where: { userId: user.id }, select: { id: true } });
      return inspector ? { inspectorId: inspector.id } : null;
    },
    TABS
  );

export default function InspectorBookings({ bookings, counts, page, pages }: any) {
  return (
    <DashboardLayout title="My inspections" description="Bookings your shop assigned to you.">
      <BookingList
        bookings={bookings}
        perspective="inspector"
        page={page}
        pages={pages}
        tabs={[
          { key: 'todo', label: 'To do', count: counts.todo },
          { key: 'done', label: 'Reported', count: counts.done },
        ]}
        empty={{ title: 'No inspections assigned', description: 'Your shop owner assigns bookings to you. They will appear here.' }}
      />
    </DashboardLayout>
  );
}
