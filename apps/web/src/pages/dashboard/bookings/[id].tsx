import type { GetServerSideProps } from 'next';
import { DashboardLayout } from '@/components/layout/Layouts';
import { BookingDetail } from '@/components/bookings/BookingDetail';
import { Alert } from '@/components/ui/Feedback';
import { bookingPageProps, type BookingView } from '@/lib/booking-page';
import { useRouter } from 'next/router';

export const getServerSideProps: GetServerSideProps = (ctx) => bookingPageProps(ctx, 'customer');

export default function CustomerBooking({ booking }: { booking: BookingView }) {
  const router = useRouter();
  return (
    <DashboardLayout title="Inspection booking">
      {router.query.paid && <Alert tone="success" title="Payment received" className="mb-6">{booking.shop.name} has been asked to confirm your appointment.</Alert>}
      {router.query.created && booking.status === 'AWAITING_PAYMENT' && <Alert tone="info" title="Booking created" className="mb-6">Pay the inspection fee to confirm it.</Alert>}
      <BookingDetail booking={booking} />
    </DashboardLayout>
  );
}
