import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { getSsrUser } from '@/lib/ssr-auth';
import { serialize } from '@/lib/serialize';
import { getInspectionFee } from '@/lib/settings';
import { formatPKR } from '@/lib/format';
import { Bullets, InfoPage } from '@/components/layout/InfoPage';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const [fee, user] = await Promise.all([getInspectionFee(), getSsrUser(ctx)]);
  return { props: serialize({ fee, user }) };
};

export default function About({ fee }: { fee: number }) {
  return (
    <InfoPage
      title="About MobCheck"
      page="/about"
      intro={<p>Buying a used phone in Pakistan shouldn&apos;t be a gamble. MobCheck lets anyone have a phone professionally inspected at a verified shop before money changes hands, and lets sellers prove their phone is what they say it is.</p>}
      sections={[
        {
          id: 'mission',
          title: 'Why we built MobCheck',
          body: (
            <>
              <p>Hidden faults, replaced parts, locked iCloud or Google accounts and non-PTA phones cost buyers money every day. Sellers with honest phones struggle to be believed. An independent inspection fixes both problems.</p>
              <p>MobCheck is a marketplace that brings buyers, sellers and trusted repair shops together, with a clear report at the end that anyone can verify.</p>
            </>
          ),
        },
        {
          id: 'how-it-works',
          title: 'How inspections work',
          body: (
            <Bullets
              items={[
                <>Find a phone on MobCheck (or anywhere else) and choose a <Link href="/shops" className="underline underline-offset-4">verified inspection shop</Link>.</>,
                <>Book a time and pay the inspection fee of {formatPKR(fee)} online.</>,
                'Bring the phone. A trained inspector works through a structured checklist: screen and touch, battery health, cameras, speakers and microphones, network and SIM, sensors, buttons, IMEI, PTA status and account locks.',
                'Defects are photographed. You receive a report with a unique number and QR code.',
                <>Anyone can check that the report is genuine on the <Link href="/verify" className="underline underline-offset-4">Verify a report</Link> page.</>,
              ]}
            />
          ),
        },
        {
          id: 'trust',
          title: 'How we keep you safe',
          body: (
            <Bullets
              items={[
                'Shops are checked by MobCheck before they can accept bookings.',
                'Buyers and sellers talk through MobCheck Messages. Phone numbers, emails and outside chat links are blocked so conversations, and any problems, stay where we can help.',
                'Every phone photo uploaded to MobCheck is watermarked and has hidden location data removed.',
                'If something is wrong with a report, you can raise a dispute and our team reviews it.',
              ]}
            />
          ),
        },
        {
          id: 'shops',
          title: 'For repair shops',
          body: (
            <p>
              Shops earn from every inspection they perform and get a public profile with reviews. <Link href="/auth/register?role=SHOP_OWNER" className="underline underline-offset-4">Register your shop</Link> to get started.
            </p>
          ),
        },
      ]}
    />
  );
}
