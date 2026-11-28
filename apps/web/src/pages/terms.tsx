import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { getSsrUser } from '@/lib/ssr-auth';
import { serialize } from '@/lib/serialize';
import { Bullets, InfoPage } from '@/components/layout/InfoPage';

export const getServerSideProps: GetServerSideProps = async (ctx) => ({ props: serialize({ user: await getSsrUser(ctx) }) });

export default function Terms() {
  return (
    <InfoPage
      title="Terms of use"
      page="/terms"
      updated="28 November 2026"
      intro={<p>These terms apply when you use MobCheck to buy or sell phones, book inspections or run an inspection shop. By creating an account or using the site you agree to them.</p>}
      sections={[
        {
          id: 'service',
          title: 'What MobCheck does',
          body: (
            <p>
              MobCheck is an online marketplace. We connect buyers and sellers of used phones, and customers with independent shops that carry out inspections. MobCheck is not the seller of phones listed by users and does not take part in the sale itself.
            </p>
          ),
        },
        {
          id: 'accounts',
          title: 'Your account',
          body: (
            <Bullets
              items={[
                'Give accurate details and keep your password private. You are responsible for activity on your account.',
                'One person or business per account. We may suspend accounts that break these terms.',
              ]}
            />
          ),
        },
        {
          id: 'listings',
          title: 'Listing a phone',
          body: (
            <Bullets
              items={[
                'Only list phones you own and have the right to sell. Stolen, blacklisted or counterfeit phones are not allowed.',
                'Describe the phone honestly, including faults, repairs, PTA status and account locks.',
                'Use your own photos of the actual phone. MobCheck adds a watermark and removes location data from uploaded photos.',
                'We may remove listings that are misleading or reported for good reason.',
              ]}
            />
          ),
        },
        {
          id: 'messages',
          title: 'Messages and conduct',
          body: (
            <>
              <p>To protect everyone from scams, MobCheck Messages blocks phone numbers, email addresses and outside chat links, and only allows photos of the phone, its box or accessories. Blocked attempts are recorded for safety reviews.</p>
              <Bullets items={['Be respectful. Harassment, hate speech and spam are not allowed.', 'Do not try to move buyers or sellers off MobCheck to avoid these protections.']} />
            </>
          ),
        },
        {
          id: 'inspections',
          title: 'Inspections and reports',
          body: (
            <>
              <p>Inspections are carried out by independent shops verified by MobCheck, using MobCheck&apos;s checklist. A report describes the phone&apos;s condition at the time it was inspected; it is not a warranty against future faults.</p>
              <p>
                Fees, cancellations and disputes are covered by our <Link href="/refunds" className="underline underline-offset-4">refund policy</Link>.
              </p>
            </>
          ),
        },
        {
          id: 'shops',
          title: 'Shops',
          body: (
            <Bullets
              items={[
                'Shops must provide accurate business details and pass verification before accepting bookings.',
                'Inspectors must follow the checklist honestly and photograph defects they find.',
                'MobCheck may suspend shops that issue misleading reports or receive repeated upheld complaints.',
              ]}
            />
          ),
        },
        {
          id: 'pta',
          title: 'PTA Status link',
          body: <p>The &ldquo;PTA Status&rdquo; link opens the official Pakistan Telecommunication Authority DIRBS website in a new tab. MobCheck is not affiliated with PTA and does not check or submit IMEI numbers to PTA on your behalf.</p>,
        },
        {
          id: 'liability',
          title: 'Our responsibility',
          body: <p>We work hard to keep MobCheck safe and accurate, but we cannot guarantee every listing or user. Always inspect a phone and meet safely before paying. Nothing in these terms limits rights you have under Pakistani law.</p>,
        },
        {
          id: 'changes',
          title: 'Changes to these terms',
          body: <p>We may update these terms as MobCheck grows. We will show the date of the latest version at the top of this page and tell you about important changes.</p>,
        },
      ]}
    />
  );
}
