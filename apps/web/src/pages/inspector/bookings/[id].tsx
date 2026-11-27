import type { GetServerSideProps } from 'next';
import { DashboardLayout } from '@/components/layout/Layouts';
import { BookingDetail } from '@/components/bookings/BookingDetail';
import { InspectionWorkspace } from '@/components/bookings/InspectorActions';
import { bookingPageProps, type BookingView } from '@/lib/booking-page';

export const getServerSideProps: GetServerSideProps = (ctx) => bookingPageProps(ctx, 'inspector');

export default function InspectorBooking({ booking }: { booking: BookingView }) {
  return (
    <DashboardLayout title="Inspection">
      <div className="space-y-6">
        <BookingDetail booking={booking} />
        {booking.status === 'INSPECTION_IN_PROGRESS' && <InspectionWorkspace booking={booking} />}
      </div>
    </DashboardLayout>
  );
}
