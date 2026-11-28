import type { GetServerSideProps } from 'next';
import { getSsrUser } from '@/lib/ssr-auth';
import { serialize } from '@/lib/serialize';
import { Bullets, InfoPage } from '@/components/layout/InfoPage';

export const getServerSideProps: GetServerSideProps = async (ctx) => ({ props: serialize({ user: await getSsrUser(ctx) }) });

export default function Privacy() {
  return (
    <InfoPage
      title="Privacy policy"
      page="/privacy"
      updated="28 November 2026"
      intro={<p>This page explains what information MobCheck collects, why, and the choices you have. We collect only what we need to run the marketplace and keep it safe.</p>}
      sections={[
        {
          id: 'collect',
          title: 'What we collect',
          body: (
            <Bullets
              items={[
                'Account details: your name, email address, mobile number and password (stored only as a secure hash).',
                'Listings: phone details, price, area and the photos you upload.',
                'Messages you send on MobCheck, including attempts that were blocked for containing contact details.',
                'Bookings, inspection reports, reviews, disputes and complaints.',
                'Payment records for inspection fees. Card and wallet details are handled by the payment provider, not stored by MobCheck.',
              ]}
            />
          ),
        },
        {
          id: 'use',
          title: 'How we use it',
          body: (
            <Bullets
              items={[
                'To run your account, listings, bookings and messages.',
                'To keep MobCheck safe: preventing scams, reviewing reported content and resolving disputes.',
                'To send you notifications about your bookings and messages.',
                'To improve MobCheck. We do not sell your personal information.',
              ]}
            />
          ),
        },
        {
          id: 'sharing',
          title: 'What other people see',
          body: (
            <Bullets
              items={[
                'Buyers see your first name, area and listing. Your phone number and email are never shown to other users.',
                'Shops see the name on a booking and the details needed to carry out the inspection.',
                'Public report pages show the device and result, not your contact details or IMEI.',
              ]}
            />
          ),
        },
        {
          id: 'photos',
          title: 'Photos',
          body: <p>When you upload a phone photo, MobCheck resizes it, removes hidden metadata such as GPS location and camera details, and adds a MobCheck watermark.</p>,
        },
        {
          id: 'assistant',
          title: 'Help assistant and automatic checks',
          body: <p>Questions you type into the Help assistant, and photos sent in Messages, may be processed by our AI provider to answer you and to check that photos show a phone. They are used only for that purpose. If you contact us on WhatsApp, WhatsApp&apos;s own privacy policy also applies.</p>,
        },
        {
          id: 'cookies',
          title: 'Cookies and storage',
          body: (
            <Bullets
              items={[
                'One secure, http-only cookie keeps you signed in. We do not use advertising cookies.',
                'Saved phones and your Help chat are stored in your own browser on this device.',
              ]}
            />
          ),
        },
        {
          id: 'retention',
          title: 'How long we keep it',
          body: <p>We keep your information while your account is active and for as long as needed to resolve disputes, prevent fraud and meet legal requirements. Ask us to delete your account at any time.</p>,
        },
        {
          id: 'rights',
          title: 'Your choices',
          body: <p>You can update your profile at any time. To get a copy of your data, correct it, or delete your account, contact us on WhatsApp from the number linked to your account.</p>,
        },
      ]}
    />
  );
}
