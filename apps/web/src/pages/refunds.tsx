import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { getSsrUser } from '@/lib/ssr-auth';
import { serialize } from '@/lib/serialize';
import { getInspectionFee, getReviewWindowHours } from '@/lib/settings';
import { formatPKR } from '@/lib/format';
import { Bullets, InfoPage } from '@/components/layout/InfoPage';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const [fee, hours, user] = await Promise.all([getInspectionFee(), getReviewWindowHours(), getSsrUser(ctx)]);
  return { props: serialize({ fee, hours, user }) };
};

export default function Refunds({ fee, hours }: { fee: number; hours: number }) {
  return (
    <InfoPage
      title="Refunds and cancellations"
      page="/refunds"
      updated="28 November 2026"
      intro={<p>This policy covers the {formatPKR(fee)} inspection fee paid through MobCheck. MobCheck does not handle payment for the phone itself; buyers and sellers settle that between themselves.</p>}
      sections={[
        {
          id: 'cancel',
          title: 'Cancelling a booking',
          body: (
            <Bullets
              items={[
                'Before the shop accepts your booking: cancel from your booking page for a full refund.',
                'If the shop declines the booking: you are refunded in full automatically.',
                'After the shop accepts: contact us on WhatsApp. We will help you reschedule or decide on a refund case by case.',
              ]}
            />
          ),
        },
        {
          id: 'disputes',
          title: 'If something is wrong with the report',
          body: (
            <>
              <p>After a report is delivered you have {hours} hours to confirm it or raise a dispute from your booking page. Tell us what is wrong and add any photos.</p>
              <p>MobCheck reviews every dispute with the shop. If the inspection was not carried out properly, we refund the inspection fee in full or in part.</p>
            </>
          ),
        },
        {
          id: 'how',
          title: 'How refunds are paid',
          body: <p>Refunds go back to the original payment method. Banks and wallets usually show them within 5 to 10 working days.</p>,
        },
        {
          id: 'not-covered',
          title: 'What is not covered',
          body: (
            <Bullets
              items={[
                'The price of a phone bought from another user. Always inspect before paying, and never pay a seller in advance.',
                'Faults that appear after the inspection was completed.',
                'No-shows: if you miss your booking without cancelling, the fee may not be refunded.',
              ]}
            />
          ),
        },
        {
          id: 'contact',
          title: 'Need help?',
          body: <p>Message us on WhatsApp or see the <Link href="/help" className="underline underline-offset-4">Help centre</Link>. Please have your booking reference ready.</p>,
        },
      ]}
    />
  );
}
