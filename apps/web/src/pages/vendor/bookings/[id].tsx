import type { GetServerSideProps } from 'next';
import { DashboardLayout } from '@/components/layout/Layouts';
import { BookingDetail } from '@/components/bookings/BookingDetail';
import { bookingPageProps, type BookingView } from '@/lib/booking-page';

export const getServerSideProps: GetServerSideProps = (ctx) => bookingPageProps(ctx, 'shop');

export default function VendorBooking({ booking }: { booking: BookingView }) {
  return (
    <DashboardLayout title="Booking">
      <BookingDetail booking={booking} />
    </DashboardLayout>
  );
}
